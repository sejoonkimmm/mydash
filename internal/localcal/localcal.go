package localcal

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"sync"
	"time"
)

type Event struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Start     string `json:"start"`     // RFC3339
	End       string `json:"end"`       // RFC3339
	AllDay    bool   `json:"allDay"`
	Color     string `json:"color"`
	Notes     string `json:"notes"`
	CreatedAt string `json:"createdAt"`
}

var (
	mu       sync.Mutex
	dataFile string
)

func init() {
	dataFile = expandPath("~/.config/mydash/local-events.json")
}

func expandPath(path string) string {
	if len(path) >= 2 && path[:2] == "~/" {
		home, err := os.UserHomeDir()
		if err != nil {
			return path // return as-is if we can't expand
		}
		return filepath.Join(home, path[2:])
	}
	return path
}

func loadEvents() ([]Event, error) {
	data, err := os.ReadFile(dataFile)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	var events []Event
	if err := json.Unmarshal(data, &events); err != nil {
		return nil, err
	}
	return events, nil
}

func saveEvents(events []Event) error {
	if err := os.MkdirAll(filepath.Dir(dataFile), 0700); err != nil {
		return err
	}
	data, err := json.MarshalIndent(events, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(dataFile, data, 0644)
}

func GetEvents(startDate, endDate string) ([]Event, error) {
	mu.Lock()
	defer mu.Unlock()

	events, err := loadEvents()
	if err != nil {
		return nil, err
	}

	var filtered []Event
	for _, ev := range events {
		evDate := ev.Start[:min(10, len(ev.Start))]
		if evDate >= startDate[:min(10, len(startDate))] && evDate <= endDate[:min(10, len(endDate))] {
			filtered = append(filtered, ev)
		}
	}

	sort.Slice(filtered, func(i, j int) bool {
		return filtered[i].Start < filtered[j].Start
	})

	return filtered, nil
}

func AddEvent(ev Event) (*Event, error) {
	mu.Lock()
	defer mu.Unlock()

	events, err := loadEvents()
	if err != nil {
		return nil, err
	}

	ev.ID = fmt.Sprintf("local-%d", time.Now().UnixNano())
	ev.CreatedAt = time.Now().Format(time.RFC3339)
	if ev.Color == "" {
		ev.Color = "#22d3ee" // cyan default
	}

	events = append(events, ev)
	if err := saveEvents(events); err != nil {
		return nil, err
	}

	return &ev, nil
}

func UpdateEvent(ev Event) error {
	mu.Lock()
	defer mu.Unlock()

	events, err := loadEvents()
	if err != nil {
		return err
	}

	for i, e := range events {
		if e.ID == ev.ID {
			events[i] = ev
			return saveEvents(events)
		}
	}

	return fmt.Errorf("event not found: %s", ev.ID)
}

func DeleteEvent(id string) error {
	mu.Lock()
	defer mu.Unlock()

	events, err := loadEvents()
	if err != nil {
		return err
	}

	var updated []Event
	found := false
	for _, e := range events {
		if e.ID == id {
			found = true
		} else {
			updated = append(updated, e)
		}
	}

	if !found {
		return fmt.Errorf("event not found: %s", id)
	}

	return saveEvents(updated)
}
