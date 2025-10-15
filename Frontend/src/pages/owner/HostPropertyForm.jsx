import React, { useState } from 'react'
import { propertyApi } from '../../services/api'

export default function HostPropertyForm() {
  const [form, setForm] = useState({
    name:'', type:'Apartment', location:'', description:'', pricePerNight:100, bedrooms:1, bathrooms:1, amenities:''
  })
  const [msg, setMsg] = useState('')

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.type==='number' ? Number(e.target.value) : e.target.value })
  const onSubmit = async (e) => {
    e.preventDefault(); setMsg('')
    try {
      const payload = { ...form, amenities: form.amenities.split(',').map(a=>a.trim()).filter(Boolean) }
      await propertyApi.add(payload)
      setMsg('Property posted!')
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Failed to post property')
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <h3 className="mb-3">Add a property</h3>
        {msg && <div className="alert alert-info">{msg}</div>}
        <form onSubmit={onSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Name</label>
              <input className="form-control" name="name" value={form.name} onChange={onChange} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Type</label>
              <select className="form-select" name="type" value={form.type} onChange={onChange}>
                <option>Apartment</option>
                <option>House</option>
                <option>Villa</option>
                <option>Cabin</option>
              </select>
            </div>
            <div className="col-md-12">
              <label className="form-label">Location</label>
              <input className="form-control" name="location" value={form.location} onChange={onChange} placeholder="City, State" required />
            </div>
            <div className="col-md-12">
              <label className="form-label">Description</label>
              <textarea className="form-control" name="description" rows="3" value={form.description} onChange={onChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Price per night</label>
              <input type="number" min="0" className="form-control" name="pricePerNight" value={form.pricePerNight} onChange={onChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Bedrooms</label>
              <input type="number" min="0" className="form-control" name="bedrooms" value={form.bedrooms} onChange={onChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Bathrooms</label>
              <input type="number" min="0" className="form-control" name="bathrooms" value={form.bathrooms} onChange={onChange} />
            </div>
            <div className="col-md-12">
              <label className="form-label">Amenities (comma separated)</label>
              <input className="form-control" name="amenities" value={form.amenities} onChange={onChange} placeholder="Wifi, Kitchen, Air conditioning" />
            </div>
          </div>
          <div className="mt-3">
            <button className="btn btn-brand text-white">Post property</button>
          </div>
        </form>
      </div>
    </div>
  )
}
