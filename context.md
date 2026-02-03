# VLR.gg API - Complete Context

A comprehensive unofficial REST API that scrapes Valorant esports data from vlr.gg.

---

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express
- **Scraping:** Axios + Cheerio
- **Caching:** Redis (optional, falls back to in-memory)
- **Security:** Helmet, CORS, express-rate-limit

---

## Quick Start

```bash
npm install
npm run dev        # Development (hot reload)
# OR
npm run build && npm start   # Production
```

Server runs at `http://localhost:3000`

---

## API Endpoints

### Matches

| Endpoint | Description |
|----------|-------------|
| `GET /api/matches/live` | Currently live matches |
| `GET /api/matches/upcoming` | Scheduled upcoming matches |
| `GET /api/matches/results` | Completed matches |
| `GET /api/matches/:id` | Match details with per-map player stats |

#### Live Match Response
```json
{
  "success": true,
  "data": [{
    "id": "596413",
    "team1": { "name": "100 Thieves", "score": 1, "countryCode": "us" },
    "team2": { "name": "Sentinels", "score": 0, "countryCode": "us" },
    "status": "live",
    "event": "VCT 2026: Americas Kickoff",
    "stage": "Main Event",
    "matchTime": "5:00 PM",
    "eventLogo": "https://..."
  }]
}
```

#### Match Details Response (per-map stats)
```json
{
  "success": true,
  "data": {
    "id": "596413",
    "team1": { "id": "120", "name": "100 Thieves", "score": 2 },
    "team2": { "id": "2", "name": "Sentinels", "score": 1 },
    "status": "completed",
    "format": "Bo3",
    "maps": [{
      "map": "Ascent",
      "team1Score": 13,
      "team2Score": 9,
      "team1Players": [{
        "playerName": "TenZ",
        "agent": "Jett",
        "agentRole": "duelist",
        "acs": 285,
        "kills": 24,
        "deaths": 15,
        "assists": 3,
        "killDeathDiff": 9,
        "kast": 76,
        "adr": 172,
        "headshot": 28,
        "firstKills": 5,
        "firstDeaths": 2
      }]
    }],
    "streams": [{ "name": "VCT Americas", "url": "https://..." }]
  }
}
```

---

### Players

| Endpoint | Description |
|----------|-------------|
| `GET /api/players?q=name` | Search players by name |
| `GET /api/players/stats` | Stats leaderboard (with filters) |
| `GET /api/players/:id` | Player profile |
| `GET /api/players/:id/matches` | Player match history |
| `GET /api/players/:id/agents` | Player agent pool & stats |
| `GET /api/players/:id/role` | Algorithmic role analysis |

#### Stats Leaderboard Filters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `event_id` | Specific event ID | `2684` |
| `event_series` | Event series name | `VCT 2026` |
| `region` | Region code | `na`, `eu`, `ap`, `br`, `kr`, `jp`, `la`, `oce`, `mn`, `cn`, `gc` |
| `country` | Country code | `us`, `kr`, `br` |
| `min_rounds` | Minimum rounds played | `100` |
| `min_rating` | Minimum rating | `1.0` |
| `agent` | Filter by agent | `jett`, `omen` |
| `map` | Filter by map | `ascent`, `haven` |
| `timespan` | Time period | `30`, `60`, `90`, `all` |
| `tier` | Team tier | `t1`, `t2` |
| `tier_status` | T1 status (requires tier=t1) | `partner`, `ascended` |

#### All Stats Fields Available

| Category | Fields |
|----------|--------|
| **Core** | `rating`, `acs`, `kast`, `adr`, `headshot` |
| **Per-Round** | `kpr`, `apr`, `fkpr`, `fdpr` |
| **Totals** | `totalKills`, `totalDeaths`, `totalAssists`, `totalFirstKills`, `totalFirstDeaths` |
| **Clutch** | `clutchWins`, `clutchAttempts`, `clutchPercent` |
| **Other** | `rounds`, `killDeathDiff`, `killsMax` |

#### Role Analysis Response
```json
{
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
```

**Classifications:** Entry Fragger, Star Duelist, Smoke Player, Playmaker, Info Gatherer, Anchor, Site Holder, Flex Entry, Flex Support, Flex Player, Standard

---

### Teams

| Endpoint | Description |
|----------|-------------|
| `GET /api/teams?q=name` | Search teams by name |
| `GET /api/teams/rankings` | Global team rankings |
| `GET /api/teams/rankings/:region` | Regional rankings |
| `GET /api/teams/regions` | List available regions |
| `GET /api/teams/:id` | Team profile with roster |
| `GET /api/teams/:id/matches` | Team match history |

#### Available Regions

