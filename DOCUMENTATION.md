# VLR.gg API Documentation

A comprehensive, unofficial REST API for Valorant esports data scraped from [vlr.gg](https://vlr.gg).

**Version:** 1.0.0
**Base URL:** `http://localhost:3000`
**License:** MIT

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Response Format](#response-format)
5. [Caching](#caching)
6. [API Endpoints](#api-endpoints)
   - [Matches](#matches)
   - [Players](#players)
   - [Teams](#teams)
   - [Events](#events)
7. [Data Types](#data-types)
8. [Error Handling](#error-handling)
9. [Code Examples](#code-examples)
10. [Environment Variables](#environment-variables)

---

## Getting Started

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd vlr-api

# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# OR build and start production server
npm run build
npm start
```

### Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web framework |
| `axios` | HTTP client for scraping |
| `cheerio` | HTML parsing |
| `redis` | Optional caching backend |
| `helmet` | Security headers |
| `cors` | Cross-origin support |
| `express-rate-limit` | Rate limiting |
| `zod` | Schema validation |

---

## Authentication

This API does not require authentication. All endpoints are publicly accessible.

---

## Rate Limiting

| Limit | Window |
|-------|--------|
| 60 requests | 1 minute |

**Rate Limit Response:**
```json
{
  "success": false,
  "error": "Too many requests, please try again later",
  "code": 429
}
```

---

## Response Format

### Success Response

All successful responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "cached": false,
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Always `true` for successful requests |
| `data` | `object \| array` | The requested data |
| `cached` | `boolean` | Whether the response was served from cache |
| `timestamp` | `string` | ISO 8601 timestamp of the response |

### Error Response

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "code": 500
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Always `false` for errors |
| `error` | `string` | Human-readable error message |
| `code` | `number` | HTTP status code |

---

## Caching

The API uses intelligent caching with different TTLs based on data volatility:

| Data Type | TTL | Description |
|-----------|-----|-------------|
| Live matches | 30 seconds | Frequently changing during matches |
| Upcoming matches | 5 minutes | Schedule updates occasionally |
| Completed matches | 1 hour | Results rarely change |
| Match details | 24 hours | Permanent after completion |
| Player profiles | 30 minutes | Updates with new matches |
| Team profiles | 30 minutes | Roster/info changes |
| Rankings | 1 hour | Updates periodically |
| Stats leaderboard | 30 minutes | Updates with new matches |

### Cache Backends

1. **Redis** (recommended for production): Set `REDIS_URL` environment variable
2. **In-memory** (default): Automatic fallback if Redis is unavailable

---

## API Endpoints

### Root Endpoint

#### `GET /`

Returns API information and available endpoints.

**Response:**
```json
{
  "name": "VLR.gg API",
  "version": "1.0.0",
  "description": "Comprehensive Valorant esports API",
  "endpoints": { ... },
  "filters": { ... },
  "disclaimer": "This is an unofficial API. Not affiliated with vlr.gg."
}
```

---

## Matches

### Get Live Matches

#### `GET /api/matches/live`

Retrieve all currently live matches.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "594743",
      "team1": {
        "name": "Sentinels",
        "score": 1,
        "countryCode": "us"
      },
      "team2": {
        "name": "100 Thieves",
        "score": 0,
        "countryCode": "us"
      },
      "status": "live",
      "event": "VCT 2026: Americas Kickoff",
      "stage": "Upper Round 1",
      "matchTime": "2:30 PM",
      "eventLogo": "https://owcdn.net/img/..."
    }
  ],
  "cached": false,
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

---

### Get Upcoming Matches

#### `GET /api/matches/upcoming`

Retrieve scheduled upcoming matches.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "606532",
      "team1": {
        "name": "NRG Academy",
        "countryCode": "us"
      },
      "team2": {
        "name": "M80",
        "countryCode": "us"
      },
      "status": "upcoming",
      "event": "Swiss Stage–Round 2",
      "stage": "Challengers 2026: North America",
      "matchTime": "4:00 PM",
      "eta": "34m",
      "eventLogo": "https://owcdn.net/img/..."
    }
  ],
  "cached": false,
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

---

### Get Match Results

#### `GET /api/matches/results`

Retrieve recently completed matches.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "594740",
      "team1": {
        "name": "Fnatic",
        "score": 2,
        "countryCode": "eu"
      },
      "team2": {
        "name": "Team Liquid",
        "score": 1,
        "countryCode": "eu"
      },
      "status": "completed",
      "event": "VCT 2026: EMEA Kickoff",
      "stage": "Upper Final",
      "matchTime": "Yesterday"
    }
  ],
  "cached": false,
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

---

### Get Match Details

#### `GET /api/matches/:id`

Retrieve detailed match information including player stats for each map.

**Parameters:**

| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Path | Match ID from vlr.gg |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "594740",
    "team1": {
      "id": "2593",
      "name": "Fnatic",
      "tag": "FNC",
      "logo": "https://owcdn.net/img/...",
      "score": 2,
      "country": "Europe",
      "countryCode": "eu"
    },
    "team2": {
      "id": "474",
      "name": "Team Liquid",
      "tag": "TL",
      "logo": "https://owcdn.net/img/...",
      "score": 1,
      "country": "Europe",
      "countryCode": "eu"
    },
    "status": "completed",
    "event": "VCT 2026: EMEA Kickoff",
    "eventId": "2684",
    "stage": "Upper Final",
    "format": "Bo3",
    "maps": [
      {
        "map": "Ascent",
        "team1Score": 13,
        "team2Score": 9,
        "team1Side": "attack",
        "team2Side": "defense",
        "picked": "team1",
        "team1Players": [
          {
            "agent": "Jett",
            "agentRole": "duelist",
            "rounds": 22,
            "rating": 1.45,
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
          }
        ],
        "team2Players": [
          {
            "agent": "Omen",
            "agentRole": "controller",
            "rounds": 22,
            "rating": 1.12,
            "acs": 215,
            "kills": 18,
            "deaths": 17,
            "assists": 6,
            "killDeathDiff": 1,
            "kast": 72,
            "adr": 145,
            "headshot": 22,
            "firstKills": 2,
            "firstDeaths": 3
          }
        ]
      }
    ],
    "streams": [
      {
        "name": "VCT Americas",
        "url": "https://twitch.tv/valorant",
        "language": "English"
      }
    ],
    "vods": []
  },
  "cached": false,
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

**Player Stats Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `agent` | `string` | Agent played |
| `agentRole` | `string` | Role: duelist, controller, initiator, sentinel |
| `rounds` | `number` | Total rounds played |
| `rating` | `number` | VLR rating |
| `acs` | `number` | Average Combat Score |
| `kills` | `number` | Total kills |
| `deaths` | `number` | Total deaths |
| `assists` | `number` | Total assists |
| `killDeathDiff` | `number` | Kill/Death differential |
| `kast` | `number` | KAST percentage |
| `adr` | `number` | Average Damage per Round |
| `headshot` | `number` | Headshot percentage |
| `firstKills` | `number` | First kills |
| `firstDeaths` | `number` | First deaths |

---

## Players

### Search Players

#### `GET /api/players`

Search for players by name.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | `string` | Yes | Search query (player name) |

**Example:** `GET /api/players?q=tenz`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "9",
      "name": "TenZ",
      "realName": "Tyson Ngo",
      "country": "Canada",
      "countryCode": "ca",
      "team": "Sentinels",
      "teamId": "2"
    }
  ],
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

---

### Get Stats Leaderboard

#### `GET /api/players/stats`

Retrieve player statistics leaderboard with optional filters.

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `event_id` | `string` | Filter by specific event ID | `2684` |
| `event_series` | `string` | Filter by event series | `VCT 2026` |
| `region` | `string` | Filter by region | `na`, `eu`, `ap` |
| `country` | `string` | Filter by country code | `us`, `kr`, `br` |
| `min_rounds` | `number` | Minimum rounds played | `100` |
| `min_rating` | `number` | Minimum rating | `1.0` |
| `agent` | `string` | Filter by agent name | `jett`, `omen` |
| `map` | `string` | Filter by map name | `ascent`, `haven` |
| `timespan` | `string` | Time period: `30`, `60`, `90`, `all` | `60` |

**Example:** `GET /api/players/stats?region=na&timespan=60&min_rounds=100`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "player": {
        "id": "5395",
        "name": "cortezia",
        "countryCode": "br"
      },
      "agents": ["viper", "omen", "killjoy"],
      "stats": {
        "rounds": 175,
        "rating": 1.3,
        "acs": 233,
        "kills": 0,
        "deaths": 0,
        "assists": 0,
        "killDeathDiff": 0,
        "kast": 72,
        "adr": 154.3,
        "headshot": 0.09,
        "firstKills": 0,
        "firstDeaths": 0,
        "kpr": 0.83,
        "apr": 0.27,
        "fkpr": 0.11,
        "fdpr": 0.09
      }
    }
  ],
  "cached": false,
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

**All Available Stats Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `rounds` | `number` | Total rounds played |
| `rating` | `number` | VLR 2.0 rating |
| `acs` | `number` | Average Combat Score |
| `kast` | `number` | Kill/Assist/Survive/Trade % |
| `adr` | `number` | Average Damage per Round |
| `headshot` | `number` | Headshot percentage |
| `kpr` | `number` | Kills per round |
| `apr` | `number` | Assists per round |
| `fkpr` | `number` | First kills per round |
| `fdpr` | `number` | First deaths per round |
| `clutchWins` | `number` | Total clutch rounds won |
| `clutchAttempts` | `number` | Total clutch situations |
| `clutchPercent` | `number` | Clutch win rate (0-100) |
| `totalKills` | `number` | Total kills |
| `totalDeaths` | `number` | Total deaths |
| `totalAssists` | `number` | Total assists |
| `totalFirstKills` | `number` | Total first kills |
| `totalFirstDeaths` | `number` | Total first deaths |
| `killsMax` | `number` | Max kills in a single map |
| `kills` | `number` | Same as totalKills |
| `deaths` | `number` | Same as totalDeaths |
| `assists` | `number` | Same as totalAssists |
| `killDeathDiff` | `number` | Kill/Death differential |

**Full Example Response:**
```json
{
  "player": { "id": "5395", "name": "cortezia", "countryCode": "br" },
  "agents": ["viper", "omen", "killjoy"],
  "stats": {
    "rounds": 175,
    "rating": 1.30,
    "acs": 233,
    "kills": 145,
    "deaths": 98,
    "assists": 47,
    "killDeathDiff": 47,
    "kast": 72,
    "adr": 154.3,
    "headshot": 39,
    "firstKills": 20,
    "firstDeaths": 16,
    "kpr": 0.83,
    "apr": 0.27,
    "fkpr": 0.11,
    "fdpr": 0.09,
    "clutchWins": 4,
    "clutchAttempts": 28,
    "clutchPercent": 14,
    "totalKills": 145,
    "totalDeaths": 98,
    "totalAssists": 47,
    "totalFirstKills": 20,
    "totalFirstDeaths": 16,
    "killsMax": 23
  }
}
```

---

### Get Player Profile

#### `GET /api/players/:id`

Retrieve detailed player profile.

**Parameters:**

| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Path | Player ID from vlr.gg |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "9",
    "name": "TenZ",
    "realName": "Tyson Ngo",
    "country": "Canada",
    "countryCode": "ca",
    "team": "Sentinels",
    "teamId": "2",
    "image": "https://owcdn.net/img/...",
    "twitter": "TenZOfficial",
    "earnings": 250000,
    "teamHistory": [
      {
        "teamId": "2",
        "teamName": "Sentinels",
        "logo": "https://owcdn.net/img/...",
        "joinDate": "Apr 2021",
        "leaveDate": null
      },
      {
        "teamId": "188",
        "teamName": "Cloud9",
        "logo": "https://owcdn.net/img/...",
        "joinDate": "Jan 2020",
        "leaveDate": "Apr 2021"
      }
    ],
    "pastEvents": [
      {
        "eventId": "1234",
        "eventName": "VCT 2025: Masters Tokyo",
        "placement": "1st",
        "prize": 100000,
        "date": "Jun 2025"
      }
    ]
  },
  "cached": false,
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

---

### Get Player Match History

#### `GET /api/players/:id/matches`

Retrieve player's recent match history.

**Parameters:**

| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Path | Player ID |
| `page` | `number` | Query | Page number (default: 1) |

**Example:** `GET /api/players/9/matches?page=1`

**Response:**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "matchId": "594740",
        "event": "VCT 2026: Americas Kickoff",
        "teams": "Sentinels vs 100 Thieves",
        "result": "W 2-1",
        "date": "Jan 21, 2026"
      }
    ],
    "hasMore": true
  },
  "cached": false,
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

---

### Get Player Agent Stats

#### `GET /api/players/:id/agents`

Retrieve player's agent pool and statistics.

**Parameters:**

| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Path | Player ID |
| `timespan` | `string` | Query | `30`, `60`, `90`, `all` (default: `all`) |

**Example:** `GET /api/players/9/agents?timespan=60`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "agent": "Jett",
      "role": "duelist",
      "rounds": 450,
      "rating": 1.35,
      "acs": 275,
      "kd": 1.42,
      "adr": 168,
      "kast": 74,
      "picks": 25
    },
    {
      "agent": "Raze",
      "role": "duelist",
      "rounds": 120,
      "rating": 1.28,
      "acs": 260,
      "kd": 1.35,
      "adr": 162,
      "kast": 72,
      "picks": 8
    }
  ],
  "cached": false,
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

---

### Get Player Role Analysis

#### `GET /api/players/:id/role`

Algorithmic role analysis based on agent picks and playstyle patterns.

**Parameters:**

| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Path | Player ID |
| `limit` | `number` | Query | Number of matches to analyze (default: 20, max: 50) |

**Example:** `GET /api/players/9/role?limit=30`

**Response:**
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
    "roleBreakdown": [
      {
        "role": "duelist",
        "agents": [
          { "agent": "jett", "rounds": 320, "percentage": 56 },
          { "agent": "raze", "rounds": 92, "percentage": 16 }
        ],
        "rounds": 412,
        "percentage": 72
      },
      {
        "role": "initiator",
        "agents": [
          { "agent": "sova", "rounds": 103, "percentage": 18 }
        ],
        "rounds": 103,
        "percentage": 18
      }
    ],
    "playstyle": {
      "isEntry": true,
      "isAnchor": false,
      "isPlaymaker": false,
      "isFlexible": false,
      "classification": "Entry Fragger"
    }
  },
  "cached": false,
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

**Playstyle Classifications:**

| Classification | Description |
|----------------|-------------|
| Entry Fragger | High FK/FD ratio, plays duelist |
| Star Duelist | Duelist main without entry focus |
| Smoke Player | Controller specialist |
| Playmaker | Initiator with high assists |
| Info Gatherer | Initiator without playmaker stats |
| Anchor | High KAST, avoids first fights |
| Site Holder | Sentinel without anchor stats |
| Flex Entry | Plays both duelist and initiator |
| Flex Support | Plays both controller and sentinel |
| Flex Player | Plays multiple roles |
| Standard | No dominant pattern |

---

## Teams

### Search Teams

#### `GET /api/teams`

Search for teams by name.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | `string` | Yes | Search query (team name) |

**Example:** `GET /api/teams?q=sentinels`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "2",
      "name": "Sentinels",
      "tag": "SEN",
      "logo": "https://owcdn.net/img/...",
      "country": "United States",
      "countryCode": "us"
    }
  ],
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

---

### Get Team Rankings (Global)

#### `GET /api/teams/rankings`

Retrieve global team rankings.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "2593",
      "name": "Fnatic",
      "tag": "FNC",
      "logo": "https://owcdn.net/img/...",
      "country": "Europe",
      "countryCode": "eu",
      "rank": 1,
      "rating": 1850,
      "earnings": 1500000,
      "record": {
        "wins": 45,
        "losses": 12
      }
    }
  ],
  "cached": false,
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

---

### Get Team Rankings (Regional)

#### `GET /api/teams/rankings/:region`

Retrieve team rankings for a specific region.

**Parameters:**

| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `region` | `string` | Path | Region code (see Available Regions) |

**Example:** `GET /api/teams/rankings/na`

**Response:** Same format as global rankings, filtered by region.

---

### Get Available Regions

#### `GET /api/teams/regions`

Retrieve list of available regions.

**Response:**
```json
{
  "success": true,
  "data": {
    "regions": ["na", "eu", "ap", "la", "la-s", "la-n", "oce", "kr", "mn", "gc", "br", "cn", "jp"],
    "descriptions": {
      "na": "North America",
      "eu": "Europe",
      "ap": "Asia Pacific",
      "la": "Latin America",
      "la-s": "Latin America South",
      "la-n": "Latin America North",
      "oce": "Oceania",
      "kr": "Korea",
      "mn": "MENA",
      "gc": "Game Changers",
      "br": "Brazil",
      "cn": "China",
      "jp": "Japan"
    }
  },
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

---

### Get Team Profile

#### `GET /api/teams/:id`

Retrieve detailed team profile with roster.

**Parameters:**

| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Path | Team ID from vlr.gg |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "2",
    "name": "Sentinels",
    "tag": "SEN",
    "logo": "https://owcdn.net/img/...",
    "country": "United States",
    "countryCode": "us",
    "rank": 5,
    "rating": 1720,
    "earnings": 1200000,
    "record": {
      "wins": 38,
      "losses": 15
    },
    "roster": {
      "players": [
        {
          "id": "9",
          "name": "TenZ",
          "realName": "Tyson Ngo",
          "country": "Canada",
          "countryCode": "ca",
          "role": null
        },
        {
          "id": "72",
          "name": "Zellsis",
          "realName": "Jordan Montemurro",
          "country": "United States",
          "countryCode": "us",
          "role": "IGL"
        }
      ],
      "staff": [
        {
          "id": "1234",
          "name": "Kaplan",
          "realName": "John Kaplan",
          "country": "United States",
          "countryCode": "us",
          "role": "Head Coach"
        }
      ]
    },
    "website": "https://sentinels.gg",
    "twitter": "Sentinels",
    "recentMatches": [
      {
        "id": "594740",
        "team1": { "name": "Sentinels", "score": 2 },
        "team2": { "name": "100 Thieves", "score": 1 },
        "status": "completed",
        "event": "VCT 2026: Americas Kickoff"
      }
    ],
    "upcomingMatches": []
  },
  "cached": false,
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

---

### Get Team Match History

#### `GET /api/teams/:id/matches`

Retrieve team's match history.

**Parameters:**

| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Path | Team ID |
| `type` | `string` | Query | `upcoming` or `completed` (default: `completed`) |
| `page` | `number` | Query | Page number (default: 1) |

**Example:** `GET /api/teams/2/matches?type=completed&page=1`

**Response:**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "594740",
        "team1": { "name": "Sentinels", "score": 2 },
        "team2": { "name": "100 Thieves", "score": 1 },
        "status": "completed",
        "event": "VCT 2026: Americas Kickoff",
        "stage": "Upper Round 1",
        "matchTime": "Jan 21, 2026"
      }
    ],
    "hasMore": true
  },
  "cached": false,
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

---

## Events

### Get Events

#### `GET /api/events`

Retrieve events list filtered by status.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | `string` | `ongoing` | `ongoing`, `upcoming`, or `completed` |

**Example:** `GET /api/events?status=ongoing`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "2684",
      "name": "VCT 2026: EMEA Kickoff",
      "status": "ongoing",
      "logo": "https://owcdn.net/img/...",
      "dates": "Jan 20—Feb 15",
      "prizePool": "$200,000",
      "location": "Berlin, Germany",
      "region": "EMEA"
    }
  ],
  "cached": false,
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

---

### Search Events

#### `GET /api/events/search`

Search for events by name.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | `string` | Yes | Search query (event name) |

**Example:** `GET /api/events/search?q=vct`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "2684",
      "name": "VCT 2026: EMEA Kickoff",
      "status": "ongoing",
      "dates": "Jan 20—Feb 15"
    }
  ],
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

---

### Get Event Details

#### `GET /api/events/:id`

Retrieve detailed event information.

**Parameters:**

| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Path | Event ID from vlr.gg |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "2684",
    "name": "VCT 2026: EMEA Kickoff",
    "status": "ongoing",
    "logo": "https://owcdn.net/img/...",
    "dates": "Jan 20—Feb 15",
    "prizePool": "$200,000",
    "location": "Berlin, Germany",
    "region": "EMEA",
    "teams": [
      {
        "id": "2593",
        "name": "Fnatic",
        "logo": "https://owcdn.net/img/..."
      }
    ],
    "matches": [
      {
        "id": "594740",
        "team1": { "name": "Fnatic", "score": 2 },
        "team2": { "name": "Team Liquid", "score": 1 },
        "status": "completed"
      }
    ],
    "standings": [
      {
        "position": 1,
        "team": {
          "id": "2593",
          "name": "Fnatic"
        },
        "wins": 3,
        "losses": 0,
        "roundDiff": 15
      }
    ]
  },
  "cached": false,
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

---

## Data Types

### Agent Roles

| Role | Agents |
|------|--------|
| `duelist` | Jett, Raze, Reyna, Phoenix, Neon, Iso, Yoru, Waylay |
| `controller` | Omen, Astra, Brimstone, Viper, Harbor, Clove |
| `initiator` | Sova, Breach, Skye, KAY/O, Fade, Gekko, Tejo |
| `sentinel` | Killjoy, Cypher, Sage, Chamber, Deadlock, Vyse |

### Match Status

| Status | Description |
|--------|-------------|
| `upcoming` | Match scheduled but not started |
| `live` | Match currently in progress |
| `completed` | Match finished |

### Event Status

| Status | Description |
|--------|-------------|
| `upcoming` | Event not yet started |
| `ongoing` | Event currently running |
| `completed` | Event finished |

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Bad Request (missing/invalid parameters) |
| `404` | Not Found (endpoint doesn't exist) |
| `429` | Too Many Requests (rate limit exceeded) |
| `500` | Internal Server Error |

### Common Errors

**Missing required parameter:**
```json
{
  "success": false,
  "error": "Query parameter \"q\" is required",
  "code": 400
}
```

**Invalid region:**
```json
{
  "success": false,
  "error": "Invalid region. Valid regions: na, eu, ap, la, la-s, la-n, oce, kr, mn, gc, br, cn, jp",
  "code": 400
}
```

**Invalid event status:**
```json
{
  "success": false,
  "error": "Invalid status. Valid values: ongoing, upcoming, completed",
  "code": 400
}
```

---

## Code Examples

### JavaScript/TypeScript (fetch)

```javascript
const API_BASE = 'http://localhost:3000/api';

// Get live matches
async function getLiveMatches() {
  const response = await fetch(`${API_BASE}/matches/live`);
  const data = await response.json();

  if (data.success) {
    data.data.forEach(match => {
      console.log(`${match.team1.name} vs ${match.team2.name}`);
    });
  }
}

// Get match details with player stats
async function getMatchDetails(matchId) {
  const response = await fetch(`${API_BASE}/matches/${matchId}`);
  const data = await response.json();

  if (data.success) {
    const match = data.data;
    console.log(`${match.team1.name} ${match.team1.score} - ${match.team2.score} ${match.team2.name}`);

    match.maps.forEach(map => {
      console.log(`\n${map.map}: ${map.team1Score}-${map.team2Score}`);
      map.team1Players.forEach(p => {
        console.log(`  ${p.agent}: ${p.kills}/${p.deaths}/${p.assists} (${p.acs} ACS)`);
      });
    });
  }
}

// Get stats leaderboard with filters
async function getTopPlayers(region, timespan) {
  const params = new URLSearchParams({
    region,
    timespan,
    min_rounds: '100'
  });

  const response = await fetch(`${API_BASE}/players/stats?${params}`);
  const data = await response.json();

  if (data.success) {
    data.data.slice(0, 10).forEach((entry, i) => {
      console.log(`${i + 1}. ${entry.player.name} - ${entry.stats.rating} rating`);
    });
  }
}

// Search and get player profile
async function getPlayerInfo(name) {
  // Search for player
  const searchResponse = await fetch(`${API_BASE}/players?q=${encodeURIComponent(name)}`);
  const searchData = await searchResponse.json();

  if (searchData.success && searchData.data.length > 0) {
    const playerId = searchData.data[0].id;

    // Get full profile
    const profileResponse = await fetch(`${API_BASE}/players/${playerId}`);
    const profileData = await profileResponse.json();

    if (profileData.success) {
      const player = profileData.data;
      console.log(`${player.name} (${player.realName})`);
      console.log(`Team: ${player.team}`);
      console.log(`Earnings: $${player.earnings}`);
    }
  }
}
```

### Python (requests)

```python
import requests

API_BASE = 'http://localhost:3000/api'

def get_live_matches():
    """Get all currently live matches"""
    response = requests.get(f'{API_BASE}/matches/live')
    data = response.json()

    if data['success']:
        for match in data['data']:
            print(f"{match['team1']['name']} vs {match['team2']['name']}")
    return data

def get_match_details(match_id):
    """Get detailed match info with player stats"""
    response = requests.get(f'{API_BASE}/matches/{match_id}')
    data = response.json()

    if data['success']:
        match = data['data']
        print(f"{match['team1']['name']} {match['team1']['score']} - {match['team2']['score']} {match['team2']['name']}")

        for map_data in match['maps']:
            print(f"\n{map_data['map']}: {map_data['team1Score']}-{map_data['team2Score']}")
            for player in map_data['team1Players']:
                print(f"  {player['agent']}: {player['kills']}/{player['deaths']}/{player['assists']} ({player['acs']} ACS)")

    return data

def get_stats_leaderboard(region='na', timespan='60', min_rounds=100):
    """Get player stats leaderboard with filters"""
    response = requests.get(f'{API_BASE}/players/stats', params={
        'region': region,
        'timespan': timespan,
        'min_rounds': min_rounds
    })
    data = response.json()

    if data['success']:
        for i, entry in enumerate(data['data'][:10], 1):
            print(f"{i}. {entry['player']['name']} - {entry['stats']['rating']} rating")

    return data

def get_team_rankings(region='na'):
    """Get team rankings for a region"""
    response = requests.get(f'{API_BASE}/teams/rankings/{region}')
    data = response.json()

    if data['success']:
        for team in data['data'][:10]:
            print(f"#{team['rank']} {team['name']} ({team['rating']} rating)")

    return data

def get_player_role(player_id):
    """Get AI-analyzed player role"""
    response = requests.get(f'{API_BASE}/players/{player_id}/role')
    data = response.json()

    if data['success']:
        role = data['data']
        print(f"Primary Role: {role['primaryRole']}")
        print(f"Classification: {role['playstyle']['classification']}")
        print(f"Role Distribution: {role['roleDistribution']}")

    return data

def get_ongoing_events():
    """Get all ongoing events"""
    response = requests.get(f'{API_BASE}/events', params={'status': 'ongoing'})
    data = response.json()

    if data['success']:
        for event in data['data']:
            print(f"{event['name']} ({event['dates']})")

    return data

# Example usage
if __name__ == '__main__':
    print("=== Live Matches ===")
    get_live_matches()

    print("\n=== NA Stats Leaderboard ===")
    get_stats_leaderboard('na', '60', 100)

    print("\n=== Ongoing Events ===")
    get_ongoing_events()
```

### cURL

```bash
# Get live matches
curl http://localhost:3000/api/matches/live

# Get match details
curl http://localhost:3000/api/matches/594743

# Search players
curl "http://localhost:3000/api/players?q=tenz"

# Get stats leaderboard with filters
curl "http://localhost:3000/api/players/stats?region=na&timespan=60&min_rounds=100"

# Get player role analysis
curl http://localhost:3000/api/players/9/role

# Get team rankings
curl http://localhost:3000/api/teams/rankings/eu

# Get events
curl "http://localhost:3000/api/events?status=ongoing"

# Search events
curl "http://localhost:3000/api/events/search?q=vct"
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `REDIS_URL` | (none) | Redis connection URL for caching |

**Example `.env` file:**
```env
PORT=3000
REDIS_URL=redis://localhost:6379
```

---

## Project Structure

```
vlr-api/
├── src/
│   ├── config/
│   │   └── index.ts         # Configuration (ports, TTLs, etc.)
│   ├── lib/
│   │   ├── scraper.ts       # Axios + Cheerio scraping utilities
│   │   ├── cache.ts         # Redis/in-memory caching layer
│   │   └── roles.ts         # AI role inference system
│   ├── scrapers/
│   │   ├── matches.ts       # Match data scraping
│   │   ├── players.ts       # Player data scraping
│   │   ├── teams.ts         # Team data scraping
│   │   └── events.ts        # Event data scraping
│   ├── routes/
│   │   ├── index.ts         # Route aggregator
│   │   ├── matches.ts       # /api/matches endpoints
│   │   ├── players.ts       # /api/players endpoints
│   │   ├── teams.ts         # /api/teams endpoints
│   │   └── events.ts        # /api/events endpoints
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   └── index.ts             # Express app entry point
├── package.json
├── tsconfig.json
├── DOCUMENTATION.md         # This file
└── README.md                # Quick start guide
```

---

## Data Sources & How It Works

### What's Scraped vs Calculated

| Data | Source | Notes |
|------|--------|-------|
| Matches (live/upcoming/results) | Scraped from VLR.gg | Direct scrape of match listings |
| Match details & player stats | Scraped from VLR.gg | Per-map stats (no clutch data per-map) |
| Stats leaderboard | Scraped from VLR.gg | Full stats including clutch, totals, KMax |
| Player profiles | Scraped from VLR.gg | Team history, earnings, etc. |
| Team rankings | Scraped from VLR.gg | VLR's ranking algorithm |
| Events | Scraped from VLR.gg | Direct scrape |
| **Role analysis** | **Calculated locally** | Rule-based algorithm (see below) |

> **Stats Leaderboard:** The `/players/stats` endpoint provides all 20+ stats from VLR including rating, ACS, KAST, ADR, clutch stats, totals (K/D/A/FK/FD), and KMax (max kills in a map). Individual match details provide per-map breakdowns but don't include clutch or total stats.

### Radar Chart Stats Reference

For building player comparison radar charts, here are the recommended stats:

| Radar Axis | Field | Description |
|------------|-------|-------------|
| Combat Score | `acs` | Average Combat Score |
| Damage | `adr` | Average Damage per Round |
| Survivability | `kast` | Kill/Assist/Survive/Trade % |
| Clutch | `clutchPercent` | Clutch win percentage |
| First Bloods | `fkpr` | First kills per round |
| Accuracy | `headshot` | Headshot percentage |
| Overall | `rating` | VLR 2.0 rating |

All stats can be filtered by tournament (`event_id`), region, agent, map, and timespan.

### Role Analysis - How It Works

The `/players/:id/role` endpoint uses **rule-based algorithmic analysis**, not machine learning or AI APIs.

**Step 1: Map agents to roles**
```
Jett, Raze, Reyna → Duelist
Omen, Astra, Viper → Controller
Sova, Breach, Fade → Initiator
Killjoy, Cypher, Sage → Sentinel
```

**Step 2: Analyze match history**
- Count rounds played on each agent
- Calculate role distribution percentages
- Example: 200 rounds on Jett + 50 on Raze = 72% duelist

**Step 3: Determine playstyle using stats**
```
Entry Fragger = First Kills / First Deaths > 1.2
Anchor = KAST > 70% AND low first deaths
Playmaker = High assists + plays initiator
Flex = Plays 2+ roles significantly (>20% each)
```

**Step 4: Generate classification**
- "Entry Fragger" - Duelist who takes first fights
- "Smoke Player" - Controller main
- "Flex Support" - Plays controller + sentinel
- etc.

This is deterministic logic, not AI/ML. Same input always produces same output.

---

## Disclaimer

This is an **unofficial API** and is not affiliated with or endorsed by vlr.gg.

- Use responsibly and respect vlr.gg's servers
- Do not use for commercial purposes without permission
- Data accuracy depends on vlr.gg's website structure

---

## License

MIT License - see LICENSE file for details.
