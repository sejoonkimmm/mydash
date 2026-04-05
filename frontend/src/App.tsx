import { useState, useEffect, useMemo } from 'react';
import './App.css';
import { GetConfig } from '../wailsjs/go/main/App';
import { useWeather } from './hooks/useWeather';
import { useK8sClusters } from './hooks/useK8s';
import type { AppConfig } from './types';
import WeatherPanel from './components/WeatherPanel';
import CalendarPanel from './components/CalendarPanel';
import K8sPanel from './components/K8sPanel';
import Mascot from './components/Mascot';
import SystemMonitor from './components/SystemMonitor';
import SettingsPanel from './components/SettingsPanel';
import { Sliders } from 'lucide-react';

type Tab = 'overview' | 'calendar' | 'k8s' | 'settings';

const DEFAULT_CONFIG: AppConfig = {
  weather: { cities: ['Ansan', 'Wolfsburg'], forecastDays: 5, refreshMinutes: 30 },
  timezones: [
    { city: 'Ansan', tz: 'Asia/Seoul', flag: '\uD83C\uDDF0\uD83C\uDDF7' },
    { city: 'Wolfsburg', tz: 'Europe/Berlin', flag: '\uD83C\uDDE9\uD83C\uDDEA' },
  ],
  k8s: {
    contexts: [
      'aks-dev-ris-gerwece-001', 'aks-prod-ris-gerwece-001', 'aks-staging-ris-gerwece-001',
      'k8s-dev-mps-eucentral-001', 'k8s-prod-mps-eucentral-001', 'k8s-stage-mps-eucentral-001',
    ],
    kubeconfig: '', refreshSeconds: 15,
  },
  ui: { theme: 'dark', sidebarCollapsed: false },
};

function formatTZ(date: Date, tz: string) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz });
}

function App() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [now, setNow] = useState(new Date());

  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    GetConfig()
      .then(cfg => { if (cfg) setConfig(cfg); })
      .catch(e => setConfigError(`Failed to load settings: ${e}`));
  }, []);

  const citiesKey = JSON.stringify(config.weather.cities);
  const cities = useMemo(() => config.weather.cities, [citiesKey]);
  const k8sKey = JSON.stringify(config.k8s.contexts);
  const k8sContexts = useMemo(() => config.k8s.contexts, [k8sKey]);

  const weather = useWeather(cities, config.weather.forecastDays, config.weather.refreshMinutes * 60 * 1000);
  const k8s = useK8sClusters(config.k8s.kubeconfig, k8sContexts, config.k8s.refreshSeconds * 1000);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === '1') setActiveTab('overview');
      else if (e.key === '2') setActiveTab('calendar');
      else if (e.key === '3') setActiveTab('k8s');
      else if (e.key === '4') setActiveTab('settings');
      else if (e.key === 'r' || e.key === 'R') {
        weather.refresh();
        k8s.refresh();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [weather, k8s]);

  return (
    <div className="app">
      <div className="titlebar" />
      <div className="app-content">
        <nav className="sidebar">
          <div className="sidebar-header">
            <div className="logo-row">
              <Mascot size={32} />
              <h1 className="logo">My<span>Dash</span></h1>
            </div>

            <div className="dual-clocks">
              {config.timezones.map((tz, i) => (
                <div key={i} className="tz-clock">
                  <span className="tz-flag">{tz.flag}</span>
                  <span className="tz-time">{formatTZ(now, tz.tz)}</span>
                  <span className="tz-city">{tz.city}</span>
                </div>
              ))}
            </div>

            <div className="clock-date">
              {now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>

          <div className="nav-items">
            {([
              { key: 'overview' as Tab, icon: '\u25C9', label: 'Overview' },
              { key: 'calendar' as Tab, icon: '\u25A3', label: 'Calendar' },
              { key: 'k8s' as Tab, icon: '\u2699', label: 'Kubernetes' },
            ]).map(item => (
              <button
                key={item.key}
                className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => setActiveTab(item.key)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
            <button
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Sliders size={15} className="nav-icon-svg" />
              Settings
            </button>
          </div>

          <SystemMonitor />

          <div className="sidebar-weather">
            {weather.data.filter(Boolean).map((city, i) => (
              <div key={i} className="sidebar-weather-item">
                <span className="sidebar-weather-city">{config.timezones.find(tz => tz.city === city.city)?.flag} {city.city}</span>
                <span className="sidebar-weather-temp">{Math.round(city.temperature)}&deg;</span>
              </div>
            ))}
          </div>

          <div className="sidebar-footer">
            <span className="sidebar-shortcut-hint">1-4 switch tabs &middot; R refresh</span>
          </div>
        </nav>

        <main className="main">
          {activeTab === 'overview' && (
            <div className="overview">
              <div className="overview-weather">
                <WeatherPanel
                  cities={weather.data}
                  loading={weather.loading}
                  error={weather.error}
                  lastUpdated={weather.lastUpdated}
                  onRefresh={weather.refresh}
                />
              </div>
              <div className="overview-bottom">
                <div className="overview-calendar">
                  <CalendarPanel />
                </div>
                <div className="overview-k8s">
                  <K8sPanel clusters={k8s.clusters} onRefresh={k8s.refresh} />
                </div>
              </div>
            </div>
          )}
          {activeTab === 'calendar' && (
            <div className="full-panel">
              <CalendarPanel fullView />
            </div>
          )}
          {activeTab === 'k8s' && (
            <div className="full-panel">
              <K8sPanel clusters={k8s.clusters} onRefresh={k8s.refresh} fullView />
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="full-panel">
              <SettingsPanel onConfigChange={setConfig} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
