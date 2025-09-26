export default function PollHistory({ polls = [] }) {
  if (!polls.length) return <div className="footer">No past polls yet.</div>
  return (
    <div>
      <h3>Poll History</h3>
      <div className="col">
        {polls.map((p, i) => {
          const total = (p.options || []).reduce((a,o)=>a+(o.count||0),0);
          return (
            <div key={p.id || i} className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{p.question}</div>
              {(p.options || []).map((o, j) => {
                const pct = total ? Math.round((o.count||0) * 100 / total) : 0;
                return (
                  <div key={j} style={{ marginBottom: 6 }}>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <div>{o.text}</div>
                      <div><span className="badge">{(o.count||0)} / {total} • {pct}%</span></div>
                    </div>
                    <div className="bar"><div style={{ width: pct + '%' }} /></div>
                  </div>
                )
              })}
              <div className="footer">Responses: {total}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}