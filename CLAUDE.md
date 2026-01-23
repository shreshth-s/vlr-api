# CLAUDE.md - Project Context for AI Assistants

This file contains full context about this project for AI assistants (like Claude) to quickly understand what has been built and modified.

---

## Project Overview

**Name:** VLR.gg API
**Purpose:** Unofficial REST API that scrapes Valorant esports data from vlr.gg
**Tech Stack:** Node.js, TypeScript, Express, Cheerio (scraping), Redis (optional caching)

---

## How to Run

```bash
# Install dependencies
npm install

# Start development server (hot reload)
npm run dev

# Production build
npm run build && npm start
```

Server runs at `http://localhost:3000`

---

## Key Files

### Core Application
| File | Purpose |
|------|---------|
| `src/index.ts` | Express app entry point, middleware setup |
| `src/config/index.ts` | Configuration (ports, cache TTLs, scraper settings) |
| `src/types/index.ts` | All TypeScript interfaces and types |

### Routes (API Endpoints)
| File | Endpoints |
|------|-----------|
| `src/routes/index.ts` | Route aggregator |
| `src/routes/matches.ts` | `/api/matches/*` - live, upcoming, results, details |
| `src/routes/players.ts` | `/api/players/*` - search, stats, profile, agents, role |
| `src/routes/teams.ts` | `/api/teams/*` - search, rankings, profile, matches |
| `src/routes/events.ts` | `/api/events/*` - list, search, details |

### Scrapers
| File | Purpose |
|------|---------|
| `src/scrapers/matches.ts` | Scrapes match data from vlr.gg |
| `src/scrapers/players.ts` | Scrapes player stats, profiles, leaderboard |
| `src/scrapers/teams.ts` | Scrapes team rankings, profiles |
| `src/scrapers/events.ts` | Scrapes event data |

### Libraries
| File | Purpose |
|------|---------|
| `src/lib/scraper.ts` | Axios + Cheerio scraping utilities |
| `src/lib/cache.ts` | Redis/in-memory caching layer |
| `src/lib/roles.ts` | Algorithmic role analysis (NOT AI/ML) |

### Documentation & Examples
| File | Purpose |
|------|---------|
| `README.md` | Quick start guide |
| `DOCUMENTATION.md` | Full API documentation |
| `CLAUDE.md` | This file - AI context |
| `dashboard.html` | Visual dashboard showing all API features |
| `example.py` | Python usage example |
| `dashboard_example.py` | Python dashboard data fetcher |

---

## API Endpoints Summary

### Matches
- `GET /api/matches/live` - Live matches
- `GET /api/matches/upcoming` - Upcoming matches
- `GET /api/matches/results` - Completed matches
- `GET /api/matches/:id` - Match details with per-map player stats

### Players
- `GET /api/players?q=name` - Search players
- `GET /api/players/stats` - Stats leaderboard (filterable)
- `GET /api/players/:id` - Player profile
- `GET /api/players/:id/matches` - Player match history
- `GET /api/players/:id/agents` - Player agent stats
- `GET /api/players/:id/role` - Algorithmic role analysis

### Teams
- `GET /api/teams?q=name` - Search teams
- `GET /api/teams/rankings` - Global rankings
- `GET /api/teams/rankings/:region` - Regional rankings
- `GET /api/teams/regions` - List regions
- `GET /api/teams/:id` - Team profile with roster
- `GET /api/teams/:id/matches` - Team match history

### Events
- `GET /api/events?status=ongoing` - Events list
- `GET /api/events/search?q=name` - Search events
- `GET /api/events/:id` - Event details

---

## Stats Leaderboard Fields

The `/api/players/stats` endpoint returns ALL these stats (added during this session):

```typescript
interface PlayerStats {
  // Core stats
  rounds: number;
  rating: number;          // VLR 2.0 rating
  acs: number;             // Average Combat Score
  kast: number;            // Kill/Assist/Survive/Trade %
  adr: number;             // Average Damage per Round
  headshot: number;        // Headshot %

  // Per-round stats
  kpr: number;             // Kills per round
  apr: number;             // Assists per round
  fkpr: number;            // First kills per round
  fdpr: number;            // First deaths per round

  // Clutch stats (ADDED THIS SESSION)
  clutchWins: number;      // Clutches won
  clutchAttempts: number;  // Total clutch situations
  clutchPercent: number;   // Clutch win rate

  // Total stats (ADDED THIS SESSION)
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  totalFirstKills: number;
  totalFirstDeaths: number;
  killsMax: number;        // Max kills in a single map

  // Legacy fields (same as totals)
  kills: number;
  deaths: number;
  assists: number;
  killDeathDiff: number;
  firstKills: number;
  firstDeaths: number;
}
```

### Stats Filters
```
/api/players/stats?region=na&timespan=60&min_rounds=100&agent=jett&map=ascent
```

| Filter | Values |
|--------|--------|
| `event_id` | Event ID |
| `event_series` | e.g., "VCT 2024" |
| `region` | na, eu, ap, br, kr, jp, la, oce, mn, cn, gc |
| `country` | Country code |
| `agent` | Agent name |
| `map` | Map name |
| `timespan` | 30, 60, 90, all |
| `min_rounds` | Minimum rounds played |
| `min_rating` | Minimum rating |

---

## Role Analysis System

