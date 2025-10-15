import React, { useEffect, useState } from 'react'
import { bookingApi } from '../../services/api'
import { Link } from 'react-router-dom'

export default function HostDashboard() {
  const [requests, setRequests] = useState([])
  const [history, setHistory] = useState([])

  const load = async () => {
    try {
      const { data } = await bookingApi.listOwner()
      setRequests((data.requests||[]).filter(r => r.status === 'Pending'))
      setHistory((data.requests||[]).filter(r => r.status !== 'Pending'))
    } catch {
      setRequests([]); setHistory([])
    }
  }
  useEffect(() => { load() }, [])

  const respond = async (id, action) => {
    await bookingApi.respond(id, action)
    load()
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Host dashboard</h3>
        <Link className="btn btn-dark" to="/host/properties/new">Add property</Link>
      </div>

      <h5>Incoming requests</h5>
      <div className="list-group mb-4">
        {requests.map(r => (
          <div className="list-group-item d-flex justify-content-between align-items-center" key={r.id}>
            <div>
              <div className="fw-semibold">{r.property?.name} • {r.guests} guests</div>
              <div>{r.startDate} → {r.endDate}</div>
            </div>
            <div className="btn-group">
              <button className="btn btn-outline-secondary" onClick={()=>respond(r.id,'cancel')}>Cancel</button>
              <button className="btn btn-brand text-white" onClick={()=>respond(r.id,'accept')}>Accept</button>
            </div>
          </div>
        ))}
        {requests.length === 0 && <div className="list-group-item">No pending requests.</div>}
      </div>

      <h5>History</h5>
      <div className="list-group">
        {history.map(r => (
          <div className="list-group-item d-flex justify-content-between align-items-center" key={r.id}>
            <div>
              <div className="fw-semibold">{r.property?.name} • {r.guests} guests</div>
              <div>{r.startDate} → {r.endDate}</div>
            </div>
            <span className={`badge ${r.status==='Accepted'?'bg-success':'bg-secondary'}`}>{r.status}</span>
          </div>
        ))}
        {history.length === 0 && <div className="list-group-item">No history yet.</div>}
      </div>
    </div>
  )
}
