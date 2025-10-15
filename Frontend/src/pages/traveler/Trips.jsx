import React, { useEffect, useState } from 'react'
import { bookingApi } from '../../services/api'

function StatusBadge({ status }) {
  const cls = status === 'Accepted' ? 'bg-success' : status === 'Pending' ? 'bg-warning text-dark' : 'bg-secondary'
  return <span className={`badge badge-status ${cls}`}>{status}</span>
}

export default function Trips() {
  const [status, setStatus] = useState('')
  const [list, setList] = useState([])

  const load = async () => {
    try {
      const { data } = await bookingApi.listTraveler(status)
      setList(data.bookings || [])
    } catch { setList([]) }
  }

  useEffect(() => { load() }, [status])

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3>Trips</h3>
        <select className="form-select" style={{maxWidth:220}} value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="Pending">Pending</option>
          <option value="Accepted">Accepted</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
      <div className="list-group">
        {list.map(b => (
          <div key={b.id} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <div className="fw-semibold">{b.property?.name} • {b.guests} guests</div>
              <div>{b.startDate} → {b.endDate}</div>
            </div>
            <StatusBadge status={b.status} />
          </div>
        ))}
      </div>
      {list.length === 0 && <p>No trips to show.</p>}
    </div>
  )
}
