export default function Results({ options = [], total = 0 }) {
  return (
    <div>
      <h3>Polling results</h3>
      <div className="options">
        {options.map((opt, i) => {
          const pct = total ? Math.round((opt.count || 0) * 100 / total) : 0;
          return (
            <div key={i}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>{opt.text}</div>
                <div><span className="badge">{(opt.count || 0)} / {total} • {pct}%</span></div>
              </div>
              <div className="bar"><div style={{ width: pct + '%' }} /></div>
            </div>
          );
        })}
      </div>
    </div>
  )
}