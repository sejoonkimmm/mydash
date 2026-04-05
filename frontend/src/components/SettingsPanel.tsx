import { useState, useEffect } from 'react';
import { GetConfig, SaveConfig, ResetConfig } from '../../wailsjs/go/main/App';
import type { AppConfig } from '../types';

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-glass)',
  border: '1px solid var(--border)',
  color: 'var(--t-bright)',
  borderRadius: 'var(--r-sm)',
  padding: '6px 10px',
  fontSize: 13,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-secondary)',
  marginBottom: 4,
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 28,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  marginBottom: 6,
};

const removeBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--text-secondary)',
  borderRadius: 'var(--r-sm)',
  padding: '4px 8px',
  fontSize: 12,
  cursor: 'pointer',
  flexShrink: 0,
};

const addBtn: React.CSSProperties = {
  background: 'var(--surface-glass)',
  border: '1px solid var(--border)',
  color: 'var(--t-bright)',
  borderRadius: 'var(--r-sm)',
  padding: '5px 12px',
  fontSize: 12,
  cursor: 'pointer',
  marginTop: 4,
};

interface Props {
  onConfigChange?: (cfg: AppConfig) => void;
}

export default function SettingsPanel({ onConfigChange }: Props) {
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    GetConfig()
      .then((c: AppConfig) => setCfg(c))
      .catch((e: unknown) => setStatus({ type: 'error', msg: String(e) }));
  }, []);

  function flash(type: 'success' | 'error', msg: string) {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 3000);
  }

  async function handleSave() {
    if (!cfg) return;
    setSaving(true);
    try {
      await SaveConfig(cfg as any);
      onConfigChange?.(cfg);
      flash('success', 'Settings saved.');
    } catch (e) {
      flash('error', String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    try {
      const defaults = await ResetConfig();
      setCfg(defaults as AppConfig);
      flash('success', 'Settings reset to defaults.');
    } catch (e) {
      flash('error', String(e));
    }
  }

  if (!cfg) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">Settings</span>
        </div>
        <div className="card-body" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Loading...
        </div>
      </div>
    );
  }

  // ---- helpers ----

  function updateWeather(patch: Partial<AppConfig['weather']>) {
    setCfg((c) => c ? { ...c, weather: { ...c.weather, ...patch } } : c);
  }

  function updateK8s(patch: Partial<AppConfig['k8s']>) {
    setCfg((c) => c ? { ...c, k8s: { ...c.k8s, ...patch } } : c);
  }

  function updateUI(patch: Partial<AppConfig['ui']>) {
    setCfg((c) => c ? { ...c, ui: { ...c.ui, ...patch } } : c);
  }

  const current = cfg!;

  function addCity() {
    updateWeather({ cities: [...current.weather.cities, ''] });
  }

  function removeCity(i: number) {
    updateWeather({ cities: current.weather.cities.filter((_, idx) => idx !== i) });
  }

  function setCity(i: number, val: string) {
    const next = [...current.weather.cities];
    next[i] = val;
    updateWeather({ cities: next });
  }

  function addTimezone() {
    setCfg((c) => c ? { ...c, timezones: [...c.timezones, { city: '', tz: '', flag: '' }] } : c);
  }

  function removeTimezone(i: number) {
    setCfg((c) => c ? { ...c, timezones: c.timezones.filter((_, idx) => idx !== i) } : c);
  }

  function setTimezone(i: number, field: 'city' | 'tz' | 'flag', val: string) {
    const next = current.timezones.map((t, idx) => (idx === i ? { ...t, [field]: val } : t));
    setCfg((c) => c ? { ...c, timezones: next } : c);
  }

  function addContext() {
    updateK8s({ contexts: [...current.k8s.contexts, ''] });
  }

  function removeContext(i: number) {
    updateK8s({ contexts: current.k8s.contexts.filter((_, idx) => idx !== i) });
  }

  function setContext(i: number, val: string) {
    const next = [...current.k8s.contexts];
    next[i] = val;
    updateK8s({ contexts: next });
  }

  return (
    <div className="card" style={{ maxWidth: 680 }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="card-title">Settings</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="refresh-btn" onClick={handleReset}>Reset</button>
          <button
            className="refresh-btn"
            onClick={handleSave}
            disabled={saving}
            style={{ opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {status && (
        <div style={{
          margin: '0 22px',
          padding: '8px 12px',
          borderRadius: 'var(--r-sm)',
          fontSize: 12,
          background: status.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${status.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: status.type === 'success' ? '#4ade80' : '#f87171',
        }}>
          {status.msg}
        </div>
      )}

      <div className="card-body">

        {/* ---- Weather ---- */}
        <div style={sectionStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-bright)', marginBottom: 14 }}>
            Weather
          </div>

          <label style={labelStyle}>Cities</label>
          {cfg.weather.cities.map((city, i) => (
            <div key={i} style={rowStyle}>
              <input
                style={inputStyle}
                value={city}
                placeholder="e.g. Berlin"
                onChange={(e) => setCity(i, e.target.value)}
              />
              <button style={removeBtn} onClick={() => removeCity(i)}>✕</button>
            </div>
          ))}
          <button style={addBtn} onClick={addCity}>+ Add City</button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
            <div>
              <label style={labelStyle}>Forecast Days</label>
              <input
                type="number"
                style={inputStyle}
                min={1}
                max={14}
                value={cfg.weather.forecastDays}
                onChange={(e) => updateWeather({ forecastDays: Number(e.target.value) })}
              />
            </div>
            <div>
              <label style={labelStyle}>Refresh (minutes)</label>
              <input
                type="number"
                style={inputStyle}
                min={1}
                value={cfg.weather.refreshMinutes}
                onChange={(e) => updateWeather({ refreshMinutes: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* ---- Timezones ---- */}
        <div style={sectionStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-bright)', marginBottom: 14 }}>
            Timezones
          </div>

          {cfg.timezones.map((tz, i) => (
            <div key={i} style={{ ...rowStyle, alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', gap: 6, flex: 1 }}>
                <input
                  style={inputStyle}
                  value={tz.flag}
                  placeholder="🌍"
                  onChange={(e) => setTimezone(i, 'flag', e.target.value)}
                  title="Flag emoji"
                />
                <input
                  style={inputStyle}
                  value={tz.city}
                  placeholder="City"
                  onChange={(e) => setTimezone(i, 'city', e.target.value)}
                />
                <input
                  style={inputStyle}
                  value={tz.tz}
                  placeholder="Europe/Berlin"
                  onChange={(e) => setTimezone(i, 'tz', e.target.value)}
                />
              </div>
              <button style={{ ...removeBtn, marginTop: 2 }} onClick={() => removeTimezone(i)}>✕</button>
            </div>
          ))}
          <button style={addBtn} onClick={addTimezone}>+ Add Timezone</button>
        </div>

        {/* ---- Kubernetes ---- */}
        <div style={sectionStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-bright)', marginBottom: 14 }}>
            Kubernetes
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Kubeconfig Path</label>
            <input
              style={inputStyle}
              value={cfg.k8s.kubeconfig}
              placeholder="~/.kube/config (leave blank for default)"
              onChange={(e) => updateK8s({ kubeconfig: e.target.value })}
            />
          </div>

          <label style={labelStyle}>Contexts</label>
          {cfg.k8s.contexts.map((ctx, i) => (
            <div key={i} style={rowStyle}>
              <input
                style={inputStyle}
                value={ctx}
                placeholder="e.g. aks-prod-cluster"
                onChange={(e) => setContext(i, e.target.value)}
              />
              <button style={removeBtn} onClick={() => removeContext(i)}>✕</button>
            </div>
          ))}
          <button style={addBtn} onClick={addContext}>+ Add Context</button>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Refresh (seconds)</label>
            <input
              type="number"
              style={{ ...inputStyle, maxWidth: 160 }}
              min={5}
              value={cfg.k8s.refreshSeconds}
              onChange={(e) => updateK8s({ refreshSeconds: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* ---- UI ---- */}
        <div style={sectionStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-bright)', marginBottom: 14 }}>
            Appearance
          </div>

          <label style={labelStyle}>Theme</label>
          <select
            style={{ ...inputStyle, maxWidth: 200, cursor: 'pointer' }}
            value={cfg.ui.theme}
            onChange={(e) => updateUI({ theme: e.target.value as 'dark' | 'light' })}
          >
            <option value="dark">Dark</option>
            <option value="light" disabled>Light (coming soon)</option>
          </select>
        </div>

      </div>
    </div>
  );
}
