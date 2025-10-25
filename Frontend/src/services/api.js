import axios from 'axios'

// Base API URL - should point to backend server root (include /api prefix to match backend)
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'
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
// Auth endpoints (backend):
// POST /api/auth/register         -> register user (name,email,password,user_type,phone)
// POST /api/auth/login            -> login (email,password)
// POST /api/auth/logout           -> logout
// GET  /api/auth/me               -> current user

export const authApi = {
  // register both traveler and owner; backend expects user_type field
  signup: (payload) => MOCK ? Promise.resolve({ data: { user: null }}) : api.post('/auth/register', payload),
  login: (payload) => MOCK ? Promise.resolve({ data: { user: { id: 1, name: 'Mock User', email: payload.email, user_type: payload.user_type || 'traveler' }}}) : api.post('/auth/login', payload),
  logout: () => MOCK ? Promise.resolve({}) : api.post('/auth/logout'),
  me: () => MOCK ? Promise.resolve({ data: { user: null }}) : api.get('/auth/me'),
  changePassword: (payload) => api.post('/auth/change-password', payload)
}

// Users endpoints (backend):
// GET  /api/users/profile
// PUT  /api/users/profile
// POST /api/users/upload-profile-picture (multipart/form-data)
// DELETE /api/users/profile-picture

export const userApi = {
  getProfile: () => MOCK ? Promise.resolve({ data: { user: { name:'Mock', email:'mock@example.com' }}}) : api.get('/users/profile'),
  updateProfile: (payload) => MOCK ? Promise.resolve({ data: { user: payload }}) : api.put('/users/profile', payload),
  uploadAvatar: (file) => {
    const form = new FormData()
    form.append('profile_picture', file)
    return MOCK ? Promise.resolve({}) : api.post('/users/upload-profile-picture', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  deleteAvatar: () => MOCK ? Promise.resolve({}) : api.delete('/users/profile-picture')
}

// Properties endpoints (backend):
// GET /api/properties/search
// GET /api/properties/:id
// POST /api/properties
// PUT  /api/properties/:id

export const propertyApi = {
  search: (params) => MOCK ? Promise.resolve({ data: { properties: [
    { id: 1, name: 'Cozy Studio', city: 'San Jose', state: 'CA', country: 'US', price_per_night: 120, coverImage: '/placeholder.svg' },
    { id: 2, name: 'Modern Loft', city: 'San Francisco', state: 'CA', country: 'US', price_per_night: 220, coverImage: '/placeholder.svg' },
  ] } }) : api.get('/properties/search', { params }),
  details: (id) => MOCK ? Promise.resolve({ data: { property: { id, name:'Mock Home', location:'Somewhere', description:'A nice place', property_type:'Apartment', bedrooms:1, bathrooms:1, amenities:['Wifi'], price_per_night:100 } } }) : api.get(`/properties/${id}`),
  add: (payload) => MOCK ? Promise.resolve({ data: { id: Date.now(), ...payload }}) : api.post('/properties', payload),
  update: (id, payload) => MOCK ? Promise.resolve({ data: { id, ...payload }}) : api.put(`/properties/${id}`, payload),
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
  listTraveler: (params) => MOCK ? Promise.resolve({ data: { bookings: [] }}) : api.get('/bookings/traveler/my-bookings', { params }),
  listOwnerRequests: (params) => MOCK ? Promise.resolve({ data: { bookings: [] }}) : api.get('/bookings/owner/incoming-requests', { params }),
  get: (id) => api.get(`/bookings/${id}`),
  accept: (id) => api.patch(`/bookings/${id}/accept`),
  reject: (id) => api.patch(`/bookings/${id}/reject`),
  cancel: (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason })
}

// Favorites endpoints (backend):
// GET    /api/favorites
// POST   /api/favorites           (body: { property_id })
// DELETE /api/favorites/:propertyId
// GET    /api/favorites/check/:propertyId
// GET    /api/favorites/count

export const favoriteApi = {
  list: () => MOCK ? Promise.resolve({ data: { favorites: [] }}) : api.get('/favorites'),
  check: (propertyId) => MOCK ? Promise.resolve({ data: { is_favorited: false }}) : api.get(`/favorites/check/${propertyId}`),
  add: (propertyId) => MOCK ? Promise.resolve({}) : api.post('/favorites', { property_id: propertyId }),
  remove: (propertyId) => MOCK ? Promise.resolve({}) : api.delete(`/favorites/${propertyId}`),
  // Toggle convenience wrapper: checks current status then add/remove
  toggle: async (propertyId) => {
    if (MOCK) return Promise.resolve({})
    try {
      const { data } = await api.get(`/favorites/check/${propertyId}`)
      if (data && data.is_favorited) {
        return api.delete(`/favorites/${propertyId}`)
      }
      return api.post('/favorites', { property_id: propertyId })
    } catch (err) {
      // If check fails, attempt add (best-effort)
      return api.post('/favorites', { property_id: propertyId })
    }
  }
}

// Agent AI (FastAPI) microservice
const agentClient = axios.create({ baseURL: AGENT_API_BASE, headers: { 'Content-Type': 'application/json' }})

export const agentApi = {
  conciergeAgent: (payload) => agentClient.post('/concierge-agent', payload)
}
