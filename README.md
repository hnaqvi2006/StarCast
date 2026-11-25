# StarCast

StarCast tells me which night this week is best for stargazing, and where. I built it as my final project for Web Systems for IT by expanding the weather API project I made in October.

**Live app:** https://hnaqvi2006.github.io/StarCast/

## What it does

- Search a city, or use my current location, and get tonight's sky score out of 100, cloud cover, temperature, sunset and moon phase.
- See tonight's cloud cover hour by hour, from 6 PM to 5 AM.
- Compare the next 7 nights. The best one gets a badge.
- Save stargazing spots and reopen their forecast with one click.
- Keep an observation log of what I saw, where, when, and how good it was.
- The page remembers the last place I looked up.

## How the code is organized

| File | Job |
|---|---|
| `index.html` | Page structure: search bar, tonight card, hourly bars, 7-night outlook, saved spots, observation log |
| `styles.css` | Night-sky look, card layout, colors for good / fair / poor nights, phone layout |
| `script.js` | Everything the user does: search, Use my location, calling the APIs, building the forecast, showing spots and the log |
| `moon.js` | Works out the moon phase and how much of it is lit for any date |
| `database.js` | Connects to Supabase and holds the six database functions |
| `schema.sql` | The SQL I ran in Supabase to create the tables and security rules |

## How a search works

1. `findCity()` sends the city name to the Open-Meteo **Geocoding API** with `fetch()` and gets back latitude and longitude as JSON.
2. `loadForecast()` sends those coordinates to the Open-Meteo **Forecast API** and asks for 8 days of hourly cloud cover and temperature, plus sunset.
3. `buildNights()` looks at each of the next 7 nights. It averages cloud cover from 9 PM to 2 AM and gets the moon for that night from `moon.js`.
4. `getSkyScore()` turns that into a score: **100 − (clouds × 0.7) − (moon % lit × 0.3)**. Clouds matter most because they block everything. A bright moon only washes out the faint stuff.
5. `showTonight()`, `showHourly()` and `showWeek()` build the page with `createElement` and `textContent`.
6. The place gets saved in `localStorage`, so it loads again after a refresh.

## The moon math

`moon.js` starts from a known new moon (January 6, 2000) and counts the days since then. Dividing by the 29.53-day lunar cycle tells me where the moon is in its cycle. From that I get the phase name and the % lit.

## The database

Supabase (Postgres) holds two tables:

- **spots**: name, latitude, longitude
- **observations**: what I saw, spot name, date, rating (1–5), notes

Row Level Security is on. The public key can only **read, add and delete** rows. Nobody can edit them. Check constraints reject bad data even if someone skips my form, such as a rating of 9, a blank name or a date in the future.

## Security choices

- User text is always shown with `textContent`, never `innerHTML`, so nobody can inject HTML or scripts into the page.
- The Supabase key in `database.js` is a publishable key, which is meant to be public. The security rules in the database are what protect the data.

## What I'd add next

- Accounts with Supabase Auth, so each person's spots and log are private
- Moonrise and moonset times, so moonlight only counts while the moon is up
- A light-pollution layer to rank spots by how dark they are
- Email alerts when a saved spot has a clear, dark night coming

## Run it locally

Open the folder in VS Code and use Live Server on `index.html`. No install needed.

Weather data from [Open-Meteo](https://open-meteo.com/).
