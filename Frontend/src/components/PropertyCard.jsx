import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { propertyApi, favoriteApi } from '../services/api'

export default function PropertyCard({ property, onFavorite, dateRange }) {
  const [fav, setFav] = useState(property?.favorite || false)
  const parseYMD = (s) => {
    if (!s) return null
    const [y,m,d] = s.split('-').map(Number)
    if (!y || !m || !d) return null
    return new Date(Date.UTC(y, m-1, d))
  }
  const nights = (() => {
    if (!dateRange?.startDate || !dateRange?.endDate) return 0
    const s = parseYMD(dateRange.startDate)
    const e = parseYMD(dateRange.endDate)
    if (!s || !e) return 0
    const diff = (e - s) / (24*60*60*1000)
    return diff > 0 ? Math.floor(diff) : 0
  })()
  const nightly = property.pricePerNight || property.price_per_night || 0
  const computedTotal = nights > 0 && nightly ? nights * nightly : null

  const toggleFav = async (e) => {
    e.preventDefault()
    try {
      await favoriteApi.toggle(property.id)
      setFav(f => !f)
      onFavorite && onFavorite(property.id)
    } catch (e) { /* ignore */ }
  }

  const searchQuery = (dateRange?.startDate && dateRange?.endDate)
    ? `?startDate=${encodeURIComponent(dateRange.startDate)}&endDate=${encodeURIComponent(dateRange.endDate)}`
    : ''

  return (
    <Link to={{ pathname: `/properties/${property.id}`, search: searchQuery }} className="card text-decoration-none text-dark">
  <img src={(property.coverImage || property.main_image) || '/placeholder.svg'} className="card-img-top" alt={property.name} />
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <h5 className="card-title">{property.name}</h5>
          <button className="btn btn-sm btn-outline-danger" onClick={toggleFav} aria-label="favorite">
            {fav ? '♥' : '♡'}
          </button>
        </div>
        <p className="card-text mb-1">{property.location || [property.city, property.state, property.country].filter(Boolean).join(', ')}</p>
        {property.total_price ? (
          <>
            <p className="card-text mb-1"><strong>${property.total_price}</strong> total</p>
            {property.total_nights && <p className="card-text text-muted">for {property.total_nights} night{property.total_nights>1?'s':''}</p>}
          </>
        ) : computedTotal ? (
          <>
            <p className="card-text mb-1"><strong>${computedTotal}</strong> total</p>
            <p className="card-text text-muted">for {nights} night{nights>1?'s':''}</p>
          </>
        ) : (
          <p className="card-text"><strong>${nightly}</strong> night</p>
        )}
      </div>
    </Link>
  )
}
