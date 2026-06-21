# VLR.gg API

Unofficial REST API and local dashboard for Valorant esports data scraped from [vlr.gg](https://www.vlr.gg).

## Quick Start

```bash
npm install
npm run dev
```

Open the API at:

```text
http://localhost:3000
```

In another terminal, serve the dashboard:

```bash
npm run dashboard
```

Then open:

```text
http://127.0.0.1:8080/dashboard.html
```

## For Coding Agents

Give [AGENT_SETUP.md](./AGENT_SETUP.md) to Codex, Claude, Hermes, or another coding agent. It includes the exact setup prompt, commands, verification checks, expected URLs, and troubleshooting steps.

Agents that automatically read repository instructions can also use [AGENTS.md](./AGENTS.md).

## Verification

```bash
npm run lint
npm run build
curl http://localhost:3000/api/matches/upcoming
```

## Full Docs

See [DOCUMENTATION.md](./DOCUMENTATION.md) for endpoint documentation, response formats, environment variables, caching behavior, and examples.
