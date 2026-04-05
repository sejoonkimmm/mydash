import type { CityWeather } from '../types';
import LoadingSkeleton from './shared/LoadingSkeleton';
import ErrorBanner from './shared/ErrorBanner';

interface Props {
  cities: CityWeather[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

function weatherEmoji(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? '\u2600\uFE0F' : '\uD83C\uDF19';
  if (code <= 3) return '\u26C5';
  if (code <= 48) return '\uD83C\uDF2B\uFE0F';
  if (code <= 57) return '\uD83C\uDF27\uFE0F';
  if (code <= 67) return '\uD83C\uDF27\uFE0F';
  if (code <= 77) return '\u2744\uFE0F';
  if (code <= 86) return '\uD83C\uDF28\uFE0F';
  if (code >= 95) return '\u26C8\uFE0F';
  return '\u2753';
}

function getDayName(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en', { weekday: 'short' });
}

function formatLastUpdated(date: Date | null): string {
  if (!date) return '';
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

export default function WeatherPanel({ cities, loading, error, lastUpdated, onRefresh }: Props) {
  return (
    <div>
      <div className="section-header">
        <div className="section-header-left">
          <h2 className="section-title">Weather</h2>
          {lastUpdated && (
            <span className="last-updated">{formatLastUpdated(lastUpdated)}</span>
          )}
        </div>
        <button className="refresh-btn" onClick={onRefresh}>Refresh</button>
      </div>

      {error && <ErrorBanner message={error} onRetry={onRefresh} />}

      {loading && cities.length === 0 ? (
        <div className="weather-grid">
          <div className="weather-city"><LoadingSkeleton lines={5} height={20} /></div>
          <div className="weather-city"><LoadingSkeleton lines={5} height={20} /></div>
        </div>
      ) : (
        <div className="weather-grid">
          {cities.filter(Boolean).map((city, i) => (
            <div key={i} className="weather-city">
              <div className="weather-city-header">
                <div>
                  <div className="weather-city-name">{city.city}</div>
                  <div className="weather-condition">
                    {weatherEmoji(city.weatherCode, city.isDay)} {city.description}
                  </div>
                </div>
                <div>
                  <span className="weather-temp-main">{Math.round(city.temperature)}</span>
                  <span className="weather-temp-unit">&deg;C</span>
                </div>
              </div>

              <div className="weather-details">
                <div className="weather-detail">
                  <span className="weather-detail-label">Feels like</span>
                  <span className="weather-detail-value">{Math.round(city.apparentTemp)}&deg;C</span>
                </div>
                <div className="weather-detail">
                  <span className="weather-detail-label">Humidity</span>
                  <span className="weather-detail-value">{city.humidity}%</span>
                </div>
                <div className="weather-detail">
                  <span className="weather-detail-label">Wind</span>
                  <span className="weather-detail-value">{Math.round(city.windSpeed)} km/h</span>
                </div>
                {city.precipitation > 0 && (
                  <div className="weather-detail">
                    <span className="weather-detail-label">Rain</span>
                    <span className="weather-detail-value">{city.precipitation} mm</span>
                  </div>
                )}
              </div>

              {city.forecast && city.forecast.length > 1 && (
                <div className="weather-forecast">
                  {city.forecast.slice(1).map((day, j) => (
                    <div key={j} className="forecast-day">
                      <span className="forecast-day-name">{getDayName(day.date)}</span>
                      <span className="forecast-day-icon">{weatherEmoji(day.weatherCode, true)}</span>
                      <span className="forecast-day-temps">
                        {Math.round(day.tempMax)}&deg; <span>{Math.round(day.tempMin)}&deg;</span>
                      </span>
                      {day.precipProb > 0 && (
                        <span className="forecast-day-rain">\uD83D\uDCA7 {day.precipProb}%</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
