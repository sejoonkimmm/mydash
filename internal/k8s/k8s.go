package k8s

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

// ========== Client helper ==========

func getClientset(kubeconfig, ctxName string) (*kubernetes.Clientset, error) {
	if kubeconfig == "" {
		home, _ := os.UserHomeDir()
		kubeconfig = filepath.Join(home, ".kube", "config")
	}
	cfg, err := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(
		&clientcmd.ClientConfigLoadingRules{ExplicitPath: kubeconfig},
		&clientcmd.ConfigOverrides{CurrentContext: ctxName},
	).ClientConfig()
	if err != nil {
		return nil, fmt.Errorf("config: %w", err)
	}
	cfg.Timeout = 10 * time.Second
	cs, err := kubernetes.NewForConfig(cfg)
	if err != nil {
		return nil, fmt.Errorf("client: %w", err)
	}
	return cs, nil
}

// ========== Cluster Status ==========

type ClusterStatus struct {
	Name        string `json:"name"`
	Reachable   bool   `json:"reachable"`
	Nodes       int    `json:"nodes"`
	NodesReady  int    `json:"nodesReady"`
	PodsRunning int    `json:"podsRunning"`
	PodsPending int    `json:"podsPending"`
	PodsFailed  int    `json:"podsFailed"`
	MemCapacity string `json:"memCapacity"` // e.g. "64.0 Gi"
	MemUsed     string `json:"memUsed"`     // e.g. "42.3 Gi"
	MemPct      float64 `json:"memPct"`     // percentage
	CPUCapacity string `json:"cpuCapacity"` // e.g. "16 cores"
	CPUUsed     string `json:"cpuUsed"`     // e.g. "8.2 cores"
	CPUPct      float64 `json:"cpuPct"`     // percentage
	Error       string `json:"error"`
}

func GetClusterStatuses(kubeconfig string, contexts []string) []ClusterStatus {
	if kubeconfig == "" {
		home, _ := os.UserHomeDir()
		kubeconfig = filepath.Join(home, ".kube", "config")
	}

	statuses := make([]ClusterStatus, len(contexts))
	ch := make(chan struct {
		idx    int
		status ClusterStatus
	}, len(contexts))

	for i, ctx := range contexts {
		go func(idx int, ctxName string) {
			s := getStatus(kubeconfig, ctxName)
			ch <- struct {
				idx    int
				status ClusterStatus
			}{idx, s}
		}(i, ctx)
	}

	for range contexts {
		r := <-ch
		statuses[r.idx] = r.status
	}

	return statuses
}

func getStatus(kubeconfig, ctxName string) ClusterStatus {
	status := ClusterStatus{Name: ctxName}

	cfg, err := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(
		&clientcmd.ClientConfigLoadingRules{ExplicitPath: kubeconfig},
		&clientcmd.ConfigOverrides{CurrentContext: ctxName},
	).ClientConfig()
	if err != nil {
		status.Error = fmt.Sprintf("config: %v", err)
		return status
	}
	cfg.Timeout = 5 * time.Second

	clientset, err := kubernetes.NewForConfig(cfg)
	if err != nil {
		status.Error = fmt.Sprintf("client: %v", err)
		return status
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	nodes, err := clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		status.Error = fmt.Sprintf("nodes: %v", err)
		return status
	}
	status.Reachable = true
	status.Nodes = len(nodes.Items)
	var totalCPUMillis int64
	var totalMemBytes int64
	for _, n := range nodes.Items {
		for _, c := range n.Status.Conditions {
			if c.Type == "Ready" && c.Status == "True" {
				status.NodesReady++
			}
		}
		totalCPUMillis += n.Status.Capacity.Cpu().MilliValue()
		totalMemBytes += n.Status.Capacity.Memory().Value()
	}
	status.CPUCapacity = formatCPU(totalCPUMillis)
	status.MemCapacity = formatBytes(totalMemBytes)

	// Try to get usage from metrics-server
	metricsData, err := clientset.RESTClient().
		Get().
		AbsPath("/apis/metrics.k8s.io/v1beta1/nodes").
		DoRaw(ctx)
	if err == nil {
		var list metricsNodeList
		if json.Unmarshal(metricsData, &list) == nil {
			var usedCPUMillis int64
			var usedMemBytes int64
			for _, item := range list.Items {
				usedCPUMillis += parseMilliCPU(item.Usage.CPU)
				usedMemBytes += parseMemoryBytes(item.Usage.Memory)
			}
			status.CPUUsed = formatCPU(usedCPUMillis)
			status.MemUsed = formatBytes(usedMemBytes)
			if totalCPUMillis > 0 {
				status.CPUPct = float64(usedCPUMillis) / float64(totalCPUMillis) * 100
			}
			if totalMemBytes > 0 {
				status.MemPct = float64(usedMemBytes) / float64(totalMemBytes) * 100
			}
		}
	}

	pods, err := clientset.CoreV1().Pods("").List(ctx, metav1.ListOptions{})
	if err != nil {
		status.Error = fmt.Sprintf("pods: %v", err)
		return status
	}
	for _, p := range pods.Items {
		switch p.Status.Phase {
		case "Running", "Succeeded":
			status.PodsRunning++
		case "Pending":
			status.PodsPending++
		case "Failed":
			status.PodsFailed++
		}
	}

	return status
}

