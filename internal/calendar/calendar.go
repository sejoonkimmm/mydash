package calendar

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	gcal "google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
)

type Event struct {
	ID          string `json:"id"`
	Start       string `json:"start"`
	End         string `json:"end"`
	Title       string `json:"title"`
	AccountName string `json:"accountName"`
	AllDay      bool   `json:"allDay"`
	Location    string `json:"location"`
	Color       string `json:"color"`
}

type AccountConfig struct {
	Name            string `json:"name"`
	CredentialsFile string `json:"credentialsFile"`
	TokenFile       string `json:"tokenFile"`
	Color           string `json:"color"`
}

var accountColors = []string{"#7C3AED", "#EF4444", "#10B981", "#F59E0B", "#3B82F6", "#EC4899"}

func GetEvents(accounts []AccountConfig, lookaheadHours int) ([]Event, error) {
	var allEvents []Event
	now := time.Now()
	end := now.Add(time.Duration(lookaheadHours) * time.Hour)

	for i, acc := range accounts {
		if acc.Color == "" {
			acc.Color = accountColors[i%len(accountColors)]
		}
		events, err := getEventsForAccount(acc, now, end)
		if err != nil {
			allEvents = append(allEvents, Event{
				Start:       now.Format(time.RFC3339),
				Title:       fmt.Sprintf("[%s] Error: %v", acc.Name, err),
				AccountName: acc.Name,
				Color:       acc.Color,
			})
			continue
		}
		allEvents = append(allEvents, events...)
	}

	sort.Slice(allEvents, func(i, j int) bool {
		return allEvents[i].Start < allEvents[j].Start
	})

	return allEvents, nil
}

func getEventsForAccount(acc AccountConfig, start, end time.Time) ([]Event, error) {
	credsFile := expandPath(acc.CredentialsFile)
	tokenFile := expandPath(acc.TokenFile)

	creds, err := os.ReadFile(credsFile)
	if err != nil {
		return nil, fmt.Errorf("credentials: %w", err)
	}

	config, err := google.ConfigFromJSON(creds, gcal.CalendarReadonlyScope)
	if err != nil {
		return nil, fmt.Errorf("parse credentials: %w", err)
	}

	tok, err := loadToken(tokenFile)
	if err != nil {
		return nil, fmt.Errorf("token (run auth first): %w", err)
	}

	client := config.Client(context.Background(), tok)
	srv, err := gcal.NewService(context.Background(), option.WithHTTPClient(client))
	if err != nil {
		return nil, err
	}

	result, err := srv.Events.List("primary").
		ShowDeleted(false).
		SingleEvents(true).
		TimeMin(start.Format(time.RFC3339)).
		TimeMax(end.Format(time.RFC3339)).
		MaxResults(100).
		OrderBy("startTime").
		Do()
	if err != nil {
		return nil, fmt.Errorf("list events: %w", err)
	}

	var events []Event
	for _, item := range result.Items {
		ev := Event{
			ID:          item.Id,
			Title:       item.Summary,
			AccountName: acc.Name,
			Location:    item.Location,
			Color:       acc.Color,
		}

		if item.Start.DateTime != "" {
			ev.Start = item.Start.DateTime
			ev.End = item.End.DateTime
		} else if item.Start.Date != "" {
			ev.Start = item.Start.Date
			ev.End = item.End.Date
			ev.AllDay = true
		}

		events = append(events, ev)
	}

	return events, nil
}

func RunAuthFlow(credentialsFile, tokenFile string) error {
	credsFile := expandPath(credentialsFile)
	tokenPath := expandPath(tokenFile)

	creds, err := os.ReadFile(credsFile)
	if err != nil {
		return fmt.Errorf("read credentials: %w", err)
	}

	config, err := google.ConfigFromJSON(creds, gcal.CalendarReadonlyScope)
	if err != nil {
		return err
	}

	// Generate a random CSRF state token.
	stateBytes := make([]byte, 16)
	if _, err := rand.Read(stateBytes); err != nil {
		return fmt.Errorf("generate state token: %w", err)
	}
	stateToken := hex.EncodeToString(stateBytes)

	// Local server callback flow
	codeCh := make(chan string, 1)
	server := &http.Server{Addr: ":8085"}
	mux := http.NewServeMux()
	mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("state") != stateToken {
			http.Error(w, "invalid state parameter", http.StatusBadRequest)
			return
		}
		code := r.URL.Query().Get("code")
		if code != "" {
			codeCh <- code
			fmt.Fprintln(w, "Authorization successful! You can close this window.")
		}
	})
	server.Handler = mux

	go server.ListenAndServe()
	defer server.Close()

	config.RedirectURL = "http://localhost:8085/callback"
	authURL := config.AuthCodeURL(stateToken, oauth2.AccessTypeOffline)
	fmt.Printf("Open this URL in your browser:\n%s\n\nWaiting for authorization...\n", authURL)

	code := <-codeCh
	tok, err := config.Exchange(context.Background(), code)
	if err != nil {
		return err
	}

	return saveToken(tokenPath, tok)
}

func loadToken(path string) (*oauth2.Token, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	tok := &oauth2.Token{}
	return tok, json.NewDecoder(f).Decode(tok)
}

func saveToken(path string, token *oauth2.Token) error {
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return err
	}
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	return json.NewEncoder(f).Encode(token)
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
