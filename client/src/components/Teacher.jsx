import { useEffect, useMemo, useState } from 'react'
import io from 'socket.io-client'
import Results from './Results.jsx'
import PollHistory from './PollHistory.jsx'
import ChatWidget from './ChatWidget.jsx'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080'

export default function Teacher() {
  const [socket, setSocket] = useState(null)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [duration, setDuration] = useState(60)
  const [active, setActive] = useState(false)
  const [endsAt, setEndsAt] = useState(null)
  const [results, setResults] = useState({ options: [], total: 0 })
  const [students, setStudents] = useState([])
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])

  const timeLeft = useMemo(() => {
    if (!active || !endsAt) return 0
    return Math.max(0, Math.ceil((endsAt - Date.now())/1000))
  }, [active, endsAt])

  useEffect(() => {
    const s = io(SERVER_URL, { transports: ['websocket'] })
    setSocket(s)
    s.on('connect', () => {
      s.emit('register', { role: 'teacher' })
    })
    s.on('pollStarted', ({ options, endsAt }) => {
      setActive(true)
      setEndsAt(endsAt)
      setResults({ options, total: options.reduce((a,o)=>a+(o.count||0),0) })
    })
    s.on('voteUpdate', ({ options, total, endsAt, active }) => {
      setResults({ options, total })
      setEndsAt(endsAt)
      setActive(active)
    })
    s.on('pollEnded', (pollSnapshot) => {
      setActive(false)
      const opts = pollSnapshot.options || []
      setResults({ options: opts, total: opts.reduce((a,o)=>a+(o.count||0),0) })
      setEndsAt(null)
      setHistory(h => [pollSnapshot, ...h])
    })
    s.emit('listStudents', (res)=>{ if(res?.ok) setStudents(res.students) })
    s.on('students', (list)=> setStudents(list || []))
    s.on('pastPolls', (list) => {
      setHistory(list || [])
    })
    return () => s.disconnect()
  }, [])


  function removeStudent(id) {
    if (!socket) return;
    socket.emit('removeStudent', { studentId: id }, (ack)=>{
      // handle silently
    });
  }

  function updateOption(i, val) {
    setOptions(prev => {
      const copy = prev.slice()
      copy[i] = val
      return copy
    })
  }

  function addOption() {
    setOptions(o => o.concat(''))
  }

  function startPoll() {
    setError('')
    const payload = {
      question: question.trim(),
      options: options.map(o => o.trim()).filter(Boolean),
      durationSec: Number(duration) || 60
    }
    socket.emit('createPoll', payload, (ack) => {
      if (!ack?.ok) {
        setError(ack?.error || 'Failed to start poll.')
      } else {
        setQuestion('')
        setOptions(['',''])
      }
    })
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <div>
            <h2>Teacher</h2>
            <div className="footer">Create a poll and view live results</div>
          </div>
          <div className="row">
            <span className="badge">{active ? 'Active poll' : 'Idle'}</span>
            {active && <span className="badge">⏱ {timeLeft}s</span>}
          </div>
        </div>

        <div className="col">
          <div className="col">
            <label>Question</label>
            <textarea className="textarea" rows="2" placeholder="Type your question..." value={question} onChange={e=>setQuestion(e.target.value)} />
          </div>

          <div className="col">
            <label>Options</label>
            {options.map((opt, i) => (
              <div className="option-row" key={i}>
                <input className="input" placeholder={`Option ${i+1}`} value={opt} onChange={e=>updateOption(i, e.target.value)} />
              </div>
            ))}
            <div className="row">
              <button className="btn secondary" onClick={addOption}>+ Add option</button>
              <div style={{ flex: 1 }} />
              <div className="row" style={{ gap: 8 }}>
                <label>Time limit</label>
                <input className="input" style={{ maxWidth: 140 }} type="number" min="5" max="600" value={duration} onChange={e=>setDuration(e.target.value)} />
                <span className="badge">seconds</span>
              </div>
            </div>
            <button className="btn" onClick={startPoll} disabled={active}>Start Poll</button>
            {error && <div className="footer" style={{ color: 'crimson' }}><small>{error}</small></div>}
          </div>

          <hr/>

          <div className="panel">
            <div className="row" style={{justifyContent:'space-between'}}>
              <h3>Students</h3>
              <span className="badge">{students.length}</span>
            </div>
            <div className="student-list">
              {students.length === 0 && <div className="muted">No students connected yet.</div>}
              {students.map(s => (
                <div className="student-row" key={s.id}>
                  <div className="avatar">{s.name?.slice(0,1).toUpperCase()}</div>
                  <div className="name">{s.name}</div>
                  <button className="btn danger" onClick={()=>removeStudent(s.id)}>Remove</button>
                </div>
              ))}
            </div>
          </div>

          <hr/>

          <Results options={results.options} total={results.total} />

          <hr/>

          <div className="panel">
            <div className="row" style={{justifyContent:'space-between'}}>
              <h3>Students</h3>
              <span className="badge">{students.length}</span>
            </div>
            <div className="student-list">
              {students.length === 0 && <div className="muted">No students connected yet.</div>}
              {students.map(s => (
                <div className="student-row" key={s.id}>
                  <div className="avatar">{s.name?.slice(0,1).toUpperCase()}</div>
                  <div className="name">{s.name}</div>
                  <button className="btn danger" onClick={()=>removeStudent(s.id)}>Remove</button>
                </div>
              ))}
            </div>
          </div>

          <hr/>

          <PollHistory polls={history} />
        </div>
      </div>

      {/* Floating Chat */}
      <ChatWidget role="teacher" name="Teacher" />
    </div>
  )
}