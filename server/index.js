import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['*'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Intervue Live Poll Server is running' });
});

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.includes('*') ? true : allowedOrigins,
    methods: ['GET','POST']
  }
});

// ---- In-memory state ----
let students = new Map(); // socketId -> { name }
let teacherSockets = new Set(); // socketIds
let currentPoll = null; // { id, question, options:[{text,count}], startedAt, endsAt, active }
let responses = new Map(); // socketId -> optionIndex
let answeredStudents = new Set(); // socketIds
let pollTimer = null;
let pastPolls = []; // store last 50 polls

// Chat history (global): store last 100 messages: { id, name, role, text, ts }
let chatMessages = [];

function pushChatMessage(msg) {
  chatMessages.push(msg);
  if (chatMessages.length > 100) chatMessages = chatMessages.slice(-100);
}

function allActiveStudentsCount() {
  return students.size;
}

function broadcastResults() {
  if (!currentPoll) return;
  const total = currentPoll.options.reduce((a, o) => a + (o.count || 0), 0);
  io.emit('voteUpdate', {
    options: currentPoll.options,
    total,
    endsAt: currentPoll.endsAt,
    active: !!currentPoll.active
  });
}

function endPoll(reason = 'timeout') {
  if (!currentPoll) return;
  currentPoll.active = false;
  clearTimeout(pollTimer);
  pollTimer = null;

  const snapshot = {
    ...currentPoll,
    totalResponses: currentPoll.options.reduce((a,o)=>a+(o.count||0),0),
    endedAt: Date.now(),
    reason
  };
  pastPolls.unshift(snapshot);
  if (pastPolls.length > 50) pastPolls.pop();

  io.emit('pollEnded', snapshot);
}

function mayStartNewPoll() {
  if (!currentPoll) return true;
  const totalStudents = allActiveStudentsCount();
  const everyoneAnswered = totalStudents > 0 && answeredStudents.size >= totalStudents;
  return (!currentPoll.active) || everyoneAnswered;
}

io.on('connection', (socket) => {
  let role = 'student';
  let displayName = '';

  socket.on('register', ({ role: r, name }) => {
    role = (r === 'teacher') ? 'teacher' : 'student';
    if (role === 'teacher') {
      teacherSockets.add(socket.id);
      displayName = 'Teacher';
      socket.emit('teacherRegistered', { ok: true });
    } else {
      displayName = (name && String(name).trim()) || `Student_${socket.id.slice(0,5)}`;
      students.set(socket.id, { name: displayName });
      socket.emit('studentRegistered', { ok: true, name: displayName });
    }

    // Send current poll state (if any)
    if (currentPoll) {
      const payload = {
        question: currentPoll.question,
        options: currentPoll.options,
        endsAt: currentPoll.endsAt,
        active: currentPoll.active
      };
      if (currentPoll.active) {
        socket.emit('pollStarted', payload);
      } else {
        socket.emit('pollEnded', { ...payload, active: false });
      }
    }

    // Send past polls and chat history
    socket.emit('pastPolls', pastPolls.slice(0, 20));
    socket.emit('chatHistory', chatMessages);
  });

  socket.on('createPoll', ({ question, options, durationSec = 60 }, ack = ()=>{}) => {
    try {
      if (!teacherSockets.has(socket.id)) {
        ack({ ok: false, error: 'Only a teacher can create a poll.' });
        return;
      }
      if (!mayStartNewPoll()) {
        ack({ ok: false, error: 'Cannot start a new poll until the current one is completed by all students or has ended.' });
        return;
      }
      const cleanedOptions = (options || [])
        .map(t => String(t || '').trim())
        .filter(Boolean)
        .slice(0, 8);

      if (!question || !cleanedOptions.length) {
        ack({ ok: false, error: 'Provide a question and at least one option.' });
        return;
      }

      responses.clear();
      answeredStudents.clear();
      if (pollTimer) clearTimeout(pollTimer);

      const dur = Math.max(5, Math.min(600, Number(durationSec)));
      currentPoll = {
        id: 'poll_' + Date.now(),
        question: String(question).trim(),
        options: cleanedOptions.map(text => ({ text, count: 0 })),
        startedAt: Date.now(),
        endsAt: Date.now() + dur * 1000,
        active: true
      };
      pollTimer = setTimeout(() => endPoll('timeout'), currentPoll.endsAt - Date.now());

      io.emit('pollStarted', {
        question: currentPoll.question,
        options: currentPoll.options,
        endsAt: currentPoll.endsAt,
        active: true
      });
      ack({ ok: true });
    } catch (e) {
      ack({ ok: false, error: e.message || 'Unknown error' });
    }
  });

  socket.on('submitAnswer', ({ optionIndex }, ack = ()=>{}) => {
    try {
      if (!students.has(socket.id)) {
        ack({ ok: false, error: 'Register as a student first.' });
        return;
      }
      if (!currentPoll || !currentPoll.active) {
        ack({ ok: false, error: 'No active poll to answer.' });
        return;
      }
      const idx = Number(optionIndex);
      if (Number.isNaN(idx) || idx < 0 || idx >= currentPoll.options.length) {
        ack({ ok: false, error: 'Invalid option index.' });
        return;
      }
      if (responses.has(socket.id)) {
        ack({ ok: false, error: 'You have already answered.' });
        return;
      }
      responses.set(socket.id, idx);
      answeredStudents.add(socket.id);
      currentPoll.options[idx].count += 1;
      broadcastResults();

      const totalStudents = allActiveStudentsCount();
      if (totalStudents > 0 && answeredStudents.size >= totalStudents) {
        endPoll('all_answered');
      }
      ack({ ok: true });
    } catch (e) {
      ack({ ok: false, error: e.message || 'Unknown error' });
    }
  });

  // --- Chat events ---
  socket.on('chatMessage', ({ text }, ack = ()=>{}) => {
    try {
      const t = String(text || '').trim();
      if (!t) {
        ack({ ok: false, error: 'Empty message' });
        return;
      }
      const msg = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
        name: displayName || 'Anon',
        role,
        text: t,
        ts: Date.now()
      };
      pushChatMessage(msg);
      io.emit('chatNew', msg);
      ack({ ok: true });
    } catch (e) {
      ack({ ok: false, error: e.message || 'Unknown error' });
    }
  });

  socket.on('requestChatHistory', () => {
    socket.emit('chatHistory', chatMessages);
  });


  // Teacher: request current student list
  socket.on('listStudents', (ack = ()=>{}) => {
    try {
      const list = Array.from(students.entries()).map(([id, s]) => ({ id, name: s.name }));
      if (typeof ack === 'function') ack({ ok: true, students: list });
      if (role === 'teacher') socket.emit('students', list);
    } catch (e) {
      if (typeof ack === 'function') ack({ ok: false, error: e.message });
    }
  });

  // Teacher: remove a student by socket id
  socket.on('removeStudent', ({ studentId }, ack = ()=>{}) => {
    try {
      if (role !== 'teacher') throw new Error('Only teacher can remove students');
      const sock = io.sockets.sockets.get(studentId);
      if (sock) {
        sock.disconnect(true);
        students.delete(studentId);
        answeredStudents.delete(studentId);
        io.emit('students', Array.from(students.entries()).map(([id, s]) => ({ id, name: s.name })));
      }
      ack({ ok: true });
    } catch (e) {
      ack({ ok: false, error: e.message });
    }
  });

  socket.on('disconnect', () => {
    teacherSockets.delete(socket.id);
    students.delete(socket.id);
    answeredStudents.delete(socket.id);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Live Poll Server listening on :${PORT}`);
});