import { useEffect, useState } from 'react'

export default function NameModal({ onSave }) {
  const [name, setName] = useState('')

  function save() {
    const n = name.trim()
    if (!n) return;
    onSave(n)
  }

  return (
    <div className="card" style={{ maxWidth: 480, margin: '80px auto' }}>
      <h3>Enter your name</h3>
      <input className="input" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} />
      <div style={{ height: 12 }} />
      <button className="btn" onClick={save}>Continue</button>
      <div className="footer"><small>This will be unique to this browser tab.</small></div>
    </div>
  )
}