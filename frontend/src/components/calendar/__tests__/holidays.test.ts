import { describe, it, expect } from 'vitest';
import { computeEaster, getHolidaysForYear, getDaysInMonth } from '../holidays';

describe('computeEaster', () => {
  it('returns March 31 for 2024', () => {
    const easter = computeEaster(2024);
    expect(easter.getFullYear()).toBe(2024);
    expect(easter.getMonth()).toBe(2); // 0-indexed: March = 2
    expect(easter.getDate()).toBe(31);
  });

  it('returns April 20 for 2025', () => {
    const easter = computeEaster(2025);
    expect(easter.getFullYear()).toBe(2025);
    expect(easter.getMonth()).toBe(3); // April = 3
    expect(easter.getDate()).toBe(20);
  });

  it('returns April 5 for 2026', () => {
    const easter = computeEaster(2026);
    expect(easter.getFullYear()).toBe(2026);
    expect(easter.getMonth()).toBe(3); // April = 3
    expect(easter.getDate()).toBe(5);
  });
});

describe('getHolidaysForYear', () => {
  it('returns exactly 10 holidays', () => {
    const holidays = getHolidaysForYear(2025);
    expect(holidays).toHaveLength(10);
  });

  it('returns holidays with date and name fields', () => {
    const holidays = getHolidaysForYear(2025);
    for (const h of holidays) {
      expect(h).toHaveProperty('date');
      expect(h).toHaveProperty('name');
      expect(h).toHaveProperty('nameEN');
    }
  });
});

describe('getDaysInMonth', () => {
  it('returns 29 for February in a leap year (2024)', () => {
    // m=1 means February (0-indexed)
    expect(getDaysInMonth(2024, 1)).toBe(29);
  });

  it('returns 28 for February in a non-leap year (2025)', () => {
    expect(getDaysInMonth(2025, 1)).toBe(28);
  });

  it('returns 31 for January', () => {
    expect(getDaysInMonth(2025, 0)).toBe(31);
  });
});
