# VLR.gg API

A comprehensive, unofficial API for Valorant esports data scraped from [vlr.gg](https://vlr.gg).

## Features

- **Match Data**: Live, upcoming, and completed matches with full player stats per map
- **Player Profiles**: Bio, team history, earnings, and match history
- **Player Stats**: 20+ stats including rating, ACS, KAST, ADR, clutch %, totals, and more
- **Stat Filters**: Filter by event, region, agent, map, and timespan
- **Role Analysis**: Algorithmic player role inference based on agent picks and playstyle
- **Team Data**: Rankings, rosters, and match history
- **Events**: Tournament info, standings, and brackets

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
npm start
```

The server starts at `http://localhost:3000`.

## API Endpoints

### Matches

| Endpoint | Description |
|----------|-------------|
| `GET /api/matches/live` | Get currently live matches |
| `GET /api/matches/upcoming` | Get scheduled matches |
| `GET /api/matches/results` | Get completed matches |
| `GET /api/matches/:id` | Get match details with player stats per map |

**Match Details Response:**
```json
{
  "success": true,
  "data": {
    "id": "123456",
    "team1": { "name": "Sentinels", "score": 2 },
    "team2": { "name": "100 Thieves", "score": 1 },
    "status": "completed",
    "maps": [
      {
        "map": "Ascent",
        "team1Score": 13,
        "team2Score": 9,
        "team1Players": [
          {
            "agent": "Jett",
            "agentRole": "duelist",
            "acs": 285,
            "kills": 24,
            "deaths": 15,
            "assists": 3,
            "kast": 76,
            "adr": 172,
            "headshot": 28,
            "firstKills": 5,
            "firstDeaths": 2
          }
        ]
      }
    ]
  }
}
```

### Players

| Endpoint | Description |
|----------|-------------|
| `GET /api/players?q=:query` | Search players by name |
| `GET /api/players/stats` | Stats leaderboard (see filters below) |
| `GET /api/players/:id` | Get player profile |
| `GET /api/players/:id/matches` | Get player match history |
| `GET /api/players/:id/agents` | Get player agent pool & stats |
| `GET /api/players/:id/role` | Get player role analysis |

**Stats Leaderboard Filters:**

| Parameter | Description |
|-----------|-------------|
| `event_id` | Filter by specific event ID |
| `event_series` | Filter by event series (e.g., "VCT 2024") |
| `region` | Filter by region (na, eu, ap, etc.) |
| `country` | Filter by country code |
| `min_rounds` | Minimum rounds played |
| `min_rating` | Minimum rating |
| `agent` | Filter by agent name |
| `map` | Filter by map name |
| `timespan` | 30, 60, 90, or all (days) |

**Stats Included in Response:**

| Category | Fields |
|----------|--------|
| Core | `rating`, `acs`, `kast`, `adr`, `headshot` |
| Per-Round | `kpr`, `apr`, `fkpr`, `fdpr` |
| Totals | `totalKills`, `totalDeaths`, `totalAssists`, `totalFirstKills`, `totalFirstDeaths` |
| Clutch | `clutchWins`, `clutchAttempts`, `clutchPercent` |
| Other | `rounds`, `killDeathDiff`, `killsMax` (max kills in a map) |

**Role Analysis Response:**
```json
{
  "success": true,
  "data": {
    "primaryRole": "duelist",
    "roleDistribution": {
      "duelist": 72,
      "initiator": 18,
      "controller": 7,
      "sentinel": 3
    },
    "playstyle": {
      "isEntry": true,
      "isAnchor": false,
      "isPlaymaker": false,
      "isFlexible": false,
      "classification": "Entry Fragger"
    }
  }
}
```

> **Note:** Role analysis uses rule-based algorithms (agent→role mapping + stat thresholds), not AI/ML. See DOCUMENTATION.md for details.

### Teams

| Endpoint | Description |
|----------|-------------|
| `GET /api/teams?q=:query` | Search teams by name |
| `GET /api/teams/rankings` | Get global team rankings |
| `GET /api/teams/rankings/:region` | Get regional rankings |
| `GET /api/teams/regions` | List available regions |
| `GET /api/teams/:id` | Get team profile with roster |
| `GET /api/teams/:id/matches` | Get team match history |

**Available Regions:**
- `na` - North America
- `eu` - Europe
- `ap` - Asia Pacific
- `br` - Brazil
- `kr` - Korea
- `jp` - Japan
- `la` - Latin America
- `la-n` - Latin America North
- `la-s` - Latin America South
- `oce` - Oceania
- `mn` - MENA
- `cn` - China
- `gc` - Game Changers

### Events

| Endpoint | Description |
|----------|-------------|
| `GET /api/events?status=:status` | Get events (ongoing/upcoming/completed) |
| `GET /api/events/search?q=:query` | Search events by name |
| `GET /api/events/:id` | Get event details with standings |

## Caching

The API uses intelligent caching with different TTLs:

| Data Type | TTL |
|-----------|-----|
| Live matches | 30 seconds |
| Upcoming matches | 5 minutes |
| Completed matches | 1 hour |
| Match details | 24 hours |
| Player/Team profiles | 30 minutes |
| Rankings | 1 hour |
| Stats leaderboard | 30 minutes |

Set `REDIS_URL` environment variable to use Redis caching. Falls back to in-memory cache if not configured.

## Environment Variables

```env
PORT=3000           # Server port (default: 3000)
REDIS_URL=          # Redis connection URL (optional)
```

## Rate Limiting

Default: 60 requests per minute per IP.

## Project Structure

```
src/
├── config/         # Configuration
├── lib/
│   ├── scraper.ts  # Axios + Cheerio scraping utilities
│   ├── cache.ts    # Redis/in-memory caching
│   └── roles.ts    # Role inference system
├── scrapers/
│   ├── matches.ts  # Match data scraper
│   ├── players.ts  # Player data scraper
│   ├── teams.ts    # Team data scraper
│   └── events.ts   # Event data scraper
├── routes/         # Express route handlers
├── types/          # TypeScript type definitions
└── index.ts        # Entry point
```

## Disclaimer

This is an unofficial API and is not affiliated with or endorsed by vlr.gg. Use responsibly and respect vlr.gg's servers.

## License

MIT
