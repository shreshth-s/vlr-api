# Agent Setup Guide

Hand this file to a coding agent and ask it to set up the project. It is written as an execution checklist, not prose documentation.

## Copy-Paste Agent Prompt

```text
Set up shreshth-s/vlr-api locally and tell me when the dashboard is ready.

Repository: https://github.com/shreshth-s/vlr-api
Default branch: master
Runtime: Node.js 20+ and npm

Goal:
- Install dependencies.
- Verify the project with lint and build.
- Start the API server.
- Start the dashboard server.
- Confirm the dashboard is reachable and the API returns live scraped data.
- Give me the dashboard URL and API URL when done.

Required commands:
1. git clone https://github.com/shreshth-s/vlr-api.git
2. cd vlr-api
3. npm install
4. npm run lint
5. npm run build
6. npm run dev
7. In a second terminal/session: npm run dashboard

Expected local URLs:
- API: http://localhost:3000
- API smoke test: http://localhost:3000/api/matches/upcoming
- Dashboard: http://127.0.0.1:8080/dashboard.html

Completion criteria:
- npm install completes.
- npm run lint exits 0.
- npm run build exits 0.
- npm run dev prints "Server running on http://localhost:3000".
- curl http://localhost:3000/api/matches/upcoming returns JSON with "success": true.
- npm run dashboard prints "Dashboard running at http://127.0.0.1:8080/dashboard.html".
- curl -I http://127.0.0.1:8080/dashboard.html returns 200.

Important:
- Redis is optional. If REDIS_URL is missing, the API uses in-memory cache. That is fine for local setup.
- Do not run npm audit fix unless explicitly asked; it can change dependency versions.
- If port 3000 is busy, use PORT=3001 npm run dev and update the API constant in dashboard.html.
- If port 8080 is busy, use DASHBOARD_PORT=8081 npm run dashboard.
- If a sandbox blocks localhost binding, network access, or the tsx watcher IPC socket, request permission/escalation and rerun the same command.
```

## Repository Facts

| Item | Value |
|------|-------|
| Repository | `https://github.com/shreshth-s/vlr-api` |
| Default branch | `master` |
| Package manager | `npm` |
| API framework | Express |
| API entry point | `src/index.ts` |
| Dashboard file | `dashboard.html` |
| Dashboard command | `npm run dashboard` |
| API dev command | `npm run dev` |
| API production commands | `npm run build`, then `npm start` |

## Exact Setup Flow

```bash
git clone https://github.com/shreshth-s/vlr-api.git
cd vlr-api
npm install
npm run lint
npm run build
```

Start the API:

```bash
npm run dev
```

Start the dashboard in a second terminal/session:

```bash
npm run dashboard
```

Verify from a third terminal/session:

```bash
curl http://localhost:3000/api/matches/upcoming
curl -I http://127.0.0.1:8080/dashboard.html
```

The dashboard is ready when the first command returns JSON with `"success":true` and the second returns `200`.

## What To Tell The User

When setup is complete, report these URLs:

```text
Dashboard: http://127.0.0.1:8080/dashboard.html
API: http://localhost:3000
```

Also mention any non-blocking warnings, such as npm audit output or Redis falling back to in-memory cache.

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | API server port |
| `REDIS_URL` | unset | Optional Redis cache backend |
| `DEBUG_MODE` | `true` outside production | Enables debug capture/endpoints |
| `ENABLE_DEBUG` | unset | Alias for enabling debug in production |
| `DASHBOARD_HOST` | `127.0.0.1` | Dashboard server host |
| `DASHBOARD_PORT` | `8080` | Dashboard server port |

Examples:

```bash
PORT=3001 npm run dev
DASHBOARD_PORT=8081 npm run dashboard
DEBUG_MODE=false npm run dev
```

## Troubleshooting Matrix

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `EADDRINUSE` on port 3000 | Another API/server is running | Run `PORT=3001 npm run dev` |
| `EADDRINUSE` on port 8080 | Another dashboard/static server is running | Run `DASHBOARD_PORT=8081 npm run dashboard` |
| `EPERM` from `tsx watch` | Sandbox blocked the watcher IPC socket | Request permission/escalation and rerun `npm run dev` |
| API returns scrape errors | Network blocked or vlr.gg unreachable | Verify outbound network access and retry |
| Dashboard loads but shows errors | API is not running, wrong port, or scrape failed | Check `curl http://localhost:3000/api/matches/upcoming` |
| Redis warning appears | `REDIS_URL` is not set | No action needed for local setup |
| npm audit warnings appear | Dependency audit found advisories | Report the warnings; do not auto-fix unless asked |

## Agent Guardrails

- Keep `npm run dev` and `npm run dashboard` running when handing off the dashboard URL.
- Do not make code changes during setup unless a documented command fails and the fix is obvious.
- Do not commit or push unless the user explicitly asks.
- Preserve local user changes. Check `git status --short` before editing or committing.
- Prefer reporting exact command output summaries over vague success/failure statements.
