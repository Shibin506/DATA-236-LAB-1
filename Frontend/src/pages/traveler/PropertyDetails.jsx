import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { bookingApi, propertyApi } from '../../services/api'

export default function PropertyDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [p, setP] = useState(null)
  const [form, setForm] = useState({ startDate: '', endDate: '', guests: 1 })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    propertyApi.details(id).then(({data}) => setP(data.property)).catch(()=>{})
  }, [id])

  const isDatesValid = form.startDate && form.endDate && new Date(form.startDate) < new Date(form.endDate)
  const exceedsGuests = p && form.guests && Number(form.guests) > Number(p.max_guests || p.maxGuests)
  const outsideAvailability = (() => {
    if (!p) return false
    const start = form.startDate ? new Date(form.startDate) : null
    const end = form.endDate ? new Date(form.endDate) : null
    const availStart = p.availability_start ? new Date(p.availability_start) : null
    const availEnd = p.availability_end ? new Date(p.availability_end) : null
    if (!start || !end) return false
    if (availStart && start < availStart) return true
    if (availEnd && end > availEnd) return true
    return false
  })()

  const book = async () => {
    setMsg(''); setError('')
    if (!isDatesValid) {
      setError('Please select a valid date range.')
      return
    }
    if (exceedsGuests) {
      setError('Guest limit exceeded for this property.')
      return
    }
    if (outsideAvailability) {
      setError('This property is not available for your selected dates.')
      return
    }
    try {
      await bookingApi.create({ propertyId: id, ...form })
      setMsg('Booking requested. Status: Pending')
      // Redirect to trips so user can see their pending booking
      setTimeout(() => navigate('/trips'), 500)
    } catch (e) {
      const m = e?.response?.data?.message || 'Booking failed'
      if (/not available/i.test(m) || /guest limit/i.test(m)) setError(m)
      else setMsg(m)
    }
  }

  if (!p) return <p>Loading...</p>

  return (
    <div className="row">
      <div className="col-md-7">
  <img src={p.coverImage || '/placeholder.svg'} alt={p.name} className="img-fluid rounded mb-3" />
        <h2>{p.name}</h2>
        <p className="text-muted">{p.location}</p>
        {(p.availability_start || p.availability_end) && (
          <p className="text-muted small">
            Availability window{': '}
            {p.availability_start ? new Date(p.availability_start).toLocaleDateString() : 'Any'}
            {' '}to{' '}
            {p.availability_end ? new Date(p.availability_end).toLocaleDateString() : 'Any'}
          </p>
        )}
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
            {error && <div className="alert alert-danger">{error}</div>}
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
                <button className="btn btn-brand text-white" onClick={book}
                  disabled={!isDatesValid || exceedsGuests || outsideAvailability}
                >Request to book</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
