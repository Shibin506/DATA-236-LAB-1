import axios from 'axios'

// Base API URL - should point to backend server root (include /api prefix to match backend)
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'
const API_ORIGIN = API_BASE.replace(/\/api$/,'')
const MOCK = String(import.meta.env.VITE_MOCK || '').toLowerCase() === 'true'
const AGENT_API_BASE = import.meta.env.VITE_AGENT_API_BASE || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // cookies for session-based auth
  headers: { 'Content-Type': 'application/json' }
})

// Normalize responses: backend returns { success: true, data: { ... } }
// We unwrap one level so callers can use `.then(({data}) => ...)` and get the inner `data` object.
api.interceptors.response.use((response) => {
  const body = response.data
  // If backend used wrapper { success, data: {...} }, unwrap to { data: ... }
  if (body && typeof body === 'object' && 'data' in body) {
    return { data: body.data, status: response.status, headers: response.headers }
  }
  return { data: body, status: response.status, headers: response.headers }
}, (error) => Promise.reject(error))

// Frontend -> Backend endpoint mapping
// Helpers to normalize backend payloads into UI-friendly shapes
const toAbsoluteUrl = (url) => {
  if (!url) return url
  if (/^https?:\/\//i.test(url)) return url
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`
}

const normalizeProperty = (p) => {
  if (!p || typeof p !== 'object') return p
  const amenitiesArr = Array.isArray(p.amenities)
    ? p.amenities
    : (typeof p.amenities === 'string'
      ? p.amenities.split(',').map(s => s.trim()).filter(Boolean)
      : [])

  // Support various backend shapes for a main image: images[], main_image, property_image
  let images = Array.isArray(p.images) ? p.images.map(img => ({
    ...img,
    image_url: toAbsoluteUrl(img.image_url)
  })) : []

  // If we don't have an images array but backend provided a main image url, synthesize one
  const possibleMain = p.main_image || p.property_image || p.image_url
  if (!images.length && possibleMain) {
    images = [{ image_url: toAbsoluteUrl(possibleMain), image_type: 'main' }]
  }

  // Determine cover image: prefer 'main', else first image, else seeded default pattern
  let coverImage
  const main = images.find(i => i.image_type === 'main')
  if (main) coverImage = main.image_url
  else if (images[0]) coverImage = images[0].image_url
  else if (p.id) coverImage = `${API_ORIGIN}/uploads/properties/property-${p.id}-main.jpg`

  // Map backend field names to UI-friendly ones
  const pricePerNight = p.pricePerNight ?? p.price_per_night ?? p.price ?? null
  const type = p.type ?? p.property_type ?? p.propertyType ?? null
  const bedrooms = p.bedrooms ?? p.number_of_bedrooms ?? null
  const bathrooms = p.bathrooms ?? p.number_of_bathrooms ?? null
  const location = p.location ?? [p.city, p.state, p.country].filter(Boolean).join(', ')

  return {
    ...p,
    amenities: amenitiesArr,
    images,
    coverImage,
    pricePerNight,
    type,
    bedrooms,
    bathrooms,
    location
  }
}

// Booking normalization
const titleCaseStatus = (s) => {
  if (!s) return s
  const lower = String(s).toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

const normalizeBooking = (b) => {
  if (!b || typeof b !== 'object') return b
  const statusRaw = b.status ?? b.booking_status
  const startDate = b.startDate ?? b.check_in_date ?? b.checkin_date
  const endDate = b.endDate ?? b.check_out_date ?? b.checkout_date
  const guests = b.guests ?? b.number_of_guests
  const property = b.property
    ? { ...b.property, id: b.property.id ?? b.property_id, name: b.property.name ?? b.property_name }
    : (b.property_name || b.property_id
      ? { id: b.property_id, name: b.property_name }
      : undefined)
  return {
    ...b,
    status: titleCaseStatus(statusRaw),
    startDate,
    endDate,
    guests,
    property
  }
}
// Auth endpoints (backend):
// POST /api/auth/register         -> register user (name,email,password,user_type,phone)
// POST /api/auth/login            -> login (email,password)
// POST /api/auth/logout           -> logout
// GET  /api/auth/me               -> current user

export const authApi = {
  // register both traveler and owner; backend expects user_type field
  signup: (payload) => MOCK ? Promise.resolve({ data: { user: null }}) : api.post('/auth/register', payload),
  login: (payload) => {
    if (MOCK) return Promise.resolve({ data: { user: { id: 1, name: 'Mock User', email: payload.email, user_type: payload.user_type || payload.role || 'traveler' }}})
    const body = { ...payload }
    if (body.role && !body.user_type) body.user_type = body.role
    delete body.role
    return api.post('/auth/login', body)
  },
  logout: () => MOCK ? Promise.resolve({}) : api.post('/auth/logout'),
  // session check endpoint (raw session info)
  // Use a raw axios request to preserve top-level fields like `authenticated`
  sessionInfo: async () => {
    if (MOCK) return { success: true, authenticated: true, data: { userId: 1, userType: 'traveler' } }
    try {
      const res = await axios.get(`${API_BASE}/auth/session`, { withCredentials: true })
      return res.data
    } catch (err) {
      // Fallback for backends without /auth/session: try /auth/me to infer authentication
      try {
        const me = await api.get('/auth/me')
        if (me?.data?.user) {
          return { success: true, authenticated: true, data: { userId: me.data.user.id, userType: me.data.user.user_type || me.data.user.role } }
        }
      } catch (_) {
        // ignore; will return unauthenticated below
      }
      return { success: true, authenticated: false }
    }
  },
  // Kept for backward compatibility if used elsewhere (may drop top-level flags due to interceptor)
  session: () => MOCK ? Promise.resolve({ data: { active: true }}) : api.get('/auth/session'),
  me: () => MOCK ? Promise.resolve({ data: { user: null }}) : api.get('/auth/me'),
  changePassword: (payload) => api.post('/auth/change-password', payload)
}

// Utility to set auth token on the axios instance (Bearer token)
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    // If using cookie/session auth, leave withCredentials untouched
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

// Users endpoints (backend):
// GET  /api/users/profile
// PUT  /api/users/profile
// POST /api/users/upload-profile-picture (multipart/form-data)
// DELETE /api/users/profile-picture

export const userApi = {
  getProfile: () => MOCK ? Promise.resolve({ data: { user: { name:'Mock', email:'mock@example.com' }}}) : api.get('/users/profile'),
  updateProfile: (payload) => {
    if (MOCK) return Promise.resolve({ data: { user: payload }})
    const body = { ...payload }
    // Backend expects about_me
    if (body.about !== undefined && body.about_me === undefined) {
      body.about_me = body.about
      delete body.about
    }
    // Normalize gender to match DB enum values (e.g., 'male','female','other')
    if (body.gender !== undefined && body.gender !== null && body.gender !== '') {
      body.gender = String(body.gender).trim().toLowerCase()
    } else if (body.gender === '') {
      // Allow clearing gender
      body.gender = null
    }
    return api.put('/users/profile', body)
  },
  uploadAvatar: (file) => {
    const form = new FormData()
    form.append('profile_picture', file)
    return MOCK ? Promise.resolve({}) : api.post('/users/upload-profile-picture', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  deleteAvatar: () => MOCK ? Promise.resolve({}) : api.delete('/users/profile-picture'),
  dashboard: () => MOCK ? Promise.resolve({ data: {}}) : api.get('/users/dashboard'),
  history: (params) => MOCK ? Promise.resolve({ data: { items: [], pagination: {}}}) : api.get('/users/history', { params })
}

// Properties endpoints (backend):
// GET /api/properties/search
// GET /api/properties/:id
// POST /api/properties
// PUT  /api/properties/:id

export const propertyApi = {
  _sanitizePayload: (payload) => {
    // Replace undefined with null and trim strings; ensure price/nums are numbers
    const out = {}
    for (const [k, v] of Object.entries(payload || {})) {
      if (v === undefined) out[k] = null
      else if (typeof v === 'string') out[k] = v.trim()
      else out[k] = v
    }
    // Coerce numeric fields safely
    if (out.price_per_night !== null && out.price_per_night !== undefined) out.price_per_night = Number(out.price_per_night)
    if (out.bedrooms !== null && out.bedrooms !== undefined) out.bedrooms = Number(out.bedrooms)
    if (out.bathrooms !== null && out.bathrooms !== undefined) out.bathrooms = Number(out.bathrooms)
    if (out.max_guests !== null && out.max_guests !== undefined) out.max_guests = Number(out.max_guests)
    return out
  },
  search: async (params) => {
    if (MOCK) return Promise.resolve({ data: { properties: [
      { id: 1, name: 'Cozy Studio', city: 'San Jose', state: 'CA', country: 'US', price_per_night: 120, coverImage: '/placeholder.svg', amenities: ['WiFi'] },
      { id: 2, name: 'Modern Loft', city: 'San Francisco', state: 'CA', country: 'US', price_per_night: 220, coverImage: '/placeholder.svg', amenities: ['WiFi'] },
    ] } })
    // Map frontend param names to backend expectations and drop empty values
    const q = { ...(params || {}) }
    if (q.startDate) { q.check_in_date = q.startDate; delete q.startDate }
    if (q.endDate) { q.check_out_date = q.endDate; delete q.endDate }
    Object.keys(q).forEach(k => { if (q[k] === '' || q[k] === undefined || q[k] === null) delete q[k] })
    const res = await api.get('/properties/search', { params: q })
    // res.data might be { properties, pagination } or plain array depending on backend
    if (Array.isArray(res.data)) {
      return { data: res.data.map(normalizeProperty) }
    }
    const properties = (res.data?.properties || []).map(normalizeProperty)
    return { data: { ...res.data, properties } }
  },
  details: async (id) => {
    if (MOCK) return Promise.resolve({ data: { property: { id, name:'Mock Home', location:'Somewhere', description:'A nice place', property_type:'Apartment', bedrooms:1, bathrooms:1, amenities:['Wifi'], price_per_night:100 } } })
    const res = await api.get(`/properties/${id}`)
    if (res.data?.property) {
      return { data: { property: normalizeProperty(res.data.property) } }
    }
    // Some backends may return the property directly
    return { data: { property: normalizeProperty(res.data) } }
  },
  add: (payload) => {
    if (MOCK) return Promise.resolve({ data: { id: Date.now(), ...payload }})
    const body = propertyApi._sanitizePayload(payload)
    return api.post('/properties', body)
  },
  update: (id, payload) => {
    if (MOCK) return Promise.resolve({ data: { id, ...payload }})
    const body = propertyApi._sanitizePayload(payload)
    return api.put(`/properties/${id}`, body)
  },
  ownerMyProperties: async (params) => {
    if (MOCK) return Promise.resolve({ data: { properties: [], pagination: {} }})
    const res = await api.get('/properties/owner/my-properties', { params })
    const props = Array.isArray(res.data?.properties) ? res.data.properties : (Array.isArray(res.data) ? res.data : [])
    return { data: { ...res.data, properties: props.map(normalizeProperty) } }
  },
  uploadImages: (id, files) => {
    if (MOCK) return Promise.resolve({})
    // Try multiple endpoints and field names to match varying backends
    const endpoints = [
      `/properties/${id}/images`,
      `/properties/${id}/upload-images`,
      `/properties/${id}/upload`,
      `/properties/${id}/uploadImages`
    ]
    const fieldNames = ['images', 'image', 'files', 'file']
    let lastErr
    return (async () => {
      for (const fieldName of fieldNames) {
        const form = new FormData()
        ;[].concat(files).forEach(f => form.append(fieldName, f))
        for (const ep of endpoints) {
          try {
            return await api.post(ep, form, { headers: { 'Content-Type': 'multipart/form-data' } })
          } catch (err) {
            lastErr = err
            const status = err?.response?.status
            // Continue trying if route not found/unsupported method or bad field
            if (status === 404 || status === 405 || status === 415 || status === 400) continue
            // For auth or CORS/network errors, propagate immediately
            if (!err.response) break
            break
          }
        }
      }
      throw lastErr || new Error('Image upload route not found')
    })()
  },
  deleteImage: (propertyId, imageId) => MOCK ? Promise.resolve({}) : api.delete(`/properties/${propertyId}/images/${imageId}`),
  remove: (id, params) => MOCK ? Promise.resolve({}) : api.delete(`/properties/${id}`, { params }),
}

// Bookings endpoints (backend):
// POST   /api/bookings                      -> create booking (traveler)
// GET    /api/bookings/traveler/my-bookings -> traveler bookings
// GET    /api/bookings/owner/incoming-requests -> owner requests
// GET    /api/bookings/:id
// PATCH  /api/bookings/:id/accept
// PATCH  /api/bookings/:id/reject
// PATCH  /api/bookings/:id/cancel

export const bookingApi = {
  // frontend uses startDate/endDate/guests; transform to backend field names
  create: (payload) => {
    if (MOCK) return Promise.resolve({ data: { booking: { id: 1, status: 'pending', ...payload }}})
    const body = {
      property_id: payload.propertyId || payload.property_id,
      check_in_date: payload.startDate || payload.check_in_date,
      check_out_date: payload.endDate || payload.check_out_date,
      number_of_guests: payload.guests || payload.number_of_guests,
      special_requests: payload.special_requests || null
    }
    return api.post('/bookings', body)
  },
  listTraveler: async (params = {}) => {
    if (MOCK) return Promise.resolve({ data: { bookings: [] }})
    const q = { ...params }
    if (q.status) q.status = String(q.status).toLowerCase()
    // Remove empty filters to avoid sending ?status=
    if (!q.status) delete q.status
    const res = await api.get('/bookings/traveler/my-bookings', { params: q })
    const bookings = Array.isArray(res.data?.bookings) ? res.data.bookings : (Array.isArray(res.data) ? res.data : [])
    return { data: { ...res.data, bookings: bookings.map(normalizeBooking) } }
  },
  listOwnerRequests: async (params = {}) => {
    if (MOCK) return Promise.resolve({ data: { bookings: [] }})
    const q = { ...params }
    if (q.status) q.status = String(q.status).toLowerCase()
    if (!q.status) delete q.status
    // Prefer the known backend route first to avoid 404 noise; still normalize shape
    try {
      const res = await api.get('/bookings/owner/my-bookings', { params: q })
      const bookings = Array.isArray(res.data?.bookings) ? res.data.bookings : (Array.isArray(res.data) ? res.data : [])
      return { data: { ...res.data, bookings: bookings.map(normalizeBooking) } }
    } catch (err) {
      // Fallback to alternate naming if present in legacy builds
      try {
        const res2 = await api.get('/bookings/owner/incoming-requests', { params: q })
        const bookings2 = Array.isArray(res2.data?.bookings) ? res2.data.bookings : (Array.isArray(res2.data) ? res2.data : [])
        return { data: { ...res2.data, bookings: bookings2.map(normalizeBooking) } }
      } catch (err2) {
        // Return empty list rather than throw to avoid blocking pages that only need properties
        return { data: { bookings: [] } }
      }
    }
  },
  get: (id) => api.get(`/bookings/${id}`),
  accept: async (id) => {
    // Some servers block PATCH via CORS; try PATCH -> PUT -> POST
    try {
      return await api.patch(`/bookings/${id}/accept`)
    } catch (err) {
      const status = err?.response?.status
      if (!err.response || status === 404 || status === 405) {
        try { return await api.put(`/bookings/${id}/accept`) } catch (err2) {
          const status2 = err2?.response?.status
          if (!err2.response || status2 === 404 || status2 === 405) {
            return api.post(`/bookings/${id}/accept`)
          }
          throw err2
        }
      }
      throw err
    }
  },
  reject: async (id, reason) => {
    try {
      return await api.patch(`/bookings/${id}/reject`, { reason })
    } catch (err) {
      const status = err?.response?.status
      if (!err.response || status === 404 || status === 405) {
        try { return await api.put(`/bookings/${id}/reject`, { reason }) } catch (err2) {
          const status2 = err2?.response?.status
          if (!err2.response || status2 === 404 || status2 === 405) {
            return api.post(`/bookings/${id}/reject`, { reason })
          }
          throw err2
        }
      }
      throw err
    }
  },
  cancel: async (id, reason) => {
    try {
      return await api.patch(`/bookings/${id}/cancel`, { reason })
    } catch (err) {
      const status = err?.response?.status
      if (!err.response || status === 404 || status === 405) {
        try { return await api.put(`/bookings/${id}/cancel`, { reason }) } catch (err2) {
          const status2 = err2?.response?.status
          if (!err2.response || status2 === 404 || status2 === 405) {
            return api.post(`/bookings/${id}/cancel`, { reason })
          }
          throw err2
        }
      }
      throw err
    }
  },
  ownerStats: () => api.get('/bookings/owner/statistics')
}

// Favorites endpoints (backend):
// GET    /api/favorites
// POST   /api/favorites           (body: { property_id })
// DELETE /api/favorites/:propertyId
// GET    /api/favorites/check/:propertyId
// GET    /api/favorites/count

export const favoriteApi = {
  list: async (params) => {
    if (MOCK) return Promise.resolve({ data: { favorites: [] }})
    try {
      const res = await api.get('/favorites', { params })
      const items = Array.isArray(res.data?.favorites) ? res.data.favorites : (Array.isArray(res.data) ? res.data : [])
      const favorites = items.map((p) => {
        const propertyLike = {
          ...p,
          // IMPORTANT: For favorites rows, p.id is the favorites.id.
          // We want the UI card to operate on the actual property id.
          id: p.property_id ?? p.id,
          favorite_id: p.id ?? p.favorite_id,
          favorite: true,
          pricePerNight: p.pricePerNight ?? p.price_per_night,
          location: p.location || [p.city, p.state, p.country].filter(Boolean).join(', ')
        }
        if (p.image_url) {
          propertyLike.images = [{ image_url: p.image_url, image_type: 'main' }]
        }
        return normalizeProperty(propertyLike)
      })
      return { data: { favorites } }
    } catch (err) {
      // Fallback to src route style
      if (err?.response?.status === 404) {
        const res = await api.get('/favorites/traveler/my-favorites', { params })
        const items = Array.isArray(res.data?.favorites) ? res.data.favorites : (Array.isArray(res.data) ? res.data : [])
        const favorites = items.map((p) => {
          const propertyLike = {
            ...p,
            id: p.property_id ?? p.id,
            favorite_id: p.id ?? p.favorite_id,
            favorite: true,
            pricePerNight: p.pricePerNight ?? p.price_per_night,
            location: p.location || [p.city, p.state, p.country].filter(Boolean).join(', ')
          }
          if (p.image_url) {
            propertyLike.images = [{ image_url: p.image_url, image_type: 'main' }]
          }
          return normalizeProperty(propertyLike)
        })
        return { data: { favorites } }
      }
      throw err
    }
  },
  check: (propertyId) => MOCK ? Promise.resolve({ data: { is_favorited: false }}) : api.get(`/favorites/check/${propertyId}`),
  // Prefer body style first for compatibility with current backend; fallback to path style
  add: async (propertyId) => {
    if (MOCK) return Promise.resolve({})
    try {
      // Body style
      return await api.post('/favorites', { property_id: propertyId })
    } catch (err) {
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        // Path style
        return api.post(`/favorites/${propertyId}`)
      }
      throw err
    }
  },
  remove: (propertyId) => MOCK ? Promise.resolve({}) : api.delete(`/favorites/${propertyId}`),
  // Toggle convenience wrapper: try POST first, if 409 then DELETE. Avoid re-adding if delete fails.
  toggle: async (propertyId) => {
    if (MOCK) return Promise.resolve({})
    try {
      // Try body-style POST first
      return await api.post('/favorites', { property_id: propertyId })
    } catch (err) {
      const status = err?.response?.status
      if (status === 409) {
        // Already favorited -> try remove; if removal fails, surface error (do not re-add)
        return api.delete(`/favorites/${propertyId}`)
      }
      if (status === 404 || status === 405) {
        // Backend uses path style -> try POST path, and if conflict then DELETE
        try {
          return await api.post(`/favorites/${propertyId}`)
        } catch (err2) {
          if (err2?.response?.status === 409) {
            return api.delete(`/favorites/${propertyId}`)
          }
          throw err2
        }
      }
      throw err
    }
  },
  count: async () => {
    if (MOCK) return Promise.resolve({ data: { favorites_count: 0 }})
    try {
      return await api.get('/favorites/count')
    } catch (err) {
      if (err?.response?.status === 404) {
        return api.get('/favorites/user/count')
      }
      throw err
    }
  },
  clear: () => MOCK ? Promise.resolve({}) : api.delete('/favorites/clear')
}

// Agent AI (FastAPI) microservice
const agentClient = axios.create({ baseURL: AGENT_API_BASE, headers: { 'Content-Type': 'application/json' }})

export const agentApi = {
  conciergeAgent: (payload) => agentClient.post('/concierge-agent', payload)
}