// ========== Cluster Detail ==========

type ClusterDetail struct {
	Name       string      `json:"name"`
	Nodes      []NodeInfo  `json:"nodes"`
	Namespaces []Namespace `json:"namespaces"`
	Events     []Event     `json:"events"`
	Error      string      `json:"error"`
}

type NodeInfo struct {
	Name   string `json:"name"`
	Status string `json:"status"`
	Roles  string `json:"roles"`
	Age    string `json:"age"`
	CPUCap string `json:"cpuCap"`
	MemCap string `json:"memCap"`
}

type Namespace struct {
	Name        string `json:"name"`
	PodsRunning int    `json:"podsRunning"`
	PodsPending int    `json:"podsPending"`
	PodsFailed  int    `json:"podsFailed"`
}

type Event struct {
	Type    string `json:"type"`
	Reason  string `json:"reason"`
	Message string `json:"message"`
	Object  string `json:"object"`
	Age     string `json:"age"`
}

func GetClusterDetail(kubeconfig, contextName string) *ClusterDetail {
	if kubeconfig == "" {
		home, _ := os.UserHomeDir()
		kubeconfig = filepath.Join(home, ".kube", "config")
	}

	detail := &ClusterDetail{Name: contextName}

	cfg, err := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(
		&clientcmd.ClientConfigLoadingRules{ExplicitPath: kubeconfig},
		&clientcmd.ConfigOverrides{CurrentContext: contextName},
	).ClientConfig()
	if err != nil {
		detail.Error = err.Error()
		return detail
	}
	cfg.Timeout = 10 * time.Second

	clientset, err := kubernetes.NewForConfig(cfg)
	if err != nil {
		detail.Error = err.Error()
		return detail
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Nodes
	nodes, err := clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err == nil {
		now := time.Now()
		for _, n := range nodes.Items {
			status := "NotReady"
			for _, c := range n.Status.Conditions {
				if c.Type == "Ready" && c.Status == "True" {
					status = "Ready"
				}
			}

			roles := []string{}
			for label := range n.Labels {
				if strings.HasPrefix(label, "node-role.kubernetes.io/") {
					role := strings.TrimPrefix(label, "node-role.kubernetes.io/")
					if role != "" {
						roles = append(roles, role)
					}
				}
			}
			roleStr := strings.Join(roles, ",")
			if roleStr == "" {
				roleStr = "<none>"
			}

			age := formatAge(now.Sub(n.CreationTimestamp.Time))
			cpuCap := n.Status.Capacity.Cpu().String()
			memCap := formatBytes(n.Status.Capacity.Memory().Value())

			detail.Nodes = append(detail.Nodes, NodeInfo{
				Name:   n.Name,
				Status: status,
				Roles:  roleStr,
				Age:    age,
				CPUCap: cpuCap,
				MemCap: memCap,
			})
		}
	}

	// Namespaces + pod counts
	nsList, err := clientset.CoreV1().Namespaces().List(ctx, metav1.ListOptions{})
	if err == nil {
		pods, podErr := clientset.CoreV1().Pods("").List(ctx, metav1.ListOptions{})
		nsMap := map[string]*Namespace{}
		for _, ns := range nsList.Items {
			nsMap[ns.Name] = &Namespace{Name: ns.Name}
		}
		if podErr == nil {
			for _, p := range pods.Items {
				ns, ok := nsMap[p.Namespace]
				if !ok {
					continue
				}
				switch p.Status.Phase {
				case "Running", "Succeeded":
					ns.PodsRunning++
				case "Pending":
					ns.PodsPending++
				case "Failed":
					ns.PodsFailed++
				}
			}
		}
		for _, ns := range nsList.Items {
			detail.Namespaces = append(detail.Namespaces, *nsMap[ns.Name])
		}
	}

	// Events — fetch all, prioritize warnings, cap at 20
	evList, err := clientset.CoreV1().Events("").List(ctx, metav1.ListOptions{})
	if err == nil {
		now := time.Now()
		type evWithTime struct {
			ev   Event
			t    time.Time
			warn bool
		}
		var collected []evWithTime
		for _, e := range evList.Items {
			t := e.LastTimestamp.Time
			if t.IsZero() {
				t = e.EventTime.Time
			}
			collected = append(collected, evWithTime{
				ev: Event{
					Type:    e.Type,
					Reason:  e.Reason,
					Message: e.Message,
					Object:  fmt.Sprintf("%s/%s", e.InvolvedObject.Kind, e.InvolvedObject.Name),
					Age:     formatAge(now.Sub(t)),
				},
				t:    t,
				warn: e.Type == "Warning",
			})
		}
		// Sort: warnings first, then by recency
		sort.Slice(collected, func(i, j int) bool {
			if collected[i].warn != collected[j].warn {
				return collected[i].warn
			}
			return collected[i].t.After(collected[j].t)
		})
		limit := 20
		if len(collected) < limit {
			limit = len(collected)
		}
		for _, e := range collected[:limit] {
			detail.Events = append(detail.Events, e.ev)
		}
	}

	return detail
}

// ========== Pods ==========

type PodInfo struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Status    string `json:"status"`
	Ready     string `json:"ready"`   // e.g. "1/1"
	Restarts  int32  `json:"restarts"`
	Age       string `json:"age"`
	Node      string `json:"node"`
	IP        string `json:"ip"`
	CPU       string `json:"cpu"`    // from metrics if available
	Memory    string `json:"memory"` // from metrics if available
}

