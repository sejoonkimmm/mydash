// ========== Weather ==========

export interface CityWeather {
  city: string;
  temperature: number;
  apparentTemp: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  precipitation: number;
  description: string;
  forecast: ForecastDay[];
}

export interface ForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  precipProb: number;
  precipSum: number;
  description: string;
}

// ========== Kubernetes ==========

export interface ClusterStatus {
  name: string;
  reachable: boolean;
  nodes: number;
  nodesReady: number;
  podsRunning: number;
  podsPending: number;
  podsFailed: number;
  memCapacity: string;
  memUsed: string;
  memPct: number;
  cpuCapacity: string;
  cpuUsed: string;
  cpuPct: number;
  error: string;
}

export interface PodInfo {
  name: string;
  namespace: string;
  status: string;
  ready: string;
  restarts: number;
  age: string;
  node: string;
  ip: string;
}

export interface DeploymentInfo {
  name: string;
  namespace: string;
  ready: string;
  upToDate: number;
  available: number;
  age: string;
  image: string;
}

export interface ServiceInfo {
  name: string;
  namespace: string;
  type: string;
  clusterIP: string;
  externalIP: string;
  ports: string;
  age: string;
}

export interface NodeInfo {
  name: string;
  status: string;
  roles: string;
  age: string;
  cpuCap: string;
  memCap: string;
}

export interface K8sEvent {
  type: string;
  reason: string;
  message: string;
  object: string;
  age: string;
}

export interface ClusterDetail {
  name: string;
  nodes: NodeInfo[];
  namespaces: NamespaceInfo[];
  events: K8sEvent[];
}

export interface NamespaceInfo {
  name: string;
  podsRunning: number;
  podsPending: number;
  podsFailed: number;
}

export type ResourceTab = 'overview' | 'pods' | 'deployments' | 'services' | 'nodes' | 'events';

export interface ContextMenu {
  x: number;
  y: number;
  type: 'pod' | 'deployment' | 'node';
  item: PodInfo | DeploymentInfo | NodeInfo;
  cluster: string;
}

// ========== Calendar ==========

export interface Holiday {
  date: string;
  name: string;
  nameEN: string;
}

export interface LocalEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  color: string;
  notes: string;
  createdAt?: string;
}

// ========== System ==========

export interface SystemStats {
  cpuUsage: number;
  memTotal: number;
  memUsed: number;
  memPercent: number;
  diskTotal: number;
  diskUsed: number;
  diskPercent: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  memSize: string;
}

// ========== Config ==========

export interface AppConfig {
  weather: {
    cities: string[];
    forecastDays: number;
    refreshMinutes: number;
  };
  timezones: {
    city: string;
    tz: string;
    flag: string;
  }[];
  k8s: {
    contexts: string[];
    kubeconfig: string;
    refreshSeconds: number;
  };
  ui: {
    theme: string;
    sidebarCollapsed: boolean;
  };
}
