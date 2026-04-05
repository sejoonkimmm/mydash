import { ClusterStatus } from '../../types';

interface Props {
  clusters: ClusterStatus[];
  selectedIdx: number;
  fullView?: boolean;
  onSelect: (idx: number) => void;
}

function getStatusClass(c: ClusterStatus): string {
  if (!c.reachable) return 'error';
  if (c.podsFailed > 0 || c.nodesReady < c.nodes) return 'warning';
  return 'healthy';
}

function shortName(name: string): string {
  const parts = name.split('-');
  return parts.length >= 3 ? parts.slice(1, 3).join('-') : name;
}

export default function K8sClusterList({ clusters, selectedIdx, fullView, onSelect }: Props) {
  return (
    <div style={fullView ? { flex: '0 0 280px', padding: '16px', borderRight: '1px solid var(--border)', overflowY: 'auto' } : {}}>
      <div className="k8s-clusters">
        {clusters.map((c, i) => (
          <div
            key={i}
            className={`k8s-cluster ${selectedIdx === i ? 'k8s-selected' : ''}`}
            onClick={() => onSelect(i)}
          >
            <div className={`k8s-status-dot ${getStatusClass(c)}`} />
            <span className="k8s-cluster-name" title={c.name}>
              {fullView ? c.name : shortName(c.name)}
            </span>
            {c.reachable ? (
              <div className="k8s-cluster-stats" style={{ flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="k8s-stat"><span className="k8s-stat-label">N</span>{c.nodesReady}/{c.nodes}</div>
                  <div className="k8s-stat"><span className="k8s-stat-label">P</span>{c.podsRunning}</div>
                  {c.podsFailed > 0 && (
                    <div className="k8s-stat" style={{ color: 'var(--sig-bad)' }}>{c.podsFailed}F</div>
                  )}
                </div>
                {c.memUsed && (
                  <div style={{ display: 'flex', gap: 8, fontSize: 10 }}>
                    <span style={{ color: c.memPct > 80 ? 'var(--sig-bad)' : c.memPct > 60 ? 'var(--sig-warn)' : 'var(--sig-ok)' }}>
                      MEM {c.memUsed}/{c.memCapacity} ({Math.round(c.memPct)}%)
                    </span>
                  </div>
                )}
                {c.cpuUsed && (
                  <div style={{ display: 'flex', gap: 8, fontSize: 10 }}>
                    <span style={{ color: c.cpuPct > 80 ? 'var(--sig-bad)' : c.cpuPct > 60 ? 'var(--sig-warn)' : 'var(--sig-ok)' }}>
                      CPU {c.cpuUsed}/{c.cpuCapacity} ({Math.round(c.cpuPct)}%)
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <span className="k8s-cluster-error">{c.error || 'Unreachable'}</span>
            )}
          </div>
        ))}
        {clusters.length === 0 && (
          <div style={{ color: 'var(--t-muted)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
            Connecting...
          </div>
        )}
      </div>
    </div>
  );
}
