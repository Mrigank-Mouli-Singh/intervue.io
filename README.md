# Intervue Live Polling System

A full-stack implementation (mandatory requirements + optional configurable time limit) for the **Live Polling System** assignment.

## Tech
- Frontend: React (Vite) + socket.io-client
- Backend: Express.js + Socket.io

## Project Structure
```
intervue-live-poll/
  client/   # React app
  server/   # Express + Socket.io
```

## Running Locally (if you ever need it)
1) Server
```bash
cd server
cp .env.example .env
npm install
npm run dev
```
2) Client
```bash
cd client
npm install
echo "VITE_SERVER_URL=http://localhost:8080" > .env
npm run dev
```

## One-Click Hosting (No local machine)

### Backend (Render)
1. Push `/server` folder to a new GitHub repo (or a mono-repo).
2. Create a new **Web Service** on [Render], pick the repo, root = `server/`.
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. Add env:
   - `CORS_ORIGINS` = `*` (or your frontend URL)
6. Save the deployed URL (e.g., `https://your-api.onrender.com`).

### Frontend (Vercel / Netlify)
1. Create a new project from the same repo, root = `client/`.
2. Set env var:
   - `VITE_SERVER_URL` = your backend URL from Render
3. **Build Command:** `npm run build`
4. **Output dir:** `dist`

### Routes
- Teacher: `/teacher`
- Student: `/student`

## Notes vs. Requirements
- Student **name per tab**: stored in `sessionStorage`.
- Students can answer only **after a question is asked**.
- Results visible **after submission** (or when timer ends).
- **60s max** default; teacher can configure duration (good-to-have).
- Teacher can **only start a new question** if none has been asked yet **or** everyone answered the previous question **or** the timer ended.
- Both personas view **live** results (Socket.io).

> Bonus features like chat and persisted past results are not implemented (only ephemeral in-memory past snapshot is broadcast).

## Deployment

### Frontend (Netlify)
1. In Netlify, create a new site from your Git or upload the `client/` folder.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variable `VITE_SERVER_URL` with your Render server URL (e.g. `https://your-app.onrender.com`).

### Backend (Render)
1. Create a new **Web Service** and select the `server/` folder.
2. Build command: `npm install`
3. Start command: `npm start`
4. (Optional) Set `CORS_ORIGINS=*` or your Netlify site URL for strict CORS.

