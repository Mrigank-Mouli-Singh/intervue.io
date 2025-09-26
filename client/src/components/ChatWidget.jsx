import { useEffect, useRef, useState } from 'react'
import io from 'socket.io-client'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080'

export default function ChatWidget({ role, name }) {
  const [open, setOpen] = useState(false)
  const [socket, setSocket] = useState(null)
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const bodyRef = useRef(null)

  useEffect(() => {
    const s = io(SERVER_URL, { transports: ['websocket'] })
    setSocket(s)
    s.on('connect', () => {
      s.emit('register', { role: role || 'student', name })
      s.emit('requestChatHistory')
    })
    s.on('chatHistory', (list) => {
      setMsgs(list || [])
      scrollDown()
    })
    s.on('chatNew', (msg) => {
      setMsgs(prev => [...prev, msg])
      scrollDown()
    })
    return () => s.disconnect()
  }, [])

  function scrollDown() {
    setTimeout(() => {
      if (bodyRef.current) {
        bodyRef.current.scrollTop = bodyRef.current.scrollHeight
      }
    }, 10)
  }

  function send() {
    const t = text.trim()
    if (!t || !socket) return
    socket.emit('chatMessage', { text: t }, (ack) => {
      if (ack?.ok) setText('')
    })
  }

  return (
    <>
      <button className="chat-fab" title="Chat" onClick={()=>setOpen(o=>!o)}>💬</button>
      {open && (
        <div className="chat-panel">
          <div className="chat-header">Class Chat</div>
          <div className="chat-body" ref={bodyRef}>
            {msgs.map(m => (
              <div key={m.id} className="chat-msg">
                <div className="chat-meta">{m.name} • {m.role} • {new Date(m.ts).toLocaleTimeString()}</div>
                <div>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input className="input" placeholder="Type a message..." value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} />
            <button className="btn" onClick={send}>Send</button>
          </div>
        </div>
      )}
    </>
  )
}