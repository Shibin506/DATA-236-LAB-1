import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { bookingApi, propertyApi } from '../../services/api'

export default function PropertyDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [p, setP] = useState(null)
  const [form, setForm] = useState({ startDate: '', endDate: '', guests: 1 })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    propertyApi.details(id).then(({data}) => setP(data.property)).catch(()=>{})
  }, [id])

  const book = async () => {
    setMsg('')
    try {
      await bookingApi.create({ propertyId: id, ...form })
      setMsg('Booking requested. Status: Pending')
      // Redirect to trips so user can see their pending booking
      setTimeout(() => navigate('/trips'), 500)
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Booking failed')
    }
  }

  if (!p) return <p>Loading...</p>

  return (
    <div className="row">
      <div className="col-md-7">
  <img src={p.coverImage || '/placeholder.svg'} alt={p.name} className="img-fluid rounded mb-3" />
        <h2>{p.name}</h2>
        <p className="text-muted">{p.location}</p>
        <p>{p.description}</p>
        <ul>
          <li>Type: {p.type}</li>
          <li>Bedrooms: {p.bedrooms} • Bathrooms: {p.bathrooms}</li>
          <li>Amenities: {p.amenities?.join(', ')}</li>
        </ul>
      </div>
      <div className="col-md-5">
        <div className="card">
          <div className="card-body">
            <div className="d-flex align-items-baseline justify-content-between mb-2">
              <div><span className="h4">${p.pricePerNight}</span> night</div>
            </div>
            {msg && <div className="alert alert-info">{msg}</div>}
            <div className="row g-2">
              <div className="col-6">
                <label className="form-label">Start</label>
                <input type="date" className="form-control" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} />
              </div>
              <div className="col-6">
                <label className="form-label">End</label>
                <input type="date" className="form-control" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} />
              </div>
              <div className="col-12">
                <label className="form-label">Guests</label>
                <input type="number" min="1" className="form-control" value={form.guests} onChange={e=>setForm({...form,guests:e.target.value})} />
              </div>
              <div className="col-12 d-grid">
                <button className="btn btn-brand text-white" onClick={book}>Request to book</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
