export namespace calendar {
	
	export class Event {
	    id: string;
	    start: string;
	    end: string;
	    title: string;
	    accountName: string;
	    allDay: boolean;
	    location: string;
	    color: string;
	
	    static createFrom(source: any = {}) {
	        return new Event(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.start = source["start"];
	        this.end = source["end"];
	        this.title = source["title"];
	        this.accountName = source["accountName"];
	        this.allDay = source["allDay"];
	        this.location = source["location"];
	        this.color = source["color"];
	    }
	}

}

export namespace config {
	
	export class UIConfig {
	    theme: string;
	    sidebarCollapsed: boolean;
	
	    static createFrom(source: any = {}) {
	        return new UIConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.theme = source["theme"];
	        this.sidebarCollapsed = source["sidebarCollapsed"];
	    }
	}
	export class K8sConfig {
	    contexts: string[];
	    kubeconfig: string;
	    refreshSeconds: number;
	
	    static createFrom(source: any = {}) {
	        return new K8sConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.contexts = source["contexts"];
	        this.kubeconfig = source["kubeconfig"];
	        this.refreshSeconds = source["refreshSeconds"];
	    }
	}
	export class TimezoneEntry {
	    city: string;
	    tz: string;
	    flag: string;
	
	    static createFrom(source: any = {}) {
	        return new TimezoneEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.city = source["city"];
	        this.tz = source["tz"];
	        this.flag = source["flag"];
	    }
	}
	export class WeatherConfig {
	    cities: string[];
	    forecastDays: number;
	    refreshMinutes: number;
	
	    static createFrom(source: any = {}) {
	        return new WeatherConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.cities = source["cities"];
	        this.forecastDays = source["forecastDays"];
	        this.refreshMinutes = source["refreshMinutes"];
	    }
	}
	export class Config {
	    weather: WeatherConfig;
	    timezones: TimezoneEntry[];
	    k8s: K8sConfig;
	    ui: UIConfig;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.weather = this.convertValues(source["weather"], WeatherConfig);
	        this.timezones = this.convertValues(source["timezones"], TimezoneEntry);
	        this.k8s = this.convertValues(source["k8s"], K8sConfig);
	        this.ui = this.convertValues(source["ui"], UIConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	

}

export namespace holidays {
	
	export class Holiday {
	    date: string;
	    name: string;
	    nameEN: string;
	
	    static createFrom(source: any = {}) {
	        return new Holiday(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.date = source["date"];
	        this.name = source["name"];
	        this.nameEN = source["nameEN"];
	    }
	}

}

export namespace k8s {
	
	export class Event {
	    type: string;
	    reason: string;
	    message: string;
	    object: string;
	    age: string;
	
	    static createFrom(source: any = {}) {
	        return new Event(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.reason = source["reason"];
	        this.message = source["message"];
	        this.object = source["object"];
	        this.age = source["age"];
	    }
	}
	export class Namespace {
	    name: string;
	    podsRunning: number;
	    podsPending: number;
	    podsFailed: number;
	
	    static createFrom(source: any = {}) {
	        return new Namespace(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.podsRunning = source["podsRunning"];
	        this.podsPending = source["podsPending"];
	        this.podsFailed = source["podsFailed"];
	    }
	}
	export class NodeInfo {
	    name: string;
	    status: string;
	    roles: string;
	    age: string;
	    cpuCap: string;
	    memCap: string;
	
	    static createFrom(source: any = {}) {
	        return new NodeInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.status = source["status"];
	        this.roles = source["roles"];
	        this.age = source["age"];
	        this.cpuCap = source["cpuCap"];
	        this.memCap = source["memCap"];
	    }
	}
	export class ClusterDetail {
	    name: string;
	    nodes: NodeInfo[];
	    namespaces: Namespace[];
	    events: Event[];
	    error: string;
	
