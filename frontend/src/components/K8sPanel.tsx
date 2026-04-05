import { useState, useEffect, useCallback } from 'react';
import {
  GetK8sClusterDetail, GetK8sPods, GetK8sDeployments, GetK8sServices,
  GetK8sPodLogs, DeleteK8sPod, RestartK8sDeployment, ScaleK8sDeployment,
  CordonK8sNode, UncordonK8sNode,
} from '../../wailsjs/go/main/App';
import { ClusterStatus, ClusterDetail, PodInfo, DeploymentInfo, ServiceInfo, NodeInfo, ContextMenu, ResourceTab } from '../types';
import K8sClusterList from './k8s/K8sClusterList';
import K8sResourceTable from './k8s/K8sResourceTable';
import K8sLogViewer from './k8s/K8sLogViewer';
import K8sContextMenu from './k8s/K8sContextMenu';
import K8sActionModals, { PendingAction } from './k8s/K8sActionModals';
import ErrorBanner from './shared/ErrorBanner';

interface Props { clusters: ClusterStatus[]; onRefresh: () => void; fullView?: boolean; }

const TABS: { key: ResourceTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'pods', label: 'Pods' },
  { key: 'deployments', label: 'Deploys' },
  { key: 'services', label: 'Services' },
  { key: 'nodes', label: 'Nodes' },
  { key: 'events', label: 'Events' },
];

