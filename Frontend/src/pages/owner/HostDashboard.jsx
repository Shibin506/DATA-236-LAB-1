import React, { useEffect, useState } from 'react'
import { bookingApi, propertyApi } from '../../services/api'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchOwnerBookings, acceptBooking, rejectBooking } from '../../store/bookingSlice'

export default function HostDashboard() {
  const [history, setHistory] = useState([])
  const [properties, setProperties] = useState([])
  const dispatch = useDispatch()
  const ownerBookings = useSelector(state => state.bookings.ownerBookings || [])

  const load = async () => {
    try {
      dispatch(fetchOwnerBookings())
      const propsRes = await propertyApi.ownerMyProperties()
      setProperties(propsRes?.data?.properties || [])
    } catch {
      setHistory([]); setProperties([])
    }
  }
  useEffect(() => { load() }, [])
  useEffect(() => {
    // Keep history derived from ownerBookings
    setHistory(ownerBookings.filter(r => r.status && r.status.toLowerCase() !== 'pending'))
  }, [ownerBookings])

  const respond = async (id, action) => {
    if (action === 'accept') await dispatch(acceptBooking(id))
    else if (action === 'reject') await dispatch(rejectBooking({ id }))
    await dispatch(fetchOwnerBookings())
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
            <div className="h4 m-0">{ownerBookings.filter(r => r.status && r.status.toLowerCase() === 'pending').length}</div>
          </div></div>
        </div>
      </div>

      <h5>Incoming requests</h5>
      <div className="list-group mb-4">
        {ownerBookings.filter(r => r.status && r.status.toLowerCase() === 'pending').map(r => (
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
        {ownerBookings.filter(r => r.status && r.status.toLowerCase() === 'pending').length === 0 && <div className="list-group-item">No pending requests.</div>}
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
