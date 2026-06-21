# Agent Instructions

For local setup, follow [AGENT_SETUP.md](./AGENT_SETUP.md). It contains the exact setup prompt, commands, verification checks, expected URLs, and troubleshooting matrix.

## Setup Summary

- Install dependencies with `npm install`.
- Verify with `npm run lint` and `npm run build`.
- Start the API with `npm run dev`.
- Start the dashboard in a second terminal/session with `npm run dashboard`.
- Confirm `curl http://localhost:3000/api/matches/upcoming` returns JSON with `"success":true`.
- Confirm `curl -I http://127.0.0.1:8080/dashboard.html` returns `200`.
- Report `http://127.0.0.1:8080/dashboard.html` to the user when both servers are running.

## Guardrails

- Redis is optional; in-memory cache is expected locally when `REDIS_URL` is unset.
- Do not run `npm audit fix` unless explicitly asked.
- Do not commit or push unless explicitly asked.
- Check `git status --short` before editing.
- Preserve user changes and keep setup-related edits scoped.
