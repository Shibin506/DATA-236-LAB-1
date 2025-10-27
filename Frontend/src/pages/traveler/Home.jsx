import React, { useEffect, useState } from 'react'
import { propertyApi } from '../../services/api'
import PropertyCard from '../../components/PropertyCard'

export default function Home() {
  const [q, setQ] = useState({ location: '', startDate: '', endDate: '', guests: 1 })
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const invalidDates = q.startDate && q.endDate && new Date(q.startDate) >= new Date(q.endDate)

  const search = async (e) => {
    e && e.preventDefault()
    setError('')
    if (invalidDates) {
      setError('Please select a valid date range (end date after start date).')
      return
    }
    setLoading(true)
    try {
      const { data } = await propertyApi.search(q)
      setList(data.properties || [])
    } catch {
      setList([])
    } finally { setLoading(false) }
  }

  useEffect(() => { search() }, [])

  return (
    <div>
      <form className="row g-2 align-items-end mb-4" onSubmit={search}>
        <div className="col-md-4">
          <label className="form-label">Location</label>
          <input className="form-control" value={q.location} onChange={e=>setQ({...q,location:e.target.value})} placeholder="Where to?" />
        </div>
        <div className="col-md-2">
          <label className="form-label">Start</label>
          <input type="date" className="form-control" value={q.startDate} onChange={e=>setQ({...q,startDate:e.target.value})} />
        </div>
        <div className="col-md-2">
          <label className="form-label">End</label>
          <input type="date" className="form-control" value={q.endDate} onChange={e=>setQ({...q,endDate:e.target.value})} />
        </div>
        <div className="col-md-2">
          <label className="form-label">Guests</label>
          <input type="number" min="1" className="form-control" value={q.guests} onChange={e=>setQ({...q,guests:e.target.value})} />
        </div>
        <div className="col-md-2">
          <button className="btn btn-brand text-white w-100" disabled={invalidDates}>Search</button>
        </div>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading && <p>Loading...</p>}
      {!loading && list.length === 0 && <p>No properties found</p>}

      <div className="row g-3">
        {list.map(p => (
          <div className="col-sm-6 col-md-4 col-lg-3" key={p.id}>
            <PropertyCard property={p} />
          </div>
        ))}
      </div>
    </div>
  )
}
