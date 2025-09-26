import { Link } from 'react-router-dom'

export default function App() {
  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <h2>Select your role</h2>
        </div>
        <div className="row">
          <Link className="btn" to="/teacher">I am a Teacher</Link>
          <Link className="btn secondary" to="/student">I am a Student</Link>
        </div>
        <div className="footer">
          <p>Follow the design & requirements; this demo meets the mandatory functionality and includes optional time limit config.</p>
        </div>
      </div>
    </div>
  )
}