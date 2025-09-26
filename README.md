# 📊 Intervue Live Polling System

A real-time polling system built with **React + Vite (frontend)** and **Express.js + Socket.io (backend)**.  
It supports **Teacher** and **Student** roles with live results, timers, chat, and student management.

---

## 🌐 Live Demo

- **Frontend (Netlify):** [Live App](https://mypollapp.netlify.app/)  
- **Backend (Render):** [API Server](https://pollapp-zym2.onrender.com/)

---


## ✨ Features

### 👨‍🏫 Teacher
- Create polls with a configurable time limit (default 60s).
- Start a new question only if all students have answered or no active poll exists.
- View live results in real-time.
- See a list of connected students.
- **Remove students** if needed.
- View past poll history.
- Chat with students via popup.

### 👩‍🎓 Student
- Enter a unique name (per tab).
- Receive questions live from the teacher.
- Submit answers (limited to one per poll).
- See live poll results after submission or after time expires.
- Participate in real-time chat with teacher and peers.

### 🌟 Bonus
- Floating chat widget (teacher ↔ student).
- Poll history stored server-side (not just locally).
- Responsive, clean UI inspired by the given Figma designs.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, React Router, Socket.io-client
- **Backend:** Node.js, Express.js, Socket.io
- **Deployment:**  
  - Frontend → Netlify  
  - Backend → Render

---

## 🚀 Local Development

If you want to run the app locally:

### 1. Clone repo
```bash
git clone https://github.com/yourusername/intervue-live-poll.git
cd intervue-live-poll
```

2. Start Backend
```bash
cd server
npm install
npm start
```
Runs on http://localhost:8080

3. Start Frontend
```bash
cd ../client
npm install
```
Create a .env file inside /client:

```ini
VITE_SERVER_URL=http://localhost:8080
```
Then run:

```bash
npm run dev
```
Frontend runs on http://localhost:5173


## 📂 Project Structure
```pgsql
intervue-live-poll/
├── client/        # React frontend (Netlify)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── server/        # Express + Socket.io backend (Render)
│   ├── index.js
│   └── package.json
└── README.md
```

## 👤 Author
Mrigank Mouli Singh
Portfolio