// GetPods returns all pods for a cluster, optionally filtered by namespace.
// Pass namespace="" to list across all namespaces.
func GetPods(kubeconfig, ctxName, namespace string) []PodInfo {
	cs, err := getClientset(kubeconfig, ctxName)
	if err != nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pods, err := cs.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil
	}

	now := time.Now()
	result := make([]PodInfo, 0, len(pods.Items))
	for _, p := range pods.Items {
		// Count ready containers
		totalContainers := int32(len(p.Spec.Containers))
		readyContainers := int32(0)
		totalRestarts := int32(0)
		for _, cs := range p.Status.ContainerStatuses {
			if cs.Ready {
				readyContainers++
			}
			totalRestarts += cs.RestartCount
		}

		phase := string(p.Status.Phase)
		// Refine status: if terminated or waiting, show reason
		if phase == "Running" {
			for _, cs := range p.Status.ContainerStatuses {
				if !cs.Ready {
					if cs.State.Waiting != nil && cs.State.Waiting.Reason != "" {
						phase = cs.State.Waiting.Reason
					} else if cs.State.Terminated != nil && cs.State.Terminated.Reason != "" {
						phase = cs.State.Terminated.Reason
					}
				}
			}
		}

		result = append(result, PodInfo{
			Name:      p.Name,
			Namespace: p.Namespace,
			Status:    phase,
			Ready:     fmt.Sprintf("%d/%d", readyContainers, totalContainers),
			Restarts:  totalRestarts,
			Age:       formatAge(now.Sub(p.CreationTimestamp.Time)),
			Node:      p.Spec.NodeName,
			IP:        p.Status.PodIP,
		})
	}
	return result
}

