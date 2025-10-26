import React, { useEffect, useState } from 'react'
import { bookingApi, propertyApi } from '../../services/api'
import { Link } from 'react-router-dom'

export default function HostDashboard() {
  const [requests, setRequests] = useState([])
  const [history, setHistory] = useState([])
  const [properties, setProperties] = useState([])

  const load = async () => {
    try {
      const [bookingsRes, propsRes] = await Promise.all([
        bookingApi.listOwnerRequests(),
        propertyApi.ownerMyProperties()
      ])
      const data = bookingsRes.data || {}
      setRequests((data.bookings||[]).filter(r => r.status === 'Pending'))
      setHistory((data.bookings||[]).filter(r => r.status !== 'Pending'))
      setProperties(propsRes?.data?.properties || [])
    } catch {
      setRequests([]); setHistory([]); setProperties([])
    }
  }
  useEffect(() => { load() }, [])

  const respond = async (id, action) => {
    if (action === 'accept') await bookingApi.accept(id)
    else if (action === 'reject') await bookingApi.reject(id)
    await load()
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Host dashboard</h3>
        <div className="btn-group">
          <Link className="btn btn-outline-secondary" to="/host/properties">My Properties</Link>
          <Link className="btn btn-dark" to="/host/properties/new">Add property</Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card"><div className="card-body">
            <div className="text-muted">Total properties</div>
            <div className="h4 m-0">{properties.length}</div>
          </div></div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card"><div className="card-body">
            <div className="text-muted">Pending requests</div>
            <div className="h4 m-0">{requests.length}</div>
          </div></div>
        </div>
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
              <button className="btn btn-outline-danger" onClick={()=>respond(r.id,'reject')}>Reject</button>
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
