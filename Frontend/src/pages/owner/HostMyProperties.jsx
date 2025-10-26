import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingApi, propertyApi } from '../../services/api'

export default function HostMyProperties() {
  const [properties, setProperties] = useState([])
  const [bookingsByProperty, setBookingsByProperty] = useState({})
  const [imagesByProperty, setImagesByProperty] = useState({})
  const [uploading, setUploading] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const totalProperties = properties.length

  const load = async () => {
    setLoading(true); setError('')
    try {
      const propsRes = await propertyApi.ownerMyProperties()
      const props = propsRes?.data?.properties || []
      setProperties(props)
      try {
        const bookingsRes = await bookingApi.listOwnerRequests()
        const bookings = bookingsRes?.data?.bookings || []
        const byProp = bookings.reduce((acc, b) => {
          const pid = b?.property?.id || b.property_id
          if (!pid) return acc
          acc[pid] = acc[pid] || []
          acc[pid].push(b)
          return acc
        }, {})
        setBookingsByProperty(byProp)
      } catch (_) {
        setBookingsByProperty({})
      }
    } catch (e) {
      setError('Failed to load properties')
      setProperties([]); setBookingsByProperty({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const loadImages = async (propertyId) => {
    try {
      const { data } = await propertyApi.details(propertyId)
      setImagesByProperty(prev => ({ ...prev, [propertyId]: data.property?.images || [] }))
    } catch (e) {
      setImagesByProperty(prev => ({ ...prev, [propertyId]: [] }))
    }
  }

  const onUpload = async (propertyId, files) => {
    if (!files || files.length === 0) return
    setUploading(prev => ({ ...prev, [propertyId]: true }))
    try {
      await propertyApi.uploadImages(propertyId, files)
      await loadImages(propertyId)
    } catch (e) { /* ignore */ }
    finally {
      setUploading(prev => ({ ...prev, [propertyId]: false }))
    }
  }

  const onDelete = async (propertyId, imageId) => {
    try {
      await propertyApi.deleteImage(propertyId, imageId)
      await loadImages(propertyId)
    } catch (e) { /* ignore */ }
  }

  const toggleActive = async (p) => {
    try {
      await propertyApi.update(p.id, { is_active: !p.is_active })
      await load()
    } catch (e) { /* ignore */ }
  }

  const removeProperty = async (p) => {
    const ok = window.confirm(`You are deleting the property "${p.name}". This action will remove it from listings. Continue?`)
    if (!ok) return
    try {
      await propertyApi.remove(p.id)
      await load()
    } catch (e) {
      alert('Failed to delete the property. Please try again.')
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>My Properties</h3>
        <div className="d-flex align-items-center gap-3">
          <span className="text-muted">Total: {totalProperties}</span>
          <Link className="btn btn-dark" to="/host/properties/new">Add property</Link>
        </div>
      </div>

      {properties.length === 0 && <div className="alert alert-info">You have not added any properties yet.</div>}

      <div className="vstack gap-3">
        {properties.map(p => (
          <div key={p.id} className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h5 className="mb-1">{p.name}</h5>
                  <div className="text-muted">${p.price_per_night ?? p.pricePerNight ?? p.price} night • {p.property_type ?? p.type}</div>
                  {p.description && <div className="mt-2" style={{maxWidth:600}}>{p.description}</div>}
                  <div className="mt-2">
                    <span className={`badge ${p.is_active ? 'bg-success' : 'bg-secondary'}`}>{p.is_active ? 'Active' : 'Disabled'}</span>
                  </div>
                </div>
                <div className="btn-group">
                  <Link className="btn btn-outline-secondary" to={`/host/properties/${p.id}/edit`}>Edit</Link>
                  <button className="btn btn-outline-warning" onClick={()=>toggleActive(p)}>{p.is_active ? 'Disable' : 'Enable'}</button>
                  <button className="btn btn-outline-danger" onClick={()=>removeProperty(p)}>Remove</button>
                </div>
              </div>

              <div className="row mt-3">
                <div className="col-md-6">
                  <h6>Images</h6>
                  <div className="d-flex gap-2 align-items-center mb-2">
                    <input type="file" multiple className="form-control" onChange={e=>onUpload(p.id, [...e.target.files])} disabled={!!uploading[p.id]} />
                  </div>
                  <button className="btn btn-sm btn-outline-primary mb-2" onClick={()=>loadImages(p.id)}>Refresh images</button>
                  <div className="d-flex flex-wrap gap-2">
                    {(imagesByProperty[p.id] || []).map(img => (
                      <div key={img.id} className="position-relative" style={{width:100}}>
                        <img src={img.image_url} alt="" className="img-fluid rounded" />
                        <button className="btn btn-sm btn-danger position-absolute top-0 end-0" onClick={()=>onDelete(p.id, img.id)}>&times;</button>
                      </div>
                    ))}
                    {(!imagesByProperty[p.id] || imagesByProperty[p.id].length === 0) && <div className="text-muted">No images loaded. Click Refresh images.</div>}
                  </div>
                </div>
                <div className="col-md-6">
                  <h6>Bookings</h6>
                  <div className="list-group">
                    {(bookingsByProperty[p.id] || []).map(b => (
                      <div className="list-group-item d-flex justify-content-between align-items-center" key={b.id}>
                        <div>
                          <div className="fw-semibold">{b.startDate} → {b.endDate}</div>
                          <div className="text-muted">{b.guests} guests</div>
                        </div>
                        <span className={`badge ${b.status==='Accepted'?'bg-success':b.status==='Pending'?'bg-warning text-dark':'bg-secondary'}`}>{b.status}</span>
                      </div>
                    ))}
                    {(!bookingsByProperty[p.id] || bookingsByProperty[p.id].length === 0) && <div className="list-group-item">No bookings yet.</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