// GetPodLogs returns the last N lines of logs for a pod/container.
// Pass container="" to use the first container.
func GetPodLogs(kubeconfig, ctxName, namespace, podName, container string, lines int64) (string, error) {
	cs, err := getClientset(kubeconfig, ctxName)
	if err != nil {
		return "", err
	}

	opts := &corev1.PodLogOptions{
		TailLines: &lines,
	}
	if container != "" {
		opts.Container = container
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req := cs.CoreV1().Pods(namespace).GetLogs(podName, opts)
	stream, err := req.Stream(ctx)
	if err != nil {
		return "", fmt.Errorf("log stream: %w", err)
	}
	defer stream.Close()

	var buf bytes.Buffer
	if _, err := io.Copy(&buf, io.LimitReader(stream, 5*1024*1024)); err != nil {
		return "", fmt.Errorf("read logs: %w", err)
	}
	return buf.String(), nil
}

// DeletePod deletes a pod (causes it to be restarted by its controller).
func DeletePod(kubeconfig, ctxName, namespace, podName string) error {
	if namespace == "" {
		return fmt.Errorf("namespace must not be empty")
	}
	if podName == "" {
		return fmt.Errorf("podName must not be empty")
	}
	cs, err := getClientset(kubeconfig, ctxName)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	return cs.CoreV1().Pods(namespace).Delete(ctx, podName, metav1.DeleteOptions{})
}

// ========== Deployments ==========

type DeploymentInfo struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Ready     string `json:"ready"`    // e.g. "3/3"
	UpToDate  int32  `json:"upToDate"`
	Available int32  `json:"available"`
	Age       string `json:"age"`
	Image     string `json:"image"` // first container image
}

// GetDeployments lists deployments, optionally filtered by namespace.
func GetDeployments(kubeconfig, ctxName, namespace string) []DeploymentInfo {
	cs, err := getClientset(kubeconfig, ctxName)
	if err != nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	deps, err := cs.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil
	}

	now := time.Now()
	result := make([]DeploymentInfo, 0, len(deps.Items))
	for _, d := range deps.Items {
		image := ""
		if len(d.Spec.Template.Spec.Containers) > 0 {
			image = d.Spec.Template.Spec.Containers[0].Image
		}
		desired := d.Status.Replicas
		ready := d.Status.ReadyReplicas
		result = append(result, DeploymentInfo{
			Name:      d.Name,
			Namespace: d.Namespace,
			Ready:     fmt.Sprintf("%d/%d", ready, desired),
			UpToDate:  d.Status.UpdatedReplicas,
			Available: d.Status.AvailableReplicas,
			Age:       formatAge(now.Sub(d.CreationTimestamp.Time)),
			Image:     image,
		})
	}
	return result
}

// ScaleDeployment sets the replica count for a deployment.
func ScaleDeployment(kubeconfig, ctxName, namespace, name string, replicas int32) error {
	if replicas < 0 || replicas > 1000 {
		return fmt.Errorf("replicas %d out of valid range [0, 1000]", replicas)
	}
	cs, err := getClientset(kubeconfig, ctxName)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	scale, err := cs.AppsV1().Deployments(namespace).GetScale(ctx, name, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("get scale: %w", err)
	}
	scale.Spec.Replicas = replicas
	_, err = cs.AppsV1().Deployments(namespace).UpdateScale(ctx, name, scale, metav1.UpdateOptions{})
	return err
}

// RestartDeployment triggers a rolling restart by patching the pod template annotation.
func RestartDeployment(kubeconfig, ctxName, namespace, name string) error {
	if namespace == "" {
		return fmt.Errorf("namespace must not be empty")
	}
	if name == "" {
		return fmt.Errorf("name must not be empty")
	}
	cs, err := getClientset(kubeconfig, ctxName)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	patch := fmt.Sprintf(`{"spec":{"template":{"metadata":{"annotations":{"kubectl.kubernetes.io/restartedAt":"%s"}}}}}`,
		time.Now().UTC().Format(time.RFC3339))
	_, err = cs.AppsV1().Deployments(namespace).Patch(
		ctx, name, types.StrategicMergePatchType, []byte(patch), metav1.PatchOptions{},
	)
	return err
}

// ========== Services ==========

type ServiceInfo struct {
	Name       string `json:"name"`
	Namespace  string `json:"namespace"`
	Type       string `json:"type"`
	ClusterIP  string `json:"clusterIP"`
	ExternalIP string `json:"externalIP"`
	Ports      string `json:"ports"`
	Age        string `json:"age"`
}