export default function K8sPanel({ clusters, onRefresh, fullView }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [resourceTab, setResourceTab] = useState<ResourceTab>('overview');
  const [detail, setDetail] = useState<ClusterDetail | null>(null);
  const [pods, setPods] = useState<PodInfo[]>([]);
  const [deployments, setDeployments] = useState<DeploymentInfo[]>([]);
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [nsFilter, setNsFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logData, setLogData] = useState<{ pod: string; ns: string; text: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const selectedCluster = selectedIdx >= 0 ? clusters[selectedIdx]?.name : '';

  const fetchDetail = useCallback(async (name: string) => {
    setLoading(true); setError(null);
    try { setDetail(await GetK8sClusterDetail('', name)); }
    catch (e) { setDetail(null); setError(`Failed to load cluster detail: ${e}`); }
    setLoading(false);
  }, []);

  const fetchPods = useCallback(async (name: string, ns: string) => {
    setError(null);
    try { setPods((await GetK8sPods('', name, ns)) || []); }
    catch (e) { setPods([]); setError(`Failed to load pods: ${e}`); }
  }, []);

  const fetchDeployments = useCallback(async (name: string, ns: string) => {
    setError(null);
    try { setDeployments((await GetK8sDeployments('', name, ns)) || []); }
    catch (e) { setDeployments([]); setError(`Failed to load deployments: ${e}`); }
  }, []);

  const fetchServices = useCallback(async (name: string, ns: string) => {
    setError(null);
    try { setServices((await GetK8sServices('', name, ns)) || []); }
    catch (e) { setServices([]); setError(`Failed to load services: ${e}`); }
  }, []);

  const fetchPodLogs = useCallback(async (ns: string, pod: string) => {
    try { setLogData({ pod, ns, text: await GetK8sPodLogs('', selectedCluster, ns, pod, '', 200) }); }
    catch (e) { setLogData({ pod, ns, text: `Error: ${e}` }); }
  }, [selectedCluster]);

  const retryFetch = useCallback(() => {
    if (!selectedCluster) return;
    if (resourceTab === 'overview' || resourceTab === 'nodes' || resourceTab === 'events') fetchDetail(selectedCluster);
    else if (resourceTab === 'pods') fetchPods(selectedCluster, nsFilter);
    else if (resourceTab === 'deployments') fetchDeployments(selectedCluster, nsFilter);
    else if (resourceTab === 'services') fetchServices(selectedCluster, nsFilter);
  }, [selectedCluster, resourceTab, nsFilter, fetchDetail, fetchPods, fetchDeployments, fetchServices]);

  useEffect(() => {
    if (!selectedCluster) return;
    if (resourceTab === 'overview' || resourceTab === 'nodes' || resourceTab === 'events') fetchDetail(selectedCluster);
    else if (resourceTab === 'pods') fetchPods(selectedCluster, nsFilter);
    else if (resourceTab === 'deployments') fetchDeployments(selectedCluster, nsFilter);
    else if (resourceTab === 'services') fetchServices(selectedCluster, nsFilter);
  }, [selectedCluster, resourceTab, nsFilter, fetchDetail, fetchPods, fetchDeployments, fetchServices]);

  const selectCluster = (idx: number) => {
    if (idx === selectedIdx) { setSelectedIdx(-1); setDetail(null); setLogData(null); return; }
    setSelectedIdx(idx); setResourceTab('overview'); setLogData(null); setError(null);
    if (clusters[idx]?.reachable) fetchDetail(clusters[idx].name);
  };

  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, type: 'pod' | 'deployment' | 'node', item: PodInfo | DeploymentInfo | NodeInfo) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, item, cluster: selectedCluster });
  };

  const handleMenuAction = (action: string) => {
    if (!contextMenu) return;
    const { cluster, item, type } = contextMenu;
    setContextMenu(null);
    if (action === 'logs' && type === 'pod') { fetchPodLogs((item as PodInfo).namespace, item.name); return; }
    if (action === 'delete-pod' && type === 'pod') setPendingAction({ type: 'delete-pod', cluster, item: item as PodInfo });
    else if (action === 'restart-deploy' && type === 'deployment') setPendingAction({ type: 'restart-deploy', cluster, item: item as DeploymentInfo });
    else if (action === 'scale-deploy' && type === 'deployment') setPendingAction({ type: 'scale-deploy', cluster, item: item as DeploymentInfo });
    else if (action === 'cordon' && type === 'node') setPendingAction({ type: 'cordon', cluster, item: item as NodeInfo });
    else if (action === 'uncordon' && type === 'node') setPendingAction({ type: 'uncordon', cluster, item: item as NodeInfo });
  };

  const confirmAction = async (scaleCount?: number) => {
    if (!pendingAction) return;
    try {
      const { type, cluster, item } = pendingAction;
      if (type === 'delete-pod') { await DeleteK8sPod('', cluster, (item as PodInfo).namespace, item.name); fetchPods(cluster, nsFilter); }
      else if (type === 'restart-deploy') { await RestartK8sDeployment('', cluster, (item as DeploymentInfo).namespace, item.name); fetchDeployments(cluster, nsFilter); }
      else if (type === 'scale-deploy' && scaleCount !== undefined) { await ScaleK8sDeployment('', cluster, (item as DeploymentInfo).namespace, item.name, scaleCount); fetchDeployments(cluster, nsFilter); }
      else if (type === 'cordon') { await CordonK8sNode('', cluster, item.name); fetchDetail(cluster); }
      else if (type === 'uncordon') { await UncordonK8sNode('', cluster, item.name); fetchDetail(cluster); }
    } catch (e) { setError(`Action failed: ${e}`); }
    setPendingAction(null);
  };

  useEffect(() => {
    if (!fullView) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setSelectedIdx(p => { const n = Math.min(p + 1, clusters.length - 1); if (clusters[n]?.reachable && clusters[n]?.name) fetchDetail(clusters[n].name); return n; });
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setSelectedIdx(p => { const n = Math.max(p - 1, 0); if (clusters[n]?.reachable && clusters[n]?.name) fetchDetail(clusters[n].name); return n; });
      } else if (e.key === 'Escape') {
        if (logData) setLogData(null); else { setSelectedIdx(-1); setDetail(null); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fullView, clusters, fetchDetail, logData]);

  return (
    <div className="card" style={fullView ? { height: '100%' } : {}}>
      <div className="card-header">
        <span className="card-title">Kubernetes ({clusters.length})</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {fullView && <span style={{ fontSize: 10, color: 'var(--t-muted)', fontFamily: 'var(--f-mono)' }}>j/k navigate | right-click for actions</span>}
          <button className="refresh-btn" onClick={onRefresh}>Refresh</button>
        </div>
      </div>
      <div className="card-body" style={fullView ? { display: 'flex', gap: 0, padding: 0 } : {}}>
        <K8sClusterList clusters={clusters} selectedIdx={selectedIdx} fullView={fullView} onSelect={selectCluster} />

        {fullView && selectedIdx >= 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 4, padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, overflowX: 'auto' }}>
              {TABS.map(t => (
                <button key={t.key} className={`refresh-btn ${resourceTab === t.key ? 'active-tab' : ''}`}
                  onClick={() => { setResourceTab(t.key); setLogData(null); }}>
                  {t.label}
                </button>
              ))}
              {(resourceTab === 'pods' || resourceTab === 'deployments' || resourceTab === 'services') && (
                <input type="text" placeholder="namespace filter..." value={nsFilter}
                  onChange={e => setNsFilter(e.target.value)}
                  style={{ marginLeft: 'auto', background: 'var(--surface-glass)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '4px 10px', color: 'var(--t-primary)', fontFamily: 'var(--f-mono)', fontSize: 11, outline: 'none', width: 160 }}
                />
              )}
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {error && <ErrorBanner message={error} onRetry={retryFetch} onDismiss={() => setError(null)} />}
              <K8sResourceTable
                tab={resourceTab} loading={loading}
                pods={pods} deployments={deployments} services={services} detail={detail}
                onContextMenu={handleContextMenu}
                onPodClick={fetchPodLogs}
                onNamespaceClick={ns => { setNsFilter(ns); setResourceTab('pods'); }}
              />
            </div>
            {logData && <K8sLogViewer pod={logData.pod} ns={logData.ns} text={logData.text} onClose={() => setLogData(null)} />}
          </div>
        )}
      </div>

      {contextMenu && <K8sContextMenu menu={contextMenu} onAction={handleMenuAction} />}
      {pendingAction && <K8sActionModals action={pendingAction} onConfirm={confirmAction} onCancel={() => setPendingAction(null)} />}
    </div>
  );
}
