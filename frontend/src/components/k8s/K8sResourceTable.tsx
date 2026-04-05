import { PodInfo, DeploymentInfo, ServiceInfo, NodeInfo, K8sEvent, ClusterDetail, ResourceTab, NamespaceInfo } from '../../types';
import LoadingSkeleton from '../shared/LoadingSkeleton';

interface Props {
  tab: ResourceTab;
  loading: boolean;
  pods: PodInfo[];
  deployments: DeploymentInfo[];
  services: ServiceInfo[];
  detail: ClusterDetail | null;
  onContextMenu: (e: React.MouseEvent, type: 'pod' | 'deployment' | 'node', item: PodInfo | DeploymentInfo | NodeInfo) => void;
  onPodClick: (ns: string, pod: string) => void;
  onNamespaceClick: (ns: string) => void;
}

const SECTION_LABEL: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'var(--t-ghost)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8 };
const EMPTY = (msg: string) => <div style={{ color: 'var(--t-muted)', padding: 20, textAlign: 'center' }}>{msg}</div>;

export default function K8sResourceTable({ tab, loading, pods, deployments, services, detail, onContextMenu, onPodClick, onNamespaceClick }: Props) {
  if (loading) return <LoadingSkeleton lines={6} height={32} />;

  if (tab === 'overview' && detail) return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div>
        <div style={SECTION_LABEL}>Nodes ({detail.nodes?.length || 0})</div>
        {detail.nodes?.slice(0, 10).map((n: NodeInfo, i: number) => (
          <div key={n.name} className="k8s-table-row" onContextMenu={e => onContextMenu(e, 'node', n)}>
            <span style={{ flex: 2 }}>{n.name}</span>
            <span style={{ color: n.status === 'Ready' ? 'var(--sig-ok)' : 'var(--sig-bad)' }}>{n.status}</span>
            <span>{n.roles}</span><span>{n.cpuCap} / {n.memCap}</span>
          </div>
        ))}
      </div>
      <div>
        <div style={SECTION_LABEL}>Namespaces ({detail.namespaces?.length || 0})</div>
        {detail.namespaces?.slice(0, 15).map((ns: NamespaceInfo, i: number) => (
          <div key={ns.name} className="k8s-table-row" onClick={() => onNamespaceClick(ns.name)}>
            <span style={{ flex: 2, cursor: 'pointer', color: 'var(--teal)' }}>{ns.name}</span>
            <span style={{ color: 'var(--sig-ok)' }}>{ns.podsRunning} pods</span>
            {ns.podsPending > 0 && <span style={{ color: 'var(--sig-warn)' }}>{ns.podsPending} pending</span>}
            {ns.podsFailed > 0 && <span style={{ color: 'var(--sig-bad)' }}>{ns.podsFailed} failed</span>}
          </div>
        ))}
      </div>
    </div>
  );

  if (tab === 'pods') return (
    <div className="k8s-detail-table">
      <div className="k8s-table-header">
        <span style={{ flex: 2 }}>Name</span><span>Namespace</span><span>Status</span><span>Ready</span><span>Restarts</span><span>Node</span><span>Age</span>
      </div>
      {pods.map((p, i) => (
        <div key={`${p.namespace}/${p.name}`} className="k8s-table-row" style={{ cursor: 'pointer' }}
          onContextMenu={e => onContextMenu(e, 'pod', p)} onClick={() => onPodClick(p.namespace, p.name)}>
          <span style={{ flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.name}>{p.name}</span>
          <span>{p.namespace}</span>
          <span style={{ color: p.status === 'Running' ? 'var(--sig-ok)' : p.status === 'Pending' ? 'var(--sig-warn)' : 'var(--sig-bad)' }}>{p.status}</span>
          <span>{p.ready}</span>
          <span style={{ color: p.restarts > 5 ? 'var(--sig-bad)' : p.restarts > 0 ? 'var(--sig-warn)' : 'inherit' }}>{p.restarts}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.node}</span>
          <span>{p.age}</span>
        </div>
      ))}
      {pods.length === 0 && EMPTY('No pods found')}
    </div>
  );

  if (tab === 'deployments') return (
    <div className="k8s-detail-table">
      <div className="k8s-table-header">
        <span style={{ flex: 2 }}>Name</span><span>Namespace</span><span>Ready</span><span>Up-to-date</span><span>Available</span><span>Age</span>
      </div>
      {deployments.map((d) => (
        <div key={`${d.namespace}/${d.name}`} className="k8s-table-row" onContextMenu={e => onContextMenu(e, 'deployment', d)}>
          <span style={{ flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.name}>{d.name}</span>
          <span>{d.namespace}</span><span>{d.ready}</span><span>{d.upToDate}</span><span>{d.available}</span><span>{d.age}</span>
        </div>
      ))}
      {deployments.length === 0 && EMPTY('No deployments found')}
    </div>
  );

  if (tab === 'services') return (
    <div className="k8s-detail-table">
      <div className="k8s-table-header">
        <span style={{ flex: 2 }}>Name</span><span>Namespace</span><span>Type</span><span>Cluster IP</span><span>Ports</span><span>Age</span>
      </div>
      {services.map((s) => (
        <div key={`${s.namespace}/${s.name}`} className="k8s-table-row">
          <span style={{ flex: 2 }}>{s.name}</span>
          <span>{s.namespace}</span>
          <span style={{ color: s.type === 'LoadBalancer' ? 'var(--teal)' : 'inherit' }}>{s.type}</span>
          <span>{s.clusterIP}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.ports}</span>
          <span>{s.age}</span>
        </div>
      ))}
      {services.length === 0 && EMPTY('No services found')}
    </div>
  );

  if (tab === 'nodes' && detail) return (
    <div className="k8s-detail-table">
      <div className="k8s-table-header">
        <span style={{ flex: 2 }}>Name</span><span>Status</span><span>Roles</span><span>Age</span><span>CPU</span><span>Memory</span>
      </div>
      {detail.nodes?.map((n: NodeInfo) => (
        <div key={n.name} className="k8s-table-row" onContextMenu={e => onContextMenu(e, 'node', n)}>
          <span style={{ flex: 2 }}>{n.name}</span>
          <span style={{ color: n.status === 'Ready' ? 'var(--sig-ok)' : 'var(--sig-bad)' }}>{n.status}</span>
          <span>{n.roles}</span><span>{n.age}</span><span>{n.cpuCap}</span><span>{n.memCap}</span>
        </div>
      ))}
    </div>
  );

  if (tab === 'events' && detail) return (
    <div className="k8s-detail-table">
      <div className="k8s-table-header">
        <span>Type</span><span>Reason</span><span style={{ flex: 3 }}>Message</span><span>Object</span><span>Age</span>
      </div>
      {detail.events?.map((ev: K8sEvent, i: number) => (
        <div key={`${ev.object}-${ev.reason}-${i}`} className="k8s-table-row">
          <span style={{ color: ev.type === 'Warning' ? 'var(--sig-warn)' : 'var(--t-secondary)' }}>{ev.type}</span>
          <span>{ev.reason}</span>
          <span style={{ flex: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ev.message}>{ev.message}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.object}</span>
          <span>{ev.age}</span>
        </div>
      ))}
    </div>
  );

  return null;
}