// GetServices lists services, optionally filtered by namespace.
func GetServices(kubeconfig, ctxName, namespace string) []ServiceInfo {
	cs, err := getClientset(kubeconfig, ctxName)
	if err != nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	svcs, err := cs.CoreV1().Services(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil
	}

	now := time.Now()
	result := make([]ServiceInfo, 0, len(svcs.Items))
	for _, s := range svcs.Items {
		externalIP := "<none>"
		switch s.Spec.Type {
		case corev1.ServiceTypeLoadBalancer:
			ips := []string{}
			for _, ing := range s.Status.LoadBalancer.Ingress {
				if ing.IP != "" {
					ips = append(ips, ing.IP)
				} else if ing.Hostname != "" {
					ips = append(ips, ing.Hostname)
				}
			}
			if len(ips) > 0 {
				externalIP = strings.Join(ips, ",")
			} else {
				externalIP = "<pending>"
			}
		case corev1.ServiceTypeExternalName:
			externalIP = s.Spec.ExternalName
		}

		ports := []string{}
		for _, p := range s.Spec.Ports {
			if p.NodePort != 0 {
				ports = append(ports, fmt.Sprintf("%d:%d/%s", p.Port, p.NodePort, p.Protocol))
			} else {
				ports = append(ports, fmt.Sprintf("%d/%s", p.Port, p.Protocol))
			}
		}
		portsStr := strings.Join(ports, ",")
		if portsStr == "" {
			portsStr = "<none>"
		}

		result = append(result, ServiceInfo{
			Name:       s.Name,
			Namespace:  s.Namespace,
			Type:       string(s.Spec.Type),
			ClusterIP:  s.Spec.ClusterIP,
			ExternalIP: externalIP,
			Ports:      portsStr,
			Age:        formatAge(now.Sub(s.CreationTimestamp.Time)),
		})
	}
	return result
}

// ========== Node operations ==========

// CordonNode marks a node as unschedulable.
func CordonNode(kubeconfig, ctxName, nodeName string) error {
	if nodeName == "" {
		return fmt.Errorf("nodeName must not be empty")
	}
	return patchNodeUnschedulable(kubeconfig, ctxName, nodeName, true)
}

// UncordonNode marks a node as schedulable.
func UncordonNode(kubeconfig, ctxName, nodeName string) error {
	if nodeName == "" {
		return fmt.Errorf("nodeName must not be empty")
	}
	return patchNodeUnschedulable(kubeconfig, ctxName, nodeName, false)
}

// DrainNode cordons the node (marks it unschedulable). Full pod eviction is not implemented;
// use kubectl drain for production drains.
func DrainNode(kubeconfig, ctxName, nodeName string) error {
	if nodeName == "" {
		return fmt.Errorf("nodeName must not be empty")
	}
	return CordonNode(kubeconfig, ctxName, nodeName)
}

func patchNodeUnschedulable(kubeconfig, ctxName, nodeName string, unschedulable bool) error {
	cs, err := getClientset(kubeconfig, ctxName)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	patch := fmt.Sprintf(`{"spec":{"unschedulable":%v}}`, unschedulable)
	_, err = cs.CoreV1().Nodes().Patch(
		ctx, nodeName, types.StrategicMergePatchType, []byte(patch), metav1.PatchOptions{},
	)
	return err
}

// ========== Node Metrics ==========

type NodeMetrics struct {
	Name     string  `json:"name"`
	CPUUsage string  `json:"cpuUsage"` // e.g. "250m"
	CPUPct   float64 `json:"cpuPct"`   // percentage of capacity
	MemUsage string  `json:"memUsage"` // e.g. "1.2Gi"
	MemPct   float64 `json:"memPct"`   // percentage of capacity
}

// metricsNodeList mirrors the relevant parts of the metrics.k8s.io NodeMetricsList.
type metricsNodeList struct {
	Items []struct {
		Metadata struct {
			Name string `json:"name"`
		} `json:"metadata"`
		Usage struct {
			CPU    string `json:"cpu"`
			Memory string `json:"memory"`
		} `json:"usage"`
	} `json:"items"`
}