	    static createFrom(source: any = {}) {
	        return new ClusterDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.nodes = this.convertValues(source["nodes"], NodeInfo);
	        this.namespaces = this.convertValues(source["namespaces"], Namespace);
	        this.events = this.convertValues(source["events"], Event);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ClusterStatus {
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
	
	    static createFrom(source: any = {}) {
	        return new ClusterStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.reachable = source["reachable"];
	        this.nodes = source["nodes"];
	        this.nodesReady = source["nodesReady"];
	        this.podsRunning = source["podsRunning"];
	        this.podsPending = source["podsPending"];
	        this.podsFailed = source["podsFailed"];
	        this.memCapacity = source["memCapacity"];
	        this.memUsed = source["memUsed"];
	        this.memPct = source["memPct"];
	        this.cpuCapacity = source["cpuCapacity"];
	        this.cpuUsed = source["cpuUsed"];
	        this.cpuPct = source["cpuPct"];
	        this.error = source["error"];
	    }
	}
	export class DeploymentInfo {
	    name: string;
	    namespace: string;
	    ready: string;
	    upToDate: number;
	    available: number;
	    age: string;
	    image: string;
	
	    static createFrom(source: any = {}) {
	        return new DeploymentInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.ready = source["ready"];
	        this.upToDate = source["upToDate"];
	        this.available = source["available"];
	        this.age = source["age"];
	        this.image = source["image"];
	    }
	}
	
	
	
	export class NodeMetrics {
	    name: string;
	    cpuUsage: string;
	    cpuPct: number;
	    memUsage: string;
	    memPct: number;
	
	    static createFrom(source: any = {}) {
	        return new NodeMetrics(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.cpuUsage = source["cpuUsage"];
	        this.cpuPct = source["cpuPct"];
	        this.memUsage = source["memUsage"];
	        this.memPct = source["memPct"];
	    }
	}
	export class PodInfo {
	    name: string;
	    namespace: string;
	    status: string;
	    ready: string;
	    restarts: number;
	    age: string;
	    node: string;
	    ip: string;
	    cpu: string;
	    memory: string;
	
	    static createFrom(source: any = {}) {
	        return new PodInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.status = source["status"];
	        this.ready = source["ready"];
	        this.restarts = source["restarts"];
	        this.age = source["age"];
	        this.node = source["node"];
	        this.ip = source["ip"];
	        this.cpu = source["cpu"];
	        this.memory = source["memory"];
	    }
	}
	export class ServiceInfo {
	    name: string;
	    namespace: string;
	    type: string;
	    clusterIP: string;
	    externalIP: string;
	    ports: string;
	    age: string;
	
	    static createFrom(source: any = {}) {
	        return new ServiceInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.type = source["type"];
	        this.clusterIP = source["clusterIP"];
	        this.externalIP = source["externalIP"];
	        this.ports = source["ports"];
	        this.age = source["age"];
	    }
	}

}

export namespace localcal {
	
	export class Event {
	    id: string;
	    title: string;
	    start: string;
	    end: string;
	    allDay: boolean;
	    color: string;
	    notes: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Event(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.start = source["start"];
	        this.end = source["end"];
	        this.allDay = source["allDay"];
	        this.color = source["color"];
	        this.notes = source["notes"];
	        this.createdAt = source["createdAt"];
	    }
	}

}

export namespace main {
	
	export class CalendarAccountInput {
	    name: string;
	    credentialsFile: string;
	    tokenFile: string;
	    color: string;
	
	    static createFrom(source: any = {}) {
	        return new CalendarAccountInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.credentialsFile = source["credentialsFile"];
	        this.tokenFile = source["tokenFile"];
	        this.color = source["color"];
	    }
	}

}

export namespace sysmon {
	
	export class ProcessInfo {
	    pid: number;
	    name: string;
	    cpu: number;
	    memory: number;
	    memSize: string;
	
	    static createFrom(source: any = {}) {
	        return new ProcessInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.pid = source["pid"];
	        this.name = source["name"];
	        this.cpu = source["cpu"];
	        this.memory = source["memory"];
	        this.memSize = source["memSize"];
	    }
	}
	export class SystemStats {
	    cpuUsage: number;
	    memTotal: number;
	    memUsed: number;
	    memPercent: number;
	    diskTotal: number;
	    diskUsed: number;
	    diskPercent: number;
	
	    static createFrom(source: any = {}) {
	        return new SystemStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.cpuUsage = source["cpuUsage"];
	        this.memTotal = source["memTotal"];
	        this.memUsed = source["memUsed"];
	        this.memPercent = source["memPercent"];
	        this.diskTotal = source["diskTotal"];
	        this.diskUsed = source["diskUsed"];
	        this.diskPercent = source["diskPercent"];
	    }
	}

}

export namespace weather {
	
	export class ForecastDay {
	    date: string;
	    tempMax: number;
	    tempMin: number;
	    weatherCode: number;
	    precipProb: number;
	    precipSum: number;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new ForecastDay(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.date = source["date"];
	        this.tempMax = source["tempMax"];
	        this.tempMin = source["tempMin"];
	        this.weatherCode = source["weatherCode"];
	        this.precipProb = source["precipProb"];
	        this.precipSum = source["precipSum"];
	        this.description = source["description"];
	    }
	}
	export class CityWeather {
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
	
	    static createFrom(source: any = {}) {
	        return new CityWeather(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.city = source["city"];
	        this.temperature = source["temperature"];
	        this.apparentTemp = source["apparentTemp"];
	        this.humidity = source["humidity"];
	        this.windSpeed = source["windSpeed"];
	        this.weatherCode = source["weatherCode"];
	        this.isDay = source["isDay"];
	        this.precipitation = source["precipitation"];
	        this.description = source["description"];
	        this.forecast = this.convertValues(source["forecast"], ForecastDay);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

