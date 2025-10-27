import React, { useEffect, useState } from 'react'
import { favoriteApi } from '../../services/api'
import PropertyCard from '../../components/PropertyCard'

export default function Favorites() {
  const [list, setList] = useState([])
  const load = async () => {
    try {
      const { data } = await favoriteApi.list()
      setList(data.favorites || [])
    } catch { setList([]) }
  }
  useEffect(() => { load() }, [])

  return (
    <div>
      <h3 className="mb-3">Favorites</h3>
      <div className="row g-3">
        {list.map(p => (
          <div className="col-sm-6 col-md-4 col-lg-3" key={p.id}>
            <PropertyCard property={p} onFavorite={load} />
          </div>
        ))}
      </div>
      {list.length === 0 && <p>No favorites yet.</p>}
    </div>
  )
}
