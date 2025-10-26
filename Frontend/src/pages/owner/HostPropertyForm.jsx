import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { propertyApi } from '../../services/api'

export default function HostPropertyForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name:'', type:'Apartment', address:'', city:'', state:'', country:'', description:'', pricePerNight:100, bedrooms:1, bathrooms:1, amenities:'', maxGuests: ''
  })
  const [msg, setMsg] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)

  // Load existing property for edit mode
  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const { data } = await propertyApi.details(id)
        const p = data.property || {}
        setForm({
          name: p.name || '',
          type: p.type || p.property_type || 'Apartment',
          address: p.address || p.location || '',
          city: p.city || '',
          state: p.state || '',
          country: p.country || '',
          description: p.description || '',
          pricePerNight: p.pricePerNight ?? p.price_per_night ?? 100,
          bedrooms: p.bedrooms ?? p.number_of_bedrooms ?? 1,
          bathrooms: p.bathrooms ?? p.number_of_bathrooms ?? 1,
          amenities: Array.isArray(p.amenities) ? p.amenities.join(', ') : (p.amenities || ''),
          maxGuests: p.max_guests ?? ''
        })
      } catch (e) {
        setMsg('Failed to load property for editing')
      }
    }
    load()
  }, [id])

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.type==='number' ? Number(e.target.value) : e.target.value })
  const onSubmit = async (e) => {
    e.preventDefault(); setMsg(''); setLoading(true)
    try {
      // Client-side validation to avoid DB NOT NULL violations
      if (!String(form.city || '').trim()) {
        setLoading(false); setMsg('City is required'); return
      }
      if (!String(form.state || '').trim()) {
        setLoading(false); setMsg('State is required'); return
      }
      const payload = {
        name: form.name,
        description: form.description ?? null,
        // Explicit address fields to satisfy backend schema (state often NOT NULL)
        address: form.address || null,
        city: (form.city || '').trim(),
        state: (form.state || '').trim(),
        country: (form.country || null),
        property_type: form.type,
        price_per_night: Number(form.pricePerNight),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        // Provide a reasonable default for max_guests if not separately collected
        max_guests: Number(form.maxGuests || (Number(form.bedrooms) > 0 ? Number(form.bedrooms) * 2 : 1)),
        // Backend expects a string column; send CSV instead of array to avoid binding issues
        amenities: form.amenities.split(',').map(a=>a.trim()).filter(Boolean).join(', '),
        house_rules: null
      }
      let propertyId = id
      if (id) {
        await propertyApi.update(id, payload)
      } else {
        const res = await propertyApi.add(payload)
        propertyId = res?.data?.id || res?.data?.property?.id
      }
      // Upload images if provided
      if (propertyId && files && files.length > 0) {
        try {
          await propertyApi.uploadImages(propertyId, files)
          setMsg(id ? 'Changes saved.' : 'Property posted!')
        } catch (upErr) {
          console.warn('Image upload failed', upErr)
          setMsg((id ? 'Changes saved.' : 'Property posted!') + ' Images could not be uploaded right now. You can add them later from My Properties.')
        }
      } else {
        setMsg(id ? 'Changes saved.' : 'Property posted!')
      }
      // Optionally navigate back to My Properties
      // navigate('/host/properties')
    } catch (e) {
      setMsg(e?.response?.data?.message || (id ? 'Failed to save changes' : 'Failed to post property'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <h3 className="mb-3">{id ? 'Edit property' : 'Add a property'}</h3>
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
              <label className="form-label">Address</label>
              <input className="form-control" name="address" value={form.address} onChange={onChange} placeholder="Street address or area" />
            </div>
            <div className="col-md-4">
              <label className="form-label">City</label>
              <input className="form-control" name="city" value={form.city} onChange={onChange} required />
            </div>
            <div className="col-md-4">
              <label className="form-label">State</label>
              <input className="form-control" name="state" value={form.state} onChange={onChange} required />
              <div className="form-text">State is required.</div>
            </div>
            <div className="col-md-4">
              <label className="form-label">Country</label>
              <input className="form-control" name="country" value={form.country} onChange={onChange} />
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
            <div className="col-md-4">
              <label className="form-label">Max guests</label>
              <input type="number" min="1" className="form-control" name="maxGuests" value={form.maxGuests} onChange={onChange} placeholder={(Number(form.bedrooms)||1)*2} />
              <div className="form-text">Defaults to 2 x bedrooms if left blank.</div>
            </div>
            <div className="col-md-12">
              <label className="form-label">Amenities (comma separated)</label>
              <input className="form-control" name="amenities" value={form.amenities} onChange={onChange} placeholder="Wifi, Kitchen, Air conditioning" />
            </div>
            <div className="col-md-12">
              <label className="form-label">Images</label>
              <input type="file" className="form-control" multiple onChange={e=>setFiles([...e.target.files])} />
              <div className="form-text">You can upload multiple images. The first uploaded may become the cover.</div>
            </div>
          </div>
          <div className="mt-3">
            <button className="btn btn-brand text-white" disabled={loading}>{id ? 'Save changes' : 'Post property'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
