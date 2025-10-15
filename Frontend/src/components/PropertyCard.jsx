import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { propertyApi, favoriteApi } from '../services/api'

export default function PropertyCard({ property, onFavorite }) {
  const [fav, setFav] = useState(property?.favorite || false)

  const toggleFav = async (e) => {
    e.preventDefault()
    try {
      await favoriteApi.toggle(property.id)
      setFav(f => !f)
      onFavorite && onFavorite(property.id)
    } catch (e) { /* ignore */ }
  }

  return (
    <Link to={`/properties/${property.id}`} className="card text-decoration-none text-dark">
  <img src={property.coverImage || '/placeholder.svg'} className="card-img-top" alt={property.name} />
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <h5 className="card-title">{property.name}</h5>
          <button className="btn btn-sm btn-outline-danger" onClick={toggleFav} aria-label="favorite">
            {fav ? '♥' : '♡'}
          </button>
        </div>
        <p className="card-text mb-1">{property.location}</p>
        <p className="card-text"><strong>${property.pricePerNight}</strong> night</p>
      </div>
    </Link>
  )
}
