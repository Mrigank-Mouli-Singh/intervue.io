import { useEffect, useMemo, useState } from 'react'
import io from 'socket.io-client'
import NameModal from './NameModal.jsx'
import Results from './Results.jsx'
import ChatWidget from './ChatWidget.jsx'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080'

function getTabName() {
  const key = 'poll_name'
  let name = sessionStorage.getItem(key)
  return name || null
}

export default function Student() {
  const [socket, setSocket] = useState(null)
  const [name, setName] = useState(getTabName())
  const [active, setActive] = useState(false)
  const [endsAt, setEndsAt] = useState(null)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState([])
  const [choice, setChoice] = useState(null)
  const [results, setResults] = useState({ options: [], total: 0 })
  const [submitted, setSubmitted] = useState(false)

  const timeLeft = useMemo(() => {
    if (!active || !endsAt) return 0
    return Math.max(0, Math.ceil((endsAt - Date.now())/1000))
  }, [active, endsAt])

  useEffect(() => {
    if (!name) return
    const s = io(SERVER_URL, { transports: ['websocket'] })
    setSocket(s)
    s.on('connect', () => {
      s.emit('register', { role: 'student', name })
    })
    s.on('pollStarted', ({ question, options, endsAt }) => {
      setQuestion(question)
      setOptions(options)
      setEndsAt(endsAt)
      setActive(true)
      setSubmitted(false)
      setChoice(null)
      setResults({ options, total: options.reduce((a,o)=>a+(o.count||0),0) })
    })
    s.on('voteUpdate', ({ options, total, endsAt, active }) => {
      setResults({ options, total })
      setEndsAt(endsAt)
      setActive(active)
    })
    s.on('pollEnded', ({ options }) => {
      setActive(false)
      const total = options.reduce((a,o)=>a+(o.count||0),0)
      setResults({ options, total })
    })
    return () => s.disconnect()
  }, [name])

  function onSaveName(n) {
    sessionStorage.setItem('poll_name', n)
    setName(n)
  }

  function submit() {
    if (choice === null) return
    socket.emit('submitAnswer', { optionIndex: choice }, (ack) => {
      if (ack?.ok) {
        setSubmitted(true)
      }
    })
  }

  if (!name) return <NameModal onSave={onSaveName} />

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <div>
            <h2>Student</h2>
            <div className="footer">Wait for the teacher to start a poll</div>
          </div>
          <div className="row">
            {active && <span className="badge">⏱ {timeLeft}s</span>}
            <span className="badge">{name}</span>
          </div>
        </div>

        {!active && (
          <div className="center">
            <p>Waiting for teacher to post a question…</p>
          </div>
        )}

        {active && !submitted && (
          <div>
            <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>{question}</h3>
            <div className="options">
              {options.map((opt, i) => (
                <label key={i} className="row">
                  <input type="radio" name="opt" checked={choice === i} onChange={()=>setChoice(i)} />
                  <span>{opt.text}</span>
                </label>
              ))}
            </div>
            <div style={{ height: 12 }} />
            <button className="btn" onClick={submit} disabled={choice === null}>Submit</button>
          </div>
        )}

        {(submitted || !active) && (
          <div>
            <Results options={results.options} total={results.total} />
          </div>
        )}
      </div>

      {/* Floating Chat */}
      <ChatWidget role="student" name={name} />
    </div>
  )
}