| Code | Region |
|------|--------|
| `na` | North America |
| `eu` | Europe |
| `ap` | Asia Pacific |
| `br` | Brazil |
| `kr` | Korea |
| `jp` | Japan |
| `la` | Latin America |
| `la-n` | Latin America North |
| `la-s` | Latin America South |
| `oce` | Oceania |
| `mn` | MENA |
| `cn` | China |
| `gc` | Game Changers |

#### Team Profile Response
```json
{
  "id": "2",
  "name": "Sentinels",
  "tag": "SEN",
  "logo": "https://...",
  "country": "United States",
  "rank": 5,
  "rating": 1720,
  "earnings": 1200000,
  "record": { "wins": 38, "losses": 15 },
  "roster": {
    "players": [
      { "id": "9", "name": "TenZ", "realName": "Tyson Ngo", "role": null }
    ],
    "staff": [
      { "id": "1234", "name": "Kaplan", "role": "Head Coach" }
    ]
  }
}
```

---

### Events

| Endpoint | Description |
|----------|-------------|
| `GET /api/events?status=ongoing` | Events by status (ongoing/upcoming/completed) |
| `GET /api/events/search?q=name` | Search events |
| `GET /api/events/:id` | Event details with standings |

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

## Rate Limiting

- **Limit:** 60 requests per minute per IP
- **Response on exceed:** `{ "success": false, "error": "Too many requests", "code": 429 }`

---

## Project Structure

```
src/
├── index.ts              # Express app entry point
├── config/index.ts       # Configuration (ports, TTLs)
├── types/index.ts        # TypeScript interfaces
├── lib/
│   ├── scraper.ts        # Axios + Cheerio utilities
│   ├── cache.ts          # Redis/in-memory caching
│   └── roles.ts          # Role analysis algorithm
├── scrapers/
│   ├── matches.ts        # Match data scraping
│   ├── players.ts        # Player data scraping
│   ├── teams.ts          # Team data scraping
│   └── events.ts         # Event data scraping
└── routes/
    ├── index.ts          # Route aggregator
    ├── matches.ts        # /api/matches/*
    ├── players.ts        # /api/players/*
    ├── teams.ts          # /api/teams/*
    └── events.ts         # /api/events/*
```

---

## Key Types

### Agent Roles
```typescript
type AgentRole = 'duelist' | 'controller' | 'initiator' | 'sentinel';

// Duelists: Jett, Raze, Reyna, Phoenix, Neon, Iso, Yoru, Waylay
// Controllers: Omen, Astra, Brimstone, Viper, Harbor, Clove
// Initiators: Sova, Breach, Skye, KAY/O, Fade, Gekko, Tejo
// Sentinels: Killjoy, Cypher, Sage, Chamber, Deadlock, Vyse
```

### Match Status
```typescript
type MatchStatus = 'upcoming' | 'live' | 'completed';
```

---

## Example Usage

### cURL
```bash
# Get live matches
curl http://localhost:3000/api/matches/live

# Get match details
curl http://localhost:3000/api/matches/596413

# Get stats leaderboard (NA, last 60 days, min 100 rounds)
curl "http://localhost:3000/api/players/stats?region=na&timespan=60&min_rounds=100"

# Get team rankings for EU
curl http://localhost:3000/api/teams/rankings/eu

# Search for a player
curl "http://localhost:3000/api/players?q=tenz"

# Get player role analysis
curl http://localhost:3000/api/players/9/role
```

### JavaScript
```javascript
const API = 'http://localhost:3000/api';

// Get live matches then fetch details
const live = await fetch(`${API}/matches/live`).then(r => r.json());
if (live.data.length > 0) {
  const details = await fetch(`${API}/matches/${live.data[0].id}`).then(r => r.json());
  console.log(details.data.maps[0].team1Players);
}
```

### Python
```python
import requests

API = 'http://localhost:3000/api'

# Get stats leaderboard
stats = requests.get(f'{API}/players/stats', params={
    'region': 'na',
    'timespan': '60',
    'min_rounds': 100
}).json()

for player in stats['data'][:10]:
    print(f"{player['player']['name']}: {player['stats']['rating']} rating")
```

---

## Important Notes

1. **Clutch stats** are only available in `/api/players/stats` leaderboard, NOT in per-map match details
2. **Role analysis** uses rule-based algorithms (agent mapping + stat thresholds), NOT AI/ML
3. **Team tier filtering** requires the `tier` parameter (`t1` or `t2`)
4. **Data source:** All data is scraped from vlr.gg - accuracy depends on their website structure

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `REDIS_URL` | (none) | Redis connection URL for caching |

---

*This is an unofficial API. Not affiliated with vlr.gg.*