The `/api/players/:id/role` endpoint uses **rule-based algorithmic analysis**, NOT AI/ML.

### How It Works:
1. **Agent → Role Mapping**: Each agent maps to duelist/controller/initiator/sentinel
2. **Round Counting**: Count rounds played on each role
3. **Playstyle Detection**: Based on stats thresholds
   - Entry Fragger: FK/FD ratio > 1.2
   - Anchor: High KAST + low first deaths
   - Playmaker: High assists + initiator role
   - Flex: Plays 2+ roles significantly

### Classifications:
- Entry Fragger, Star Duelist
- Smoke Player
- Playmaker, Info Gatherer
- Anchor, Site Holder
- Flex Entry, Flex Support, Flex Player

---

## Changes Made This Session

### 1. Added Clutch Stats
- Updated `src/types/index.ts` - Added clutchWins, clutchAttempts, clutchPercent
- Updated `src/scrapers/players.ts` - Parse columns 13-14 (CL%, CL) from VLR stats page
- Note: Clutch stats only available in leaderboard, NOT in per-map match details

### 2. Added Total Stats
- Updated `src/types/index.ts` - Added totalKills, totalDeaths, totalAssists, totalFirstKills, totalFirstDeaths, killsMax
- Updated `src/scrapers/players.ts` - Parse columns 15-20 from VLR stats page

### 3. Updated Documentation
- `README.md` - Added stats table, features update
- `DOCUMENTATION.md` - Full stats reference, radar chart guide, data sources explanation
- Clarified that role analysis is algorithmic, NOT AI-powered

### 4. Created Dashboard
- `dashboard.html` - Full visual dashboard with:
  - Live/upcoming/completed matches
  - Team rankings (by region)
  - Player stats leaderboard (all 20+ stats)
  - Top player profile card
  - Radar chart comparing top 3 players
  - Ongoing events
  - Match details with per-map stats
  - Region/timespan filters
  - Auto-refresh every 60 seconds

### 5. Created Examples
- `example.py` - Basic Python usage
- `dashboard_example.py` - Python dashboard data fetcher

---

## VLR.gg Scraping Notes

### Stats Leaderboard Page (vlr.gg/stats)
Columns 0-20:
```
0: Player, 1: Agents, 2: Rnd, 3: R2.0, 4: ACS, 5: K:D, 6: KAST,
7: ADR, 8: KPR, 9: APR, 10: FKPR, 11: FDPR, 12: HS%, 13: CL%, 14: CL,
15: KMax, 16: K, 17: D, 18: A, 19: FK, 20: FD
```

### Match Details Page (vlr.gg/:matchId)
Player stats columns:
```
R, ACS, K, D, A, +/-, KAST, ADR, HS%, FK, FD
```
Note: No clutch data per-map - only aggregated in leaderboard

### Data NOT Available on VLR
- Multi-kill stats (2K, 3K, 4K, Ace)
- Economy stats (detailed)
- Round-by-round breakdown (partially available but not parsed)

---

## Caching TTLs

| Data Type | TTL |
|-----------|-----|
| Live matches | 30 seconds |
| Upcoming matches | 5 minutes |
| Completed matches | 1 hour |
| Match details | 24 hours |
| Player/Team profiles | 30 minutes |
| Rankings | 1 hour |
| Stats leaderboard | 30 minutes |

---

## Known Issues / Notes

1. **Match details don't have clutch stats** - VLR only shows clutch data in aggregated leaderboard
2. **Role analysis endpoint is slow** - Fetches multiple match details sequentially
3. **Team rankings for some regions may be empty** - Depends on VLR data availability
4. **Agent images in match details** - Sometimes parsed from src path if title/alt missing

---

## Testing Commands

```bash
# Test stats with all fields
curl "http://localhost:3000/api/players/stats?region=na&timespan=60&min_rounds=100"

# Test match details
curl "http://localhost:3000/api/matches/594743"

# Test team rankings
curl "http://localhost:3000/api/teams/rankings/na"

# Python test
python example.py
python dashboard_example.py
```

---

## User's Goal

The user is building a **player comparison tool with radar charts** for Valorant esports. The API now provides all necessary stats:
- Rating, ACS, KAST, ADR for core performance
- Clutch % for clutch situations
- FKPR for entry fragging
- HS% for aim accuracy
- KMax for peak performance
- All filterable by tournament, region, agent, map, timespan

The `dashboard.html` file demonstrates a working radar chart comparing players.

---

## File Structure

```
vlr-api/
├── src/
│   ├── config/index.ts
│   ├── lib/
│   │   ├── scraper.ts
│   │   ├── cache.ts
│   │   └── roles.ts
│   ├── scrapers/
│   │   ├── matches.ts
│   │   ├── players.ts
│   │   ├── teams.ts
│   │   └── events.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── matches.ts
│   │   ├── players.ts
│   │   ├── teams.ts
│   │   └── events.ts
│   ├── types/index.ts
│   └── index.ts
├── example/
│   └── Screenshot 2026-01-21 155244.png  (radar chart reference image)
├── package.json
├── tsconfig.json
├── README.md
├── DOCUMENTATION.md
├── CLAUDE.md              ← This file
├── dashboard.html
├── example.py
└── dashboard_example.py
```

---

*Last updated: 2026-01-21*
