package holidays

import (
	"fmt"
	"time"
)

// Holiday represents a public holiday.
type Holiday struct {
	Date   string `json:"date"`
	Name   string `json:"name"`
	NameEN string `json:"nameEN"`
}

// easterSunday calculates the date of Easter Sunday for a given year
// using the anonymous Gregorian algorithm (Computus).
func easterSunday(year int) time.Time {
	a := year % 19
	b := year / 100
	c := year % 100
	d := b / 4
	e := b % 4
	f := (b + 8) / 25
	g := (b - f + 1) / 3
	h := (19*a + b - d - g + 15) % 30
	i := c / 4
	k := c % 4
	l := (32 + 2*e + 2*i - h - k) % 7
	m := (a + 11*h + 22*l) / 451
	month := (h + l - 7*m + 114) / 31
	day := ((h + l - 7*m + 114) % 31) + 1
	return time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.UTC)
}

func formatDate(t time.Time) string {
	return fmt.Sprintf("%04d-%02d-%02d", t.Year(), t.Month(), t.Day())
}

func addDays(t time.Time, days int) time.Time {
	return t.AddDate(0, 0, days)
}

// GetHolidays returns all public holidays for Niedersachsen for the given year.
// Covers fixed holidays and Easter-based movable holidays.
func GetHolidays(year int) []Holiday {
	easter := easterSunday(year)

	holidays := []Holiday{
		// Fixed holidays
		{
			Date:   fmt.Sprintf("%04d-01-01", year),
			Name:   "Neujahr",
			NameEN: "New Year's Day",
		},
		{
			Date:   fmt.Sprintf("%04d-05-01", year),
			Name:   "Tag der Arbeit",
			NameEN: "Labour Day",
		},
		{
			Date:   fmt.Sprintf("%04d-10-03", year),
			Name:   "Tag der Deutschen Einheit",
			NameEN: "German Unity Day",
		},
		{
			Date:   fmt.Sprintf("%04d-10-31", year),
			Name:   "Reformationstag",
			NameEN: "Reformation Day",
		},
		{
			Date:   fmt.Sprintf("%04d-12-25", year),
			Name:   "1. Weihnachtstag",
			NameEN: "Christmas Day",
		},
		{
			Date:   fmt.Sprintf("%04d-12-26", year),
			Name:   "2. Weihnachtstag",
			NameEN: "Boxing Day",
		},
		// Easter-based movable holidays
		{
			Date:   formatDate(addDays(easter, -2)),
			Name:   "Karfreitag",
			NameEN: "Good Friday",
		},
		{
			Date:   formatDate(addDays(easter, 1)),
			Name:   "Ostermontag",
			NameEN: "Easter Monday",
		},
		{
			Date:   formatDate(addDays(easter, 39)),
			Name:   "Christi Himmelfahrt",
			NameEN: "Ascension Day",
		},
		{
			Date:   formatDate(addDays(easter, 50)),
			Name:   "Pfingstmontag",
			NameEN: "Whit Monday",
		},
	}

	return holidays
}

// GetHolidaysRange returns all public holidays for Niedersachsen
// for each year in the inclusive range [startYear, endYear].
func GetHolidaysRange(startYear, endYear int) []Holiday {
	var result []Holiday
	for year := startYear; year <= endYear; year++ {
		result = append(result, GetHolidays(year)...)
	}
	return result
}
