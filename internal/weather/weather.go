package weather

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

type CityWeather struct {
	City          string        `json:"city"`
	Temperature   float64       `json:"temperature"`
	ApparentTemp  float64       `json:"apparentTemp"`
	Humidity      int           `json:"humidity"`
	WindSpeed     float64       `json:"windSpeed"`
	WeatherCode   int           `json:"weatherCode"`
	IsDay         bool          `json:"isDay"`
	Precipitation float64       `json:"precipitation"`
	Description   string        `json:"description"`
	Forecast      []ForecastDay `json:"forecast"`
}

type ForecastDay struct {
	Date        string  `json:"date"`
	TempMax     float64 `json:"tempMax"`
	TempMin     float64 `json:"tempMin"`
	WeatherCode int     `json:"weatherCode"`
	PrecipProb  int     `json:"precipProb"`
	PrecipSum   float64 `json:"precipSum"`
	Description string  `json:"description"`
}

type openMeteoResponse struct {
	Current struct {
		Temperature2m    float64 `json:"temperature_2m"`
		ApparentTemp     float64 `json:"apparent_temperature"`
		RelativeHumidity int     `json:"relative_humidity_2m"`
		WindSpeed10m     float64 `json:"wind_speed_10m"`
		WeatherCode      int     `json:"weather_code"`
		IsDay            int     `json:"is_day"`
		Precipitation    float64 `json:"precipitation"`
	} `json:"current"`
	Daily struct {
		Time        []string  `json:"time"`
		TempMax     []float64 `json:"temperature_2m_max"`
		TempMin     []float64 `json:"temperature_2m_min"`
		WeatherCode []int     `json:"weather_code"`
		PrecipProb  []int     `json:"precipitation_probability_max"`
		PrecipSum   []float64 `json:"precipitation_sum"`
	} `json:"daily"`
}

type geocodeResponse struct {
	Results []struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
		Name      string  `json:"name"`
		Country   string  `json:"country"`
	} `json:"results"`
}

var httpClient = &http.Client{Timeout: 10 * time.Second}

func GetWeather(city string, forecastDays int) (*CityWeather, error) {
	lat, lon, err := geocode(city)
	if err != nil {
		return nil, fmt.Errorf("geocode %s: %w", city, err)
	}

	u := fmt.Sprintf(
		"https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f"+
			"&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day,precipitation"+
			"&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,precipitation_sum"+
			"&forecast_days=%d&timezone=auto",
		lat, lon, forecastDays,
	)

	resp, err := httpClient.Get(u)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("weather API returned %s", resp.Status)
	}

	var result openMeteoResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	cur := result.Current
	data := &CityWeather{
		City:          city,
		Temperature:   cur.Temperature2m,
		ApparentTemp:  cur.ApparentTemp,
		Humidity:      cur.RelativeHumidity,
		WindSpeed:     cur.WindSpeed10m,
		WeatherCode:   cur.WeatherCode,
		IsDay:         cur.IsDay == 1,
		Precipitation: cur.Precipitation,
		Description:   weatherCodeToDesc(cur.WeatherCode),
	}

	for i := range result.Daily.Time {
		day := ForecastDay{
			Date:        result.Daily.Time[i],
			TempMax:     result.Daily.TempMax[i],
			TempMin:     result.Daily.TempMin[i],
			WeatherCode: result.Daily.WeatherCode[i],
			Description: weatherCodeToDesc(result.Daily.WeatherCode[i]),
		}
		if i < len(result.Daily.PrecipProb) {
			day.PrecipProb = result.Daily.PrecipProb[i]
		}
		if i < len(result.Daily.PrecipSum) {
			day.PrecipSum = result.Daily.PrecipSum[i]
		}
		data.Forecast = append(data.Forecast, day)
	}

	return data, nil
}

func GetMultiCityWeather(cities []string, forecastDays int) []*CityWeather {
	results := make([]*CityWeather, len(cities))
	ch := make(chan struct {
		idx  int
		data *CityWeather
	}, len(cities))

	for i, city := range cities {
		go func(idx int, c string) {
			data, err := GetWeather(c, forecastDays)
			if err != nil {
				data = &CityWeather{City: c}
			}
			ch <- struct {
				idx  int
				data *CityWeather
			}{idx, data}
		}(i, city)
	}

	for range cities {
		r := <-ch
		results[r.idx] = r.data
	}

	return results
}

func geocode(city string) (float64, float64, error) {
	u := "https://geocoding-api.open-meteo.com/v1/search?name=" + url.QueryEscape(city) + "&count=1"
	resp, err := httpClient.Get(u)
	if err != nil {
		return 0, 0, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return 0, 0, fmt.Errorf("weather API returned %s", resp.Status)
	}

	var result geocodeResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, 0, err
	}
	if len(result.Results) == 0 {
		return 0, 0, fmt.Errorf("city not found: %s", city)
	}

	return result.Results[0].Latitude, result.Results[0].Longitude, nil
}

func weatherCodeToDesc(code int) string {
	switch {
	case code == 0:
		return "Clear"
	case code <= 3:
		return "Cloudy"
	case code <= 48:
		return "Fog"
	case code <= 55:
		return "Drizzle"
	case code <= 57:
		return "Fz. Drizzle"
	case code <= 65:
		return "Rain"
	case code <= 67:
		return "Fz. Rain"
	case code <= 75:
		return "Snow"
	case code == 77:
		return "Snow grains"
	case code <= 82:
		return "Showers"
	case code <= 86:
		return "Snow showers"
	case code == 95:
		return "Thunderstorm"
	case code <= 99:
		return "T-storm+hail"
	default:
		return "Unknown"
	}
}
