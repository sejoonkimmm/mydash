package main

import (
	"context"

	"mydash/internal/calendar"
	"mydash/internal/config"
	"mydash/internal/holidays"
	"mydash/internal/k8s"
	"mydash/internal/localcal"
	"mydash/internal/sysmon"
	"mydash/internal/weather"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// ========== Weather ==========

func (a *App) GetWeather(cities []string, forecastDays int) []*weather.CityWeather {
	return weather.GetMultiCityWeather(cities, forecastDays)
}

// ========== Calendar ==========

type CalendarAccountInput struct {
	Name            string `json:"name"`
	CredentialsFile string `json:"credentialsFile"`
	TokenFile       string `json:"tokenFile"`
	Color           string `json:"color"`
}

func (a *App) GetCalendarEvents(accounts []CalendarAccountInput, lookaheadHours int) ([]calendar.Event, error) {
	accs := make([]calendar.AccountConfig, len(accounts))
	for i, acc := range accounts {
		accs[i] = calendar.AccountConfig{
			Name:            acc.Name,
			CredentialsFile: acc.CredentialsFile,
			TokenFile:       acc.TokenFile,
			Color:           acc.Color,
		}
	}
	return calendar.GetEvents(accs, lookaheadHours)
}

// ========== Kubernetes — Cluster ==========

func (a *App) GetK8sStatuses(kubeconfig string, contexts []string) []k8s.ClusterStatus {
	return k8s.GetClusterStatuses(kubeconfig, contexts)
}

func (a *App) GetK8sClusterDetail(kubeconfig, contextName string) *k8s.ClusterDetail {
	return k8s.GetClusterDetail(kubeconfig, contextName)
}

// ========== Kubernetes — Pods ==========

func (a *App) GetK8sPods(kubeconfig, contextName, namespace string) []k8s.PodInfo {
	return k8s.GetPods(kubeconfig, contextName, namespace)
}

func (a *App) GetK8sPodLogs(kubeconfig, contextName, namespace, podName, container string, lines int64) (string, error) {
	return k8s.GetPodLogs(kubeconfig, contextName, namespace, podName, container, lines)
}

func (a *App) DeleteK8sPod(kubeconfig, contextName, namespace, podName string) error {
	return k8s.DeletePod(kubeconfig, contextName, namespace, podName)
}

// ========== Kubernetes — Deployments ==========

func (a *App) GetK8sDeployments(kubeconfig, contextName, namespace string) []k8s.DeploymentInfo {
	return k8s.GetDeployments(kubeconfig, contextName, namespace)
}

func (a *App) ScaleK8sDeployment(kubeconfig, contextName, namespace, name string, replicas int32) error {
	return k8s.ScaleDeployment(kubeconfig, contextName, namespace, name, replicas)
}

func (a *App) RestartK8sDeployment(kubeconfig, contextName, namespace, name string) error {
	return k8s.RestartDeployment(kubeconfig, contextName, namespace, name)
}

// ========== Kubernetes — Services ==========

func (a *App) GetK8sServices(kubeconfig, contextName, namespace string) []k8s.ServiceInfo {
	return k8s.GetServices(kubeconfig, contextName, namespace)
}

// ========== Kubernetes — Nodes ==========

func (a *App) CordonK8sNode(kubeconfig, contextName, nodeName string) error {
	return k8s.CordonNode(kubeconfig, contextName, nodeName)
}

func (a *App) UncordonK8sNode(kubeconfig, contextName, nodeName string) error {
	return k8s.UncordonNode(kubeconfig, contextName, nodeName)
}

func (a *App) DrainK8sNode(kubeconfig, contextName, nodeName string) error {
	return k8s.DrainNode(kubeconfig, contextName, nodeName)
}

// ========== Kubernetes — Metrics ==========

func (a *App) GetK8sNodeMetrics(kubeconfig, contextName string) []k8s.NodeMetrics {
	return k8s.GetNodeMetrics(kubeconfig, contextName)
}

// ========== Holidays ==========

func (a *App) GetHolidays(year int) []holidays.Holiday {
	return holidays.GetHolidays(year)
}

func (a *App) GetHolidaysRange(startYear, endYear int) []holidays.Holiday {
	return holidays.GetHolidaysRange(startYear, endYear)
}

// ========== System Monitor ==========

func (a *App) GetSystemStats() (*sysmon.SystemStats, error) {
	return sysmon.GetSystemStats()
}

func (a *App) GetTopProcesses(sortBy string, limit int) ([]sysmon.ProcessInfo, error) {
	return sysmon.GetTopProcesses(sortBy, limit)
}

func (a *App) KillProcess(pid int) error {
	return sysmon.KillProcess(pid)
}

func (a *App) ForceKillProcess(pid int) error {
	return sysmon.ForceKillProcess(pid)
}

// ========== Local Calendar ==========

func (a *App) GetLocalEvents(startDate, endDate string) ([]localcal.Event, error) {
	return localcal.GetEvents(startDate, endDate)
}

func (a *App) AddLocalEvent(ev localcal.Event) (*localcal.Event, error) {
	return localcal.AddEvent(ev)
}

func (a *App) UpdateLocalEvent(ev localcal.Event) error {
	return localcal.UpdateEvent(ev)
}

func (a *App) DeleteLocalEvent(id string) error {
	return localcal.DeleteEvent(id)
}

// ========== Config ==========

func (a *App) GetConfig() (config.Config, error) {
	return config.Load()
}

func (a *App) SaveConfig(cfg config.Config) error {
	return config.Save(cfg)
}

func (a *App) ResetConfig() (config.Config, error) {
	return config.Reset()
}
