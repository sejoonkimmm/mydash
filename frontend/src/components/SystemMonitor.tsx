import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { GetTopProcesses, KillProcess, ForceKillProcess } from '../../wailsjs/go/main/App';
import { useSystemStats } from '../hooks/useSystemStats';
import ConfirmModal from './shared/ConfirmModal';
import type { ProcessInfo } from '../types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

function MiniGauge({ value, label, detail, color, onClick }: {
  value: number; label: string; detail: string; color: string; onClick?: () => void;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const circumference = 2 * Math.PI * 16;
  const dashOffset = circumference - (clamped / 100) * circumference;
  const isHigh = clamped > 80;

  return (
    <div className="mini-gauge" onClick={onClick} title={onClick ? `Click for top ${label} processes` : undefined}>
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill="none" stroke="var(--t-ghost)" strokeWidth="3" opacity="0.4" />
        <circle cx="20" cy="20" r="16" fill="none"
          stroke={isHigh ? 'var(--sig-bad)' : color}
          strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          transform="rotate(-90 20 20)"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s' }}
        />
        <text x="20" y="20" textAnchor="middle" dominantBaseline="central"
          fill={isHigh ? 'var(--sig-bad)' : 'var(--t-primary)'}
          fontSize="9" fontFamily="var(--f-mono)" fontWeight="600">
          {Math.round(clamped)}%
        </text>
      </svg>
      <div className="mini-gauge-text">
        <span className="mini-gauge-label">{label}</span>
        <span className="mini-gauge-detail">{detail}</span>
      </div>
    </div>
  );
}

export default function SystemMonitor() {
  const { stats } = useSystemStats(3000);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [showProcesses, setShowProcesses] = useState<string | null>(null);
  const [killTarget, setKillTarget] = useState<{ pid: number; force: boolean } | null>(null);
  const [killError, setKillError] = useState<string | null>(null);

  const openProcessList = useCallback(async (sortBy: string) => {
    setShowProcesses(sortBy);
    try {
      const data = await GetTopProcesses(sortBy === 'disk' ? 'mem' : sortBy, 20);
      setProcesses(data || []);
    } catch { setProcesses([]); }
  }, []);

  const confirmKill = useCallback(async () => {
    if (!killTarget) return;
    setKillError(null);
    try {
      if (killTarget.force) await ForceKillProcess(killTarget.pid);
      else await KillProcess(killTarget.pid);
      if (showProcesses) openProcessList(showProcesses);
    } catch (e) {
      setKillError(`Failed to kill PID ${killTarget.pid}: ${e}`);
    }
    setKillTarget(null);
  }, [killTarget, showProcesses, openProcessList]);

  const cpu = stats?.cpuUsage ?? 0;
  const mem = stats?.memPercent ?? 0;
  const disk = stats?.diskPercent ?? 0;
  const memDetail = stats ? `${formatBytes(stats.memUsed)}/${formatBytes(stats.memTotal)}` : '--';
  const diskDetail = stats ? `${formatBytes(stats.diskUsed)}/${formatBytes(stats.diskTotal)}` : '--';

  return (
    <>
      <div className="system-monitor-card">
        <div className="system-monitor-title">System</div>
        <MiniGauge value={cpu} label="CPU" detail={`${cpu.toFixed(0)}%`} color="var(--teal)" onClick={() => openProcessList('cpu')} />
        <MiniGauge value={mem} label="RAM" detail={memDetail} color="var(--lavender)" onClick={() => openProcessList('mem')} />
        <MiniGauge value={disk} label="Disk" detail={diskDetail} color="var(--peach)" onClick={() => openProcessList('disk')} />
      </div>

      {showProcesses && createPortal(
        <div className="modal-overlay" onClick={() => setShowProcesses(null)}>
          <div className="process-modal" onClick={e => e.stopPropagation()}>
            <div className="process-modal-header">
              <span className="process-modal-title">
                Top Processes &mdash; {showProcesses.toUpperCase()}
              </span>
              <button className="refresh-btn" onClick={() => setShowProcesses(null)}>Close</button>
            </div>
            <div className="process-table-header">
              <span style={{ width: 60 }}>PID</span>
              <span style={{ flex: 3, minWidth: 200 }}>Name</span>
              <span style={{ flex: 1, textAlign: 'right' }}>CPU</span>
              <span style={{ flex: 1, textAlign: 'right' }}>MEM %</span>
              <span style={{ flex: 1, textAlign: 'right' }}>Size</span>
              <span style={{ width: 100, textAlign: 'center' }}>Action</span>
            </div>
            <div className="process-table-body">
              {processes.map((p, i) => (
                <div key={p.pid} className={`process-row ${i % 2 === 0 ? '' : 'alt'}`}>
                  <span style={{ width: 60 }} className="process-pid">{p.pid}</span>
                  <span style={{ flex: 3, minWidth: 200 }} className="process-name">{p.name}</span>
                  <span style={{ flex: 1, textAlign: 'right' }} className={p.cpu > 50 ? 'sig-bad' : p.cpu > 20 ? 'sig-warn' : ''}>
                    {p.cpu.toFixed(1)}%
                  </span>
                  <span style={{ flex: 1, textAlign: 'right' }} className={p.memory > 10 ? 'sig-warn' : ''}>
                    {p.memory.toFixed(1)}%
                  </span>
                  <span style={{ flex: 1, textAlign: 'right' }}>{p.memSize}</span>
                  <span style={{ width: 100 }} className="process-actions">
                    <button className="kill-btn" onClick={() => setKillTarget({ pid: p.pid, force: false })} title="SIGTERM">Kill</button>
                    <button className="kill-btn force" onClick={() => setKillTarget({ pid: p.pid, force: true })} title="SIGKILL">9</button>
                  </span>
                </div>
              ))}
              {processes.length === 0 && (
                <div className="process-empty">Loading processes...</div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {killTarget && (
        <ConfirmModal
          title="Kill Process"
          message={`Kill process ${killTarget.pid}${killTarget.force ? ' with SIGKILL (force)' : ' with SIGTERM'}?`}
          confirmLabel={killTarget.force ? 'Force Kill' : 'Kill'}
          danger
          onConfirm={confirmKill}
          onCancel={() => setKillTarget(null)}
        />
      )}
    </>
  );
}