// GetNodeMetrics queries the metrics-server API. Returns empty slice if unavailable.
func GetNodeMetrics(kubeconfig, ctxName string) []NodeMetrics {
	cs, err := getClientset(kubeconfig, ctxName)
	if err != nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Fetch node capacities for percentage calculation
	nodes, err := cs.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil
	}
	capMap := map[string]struct {
		cpuMillis int64
		memBytes  int64
	}{}
	for _, n := range nodes.Items {
		cpuCap := n.Status.Capacity.Cpu().MilliValue()
		memCap := n.Status.Capacity.Memory().Value()
		capMap[n.Name] = struct {
			cpuMillis int64
			memBytes  int64
		}{cpuCap, memCap}
	}

	// Call metrics API via raw REST
	data, err := cs.RESTClient().
		Get().
		AbsPath("/apis/metrics.k8s.io/v1beta1/nodes").
		DoRaw(ctx)
	if err != nil {
		// metrics-server not available
		return nil
	}

	var list metricsNodeList
	if err := json.Unmarshal(data, &list); err != nil {
		return nil
	}

	result := make([]NodeMetrics, 0, len(list.Items))
	for _, item := range list.Items {
		nm := NodeMetrics{
			Name:     item.Metadata.Name,
			CPUUsage: item.Usage.CPU,
			MemUsage: item.Usage.Memory,
		}

		// Parse CPU (e.g. "250m" or "1" core)
		cpuMillis := parseMilliCPU(item.Usage.CPU)
		memBytes := parseMemoryBytes(item.Usage.Memory)

		if cap, ok := capMap[item.Metadata.Name]; ok {
			if cap.cpuMillis > 0 {
				nm.CPUPct = float64(cpuMillis) / float64(cap.cpuMillis) * 100
			}
			if cap.memBytes > 0 {
				nm.MemPct = float64(memBytes) / float64(cap.memBytes) * 100
			}
		}

		result = append(result, nm)
	}
	return result
}

// parseMilliCPU converts a CPU string like "250m", "2", or "1280878577n" to millicores.
func parseMilliCPU(s string) int64 {
	if strings.HasSuffix(s, "n") {
		val := int64(0)
		fmt.Sscanf(strings.TrimSuffix(s, "n"), "%d", &val)
		return val / 1_000_000
	}
	if strings.HasSuffix(s, "m") {
		val := int64(0)
		fmt.Sscanf(strings.TrimSuffix(s, "m"), "%d", &val)
		return val
	}
	val := int64(0)
	fmt.Sscanf(s, "%d", &val)
	return val * 1000
}

// parseMemoryBytes converts memory strings like "1Ki", "512Mi", "2Gi" to bytes.
func parseMemoryBytes(s string) int64 {
	suffixes := []struct {
		suffix string
		mult   int64
	}{
		{"Ki", 1024},
		{"Mi", 1024 * 1024},
		{"Gi", 1024 * 1024 * 1024},
		{"Ti", 1024 * 1024 * 1024 * 1024},
		{"k", 1000},
		{"M", 1000 * 1000},
		{"G", 1000 * 1000 * 1000},
	}
	for _, sf := range suffixes {
		if strings.HasSuffix(s, sf.suffix) {
			val := int64(0)
			fmt.Sscanf(strings.TrimSuffix(s, sf.suffix), "%d", &val)
			return val * sf.mult
		}
	}
	val := int64(0)
	fmt.Sscanf(s, "%d", &val)
	return val
}

// ========== Utility ==========

func formatBytes(b int64) string {
	const gi = 1024 * 1024 * 1024
	const mi = 1024 * 1024
	switch {
	case b >= gi:
		return fmt.Sprintf("%.1f Gi", float64(b)/float64(gi))
	case b >= mi:
		return fmt.Sprintf("%.0f Mi", float64(b)/float64(mi))
	default:
		return fmt.Sprintf("%d Ki", b/1024)
	}
}

func formatCPU(millis int64) string {
	if millis%1000 == 0 {
		return fmt.Sprintf("%d cores", millis/1000)
	}
	return fmt.Sprintf("%.1f cores", float64(millis)/1000)
}

func formatAge(d time.Duration) string {
	if d < 0 {
		d = 0
	}
	switch {
	case d < time.Minute:
		return fmt.Sprintf("%ds", int(d.Seconds()))
	case d < time.Hour:
		return fmt.Sprintf("%dm", int(d.Minutes()))
	case d < 24*time.Hour:
		return fmt.Sprintf("%dh", int(d.Hours()))
	default:
		return fmt.Sprintf("%dd", int(d.Hours()/24))
	}
}
