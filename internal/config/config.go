package config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

type Config struct {
	Weather   WeatherConfig   `json:"weather"`
	Timezones []TimezoneEntry `json:"timezones"`
	K8s       K8sConfig       `json:"k8s"`
	UI        UIConfig        `json:"ui"`
}

type WeatherConfig struct {
	Cities         []string `json:"cities"`
	ForecastDays   int      `json:"forecastDays"`
	RefreshMinutes int      `json:"refreshMinutes"`
}

type TimezoneEntry struct {
	City string `json:"city"`
	TZ   string `json:"tz"`
	Flag string `json:"flag"`
}

type K8sConfig struct {
	Contexts       []string `json:"contexts"`
	Kubeconfig     string   `json:"kubeconfig"`
	RefreshSeconds int      `json:"refreshSeconds"`
}

type UIConfig struct {
	Theme            string `json:"theme"`
	SidebarCollapsed bool   `json:"sidebarCollapsed"`
}

var (
	mu         sync.Mutex
	configFile string
	cached     *Config
)

func init() {
	home, _ := os.UserHomeDir()
	configFile = filepath.Join(home, ".config", "mydash", "config.json")
}

func DefaultConfig() Config {
	return Config{
		Weather: WeatherConfig{
			Cities:         []string{"Ansan", "Wolfsburg"},
			ForecastDays:   5,
			RefreshMinutes: 30,
		},
		Timezones: []TimezoneEntry{
			{City: "Ansan", TZ: "Asia/Seoul", Flag: "\U0001F1F0\U0001F1F7"},
			{City: "Wolfsburg", TZ: "Europe/Berlin", Flag: "\U0001F1E9\U0001F1EA"},
		},
		K8s: K8sConfig{
			Contexts: []string{
				"aks-dev-ris-gerwece-001",
				"aks-prod-ris-gerwece-001",
				"aks-staging-ris-gerwece-001",
				"k8s-dev-mps-eucentral-001",
				"k8s-prod-mps-eucentral-001",
				"k8s-stage-mps-eucentral-001",
			},
			Kubeconfig:     "",
			RefreshSeconds: 15,
		},
		UI: UIConfig{
			Theme:            "dark",
			SidebarCollapsed: false,
		},
	}
}

func Load() (Config, error) {
	mu.Lock()
	defer mu.Unlock()

	if cached != nil {
		return *cached, nil
	}

	data, err := os.ReadFile(configFile)
	if err != nil {
		if os.IsNotExist(err) {
			def := DefaultConfig()
			cached = &def
			_ = save(def)
			return def, nil
		}
		return Config{}, err
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return Config{}, err
	}

	cached = &cfg
	return cfg, nil
}

func Save(cfg Config) error {
	mu.Lock()
	defer mu.Unlock()
	cached = &cfg
	return save(cfg)
}

func save(cfg Config) error {
	if err := os.MkdirAll(filepath.Dir(configFile), 0700); err != nil {
		return err
	}
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(configFile, data, 0644)
}

func Reset() (Config, error) {
	mu.Lock()
	defer mu.Unlock()
	def := DefaultConfig()
	cached = &def
	if err := save(def); err != nil {
		return Config{}, err
	}
	return def, nil
}
