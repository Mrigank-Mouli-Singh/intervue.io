# Intervue Live Poll — Server

Express + Socket.io server for the Live Polling System.

## Quick Start (Local)

```bash
cd server
cp .env.example .env
npm install
npm run dev
```
Default port: `8080`

## ENV

- `PORT` (default 8080)
- `CORS_ORIGINS` — comma-separated list or `*`

## API
- `GET /` — health check

## Socket Events

- `register` `{ role: "teacher" | "student", name?: string }`
- `createPoll` `{ question: string, options: string[], durationSec?: number }`
- `submitAnswer` `{ optionIndex: number }`
- `requestResults`

### Broadcasts
- `teacherRegistered`
- `studentRegistered`
- `pollStarted`
- `voteUpdate`
- `pollEnded`
- `pastPolls`