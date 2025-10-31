import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingApi, propertyApi } from '../../services/api'

function StatusBadge({ status }) {
  const s = (status || '').toString().toLowerCase()
  const label = s.charAt(0).toUpperCase() + s.slice(1)
  const cls = s === 'accepted' ? 'bg-success' : s === 'pending' ? 'bg-warning text-dark' : s === 'cancelled' ? 'bg-secondary' : 'bg-light text-dark'
  return <span className={`badge badge-status ${cls}`}>{label}</span>
}

function money(x) {
  const n = Number(x)
  if (Number.isNaN(n)) return '$0'
  return `$${n.toLocaleString()}`
}

function assetUrl(path) {
  if (!path) return '/placeholder.svg'
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'
  let origin = ''
  try { origin = new URL(apiBase).origin } catch { origin = 'http://localhost:3001' }
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}

export default function Trips() {
  const [status, setStatus] = useState('')
  const [list, setList] = useState([])
  const [imgCache, setImgCache] = useState({})

  const load = async () => {
    try {
      const { data } = await bookingApi.listTraveler(status)
      const payload = data?.data || data
      const bookings = payload?.bookings || []
      setList(bookings)
      // Prefetch missing images using property details as fallback
      const missing = bookings.filter(b => !(b.property_image || b.main_image) && (b.property_id || b.property?.id))
      missing.forEach(async (b) => {
        const pid = b.property_id || b.property?.id
        if (!pid || imgCache[pid]) return
        try {
          const { data } = await propertyApi.details(pid)
          const payload = data?.data || data
          const prop = payload?.property
          const imgRec = (prop?.images || []).find(i => i.image_type === 'main') || (prop?.images || [])[0]
          const url = imgRec?.image_url
          if (url) setImgCache(prev => ({ ...prev, [pid]: assetUrl(url) }))
        } catch { /* ignore */ }
      })
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
        {list.map(b => {
          const propertyName = b.property_name || b.property?.name || 'Property'
          const start = b.check_in_date || b.startDate
          const end = b.check_out_date || b.endDate
          const guests = b.number_of_guests || b.guests
          const total = b.total_price
          const propertyId = b.property_id || b.property?.id
          const pid = b.property_id || b.property?.id
          const img = assetUrl(b.property_image || b.main_image || imgCache[pid])
          return (
            <div key={b.id} className="list-group-item">
              <div className="d-flex">
                <div className="me-3" style={{width: 72, height: 72, overflow: 'hidden', borderRadius: 8, background: '#f4f4f4'}}>
                  <img src={img} alt={propertyName} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-semibold mb-1">
                        <Link to={`/properties/${propertyId}`} className="text-decoration-none">{propertyName}</Link>
                      </div>
                      <div className="text-muted" style={{fontSize:14}}>{start} → {end} • {guests} guest{guests>1?'s':''}</div>
                    </div>
                    <div className="text-end">
                      {total !== undefined && <div className="fw-semibold">{money(total)}</div>}
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {list.length === 0 && <p>No trips to show.</p>}
    </div>
  )
}
