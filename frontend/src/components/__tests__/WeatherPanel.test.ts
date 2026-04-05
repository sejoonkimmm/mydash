import { describe, it, expect } from 'vitest';

// weatherEmoji extracted for unit testing (mirrors WeatherPanel.tsx logic)
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

describe('weatherEmoji', () => {
  it('returns sun emoji for code 0 during day', () => {
    expect(weatherEmoji(0, true)).toBe('☀️');
  });

  it('returns moon emoji for code 0 at night', () => {
    expect(weatherEmoji(0, false)).toBe('🌙');
  });

  it('returns partly cloudy for codes 1-3', () => {
    expect(weatherEmoji(1, true)).toBe('⛅');
    expect(weatherEmoji(3, true)).toBe('⛅');
  });

  it('returns fog emoji for codes 45-48', () => {
    expect(weatherEmoji(45, true)).toBe('🌫️');
    expect(weatherEmoji(48, true)).toBe('🌫️');
  });

  it('returns rain emoji for drizzle codes 51-57', () => {
    expect(weatherEmoji(51, true)).toBe('🌧️');
    expect(weatherEmoji(57, true)).toBe('🌧️');
  });

  it('returns rain emoji for rain codes 61-67', () => {
    expect(weatherEmoji(61, true)).toBe('🌧️');
    expect(weatherEmoji(67, true)).toBe('🌧️');
  });

  it('returns snowflake for snow codes 71-77', () => {
    expect(weatherEmoji(71, true)).toBe('❄️');
    expect(weatherEmoji(77, true)).toBe('❄️');
  });

  it('returns snow shower emoji for codes 80-86', () => {
    expect(weatherEmoji(80, true)).toBe('🌨️');
    expect(weatherEmoji(86, true)).toBe('🌨️');
  });

  it('returns thunderstorm emoji for codes >= 95', () => {
    expect(weatherEmoji(95, true)).toBe('⛈️');
    expect(weatherEmoji(99, true)).toBe('⛈️');
  });

  it('returns question mark for unknown codes (e.g. 88-94)', () => {
    expect(weatherEmoji(88, true)).toBe('❓');
    expect(weatherEmoji(94, true)).toBe('❓');
  });
});
