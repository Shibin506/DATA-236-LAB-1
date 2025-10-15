import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'
const MOCK = String(import.meta.env.VITE_MOCK || '').toLowerCase() === 'true'

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

// Auth
export const authApi = {
  signupTraveler: (data) => MOCK ? Promise.resolve({ data: { success: true }}) : api.post('/auth/traveler/signup', data),
  signupOwner: (data) => MOCK ? Promise.resolve({ data: { success: true }}) : api.post('/auth/owner/signup', data),
  login: (data) => MOCK ? Promise.resolve({ data: { user: { id: 1, name: 'Mock User', email: data.email, role: data.role || 'traveler' }}}) : api.post('/auth/login', data),
  logout: () => MOCK ? Promise.resolve({}) : api.post('/auth/logout'),
  me: () => MOCK ? Promise.resolve({ data: { user: null }}) : api.get('/auth/me')
}

// Users
export const userApi = {
  getProfile: () => MOCK ? Promise.resolve({ data: { user: { name:'Mock', email:'mock@example.com' }}}) : api.get('/users/me'),
  updateProfile: (payload) => MOCK ? Promise.resolve({ data: { success: true }}) : api.put('/users/me', payload),
  uploadAvatar: (file) => {
    const form = new FormData()
    form.append('avatar', file)
    return MOCK ? Promise.resolve({}) : api.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

// Properties
export const propertyApi = {
  search: (params) => MOCK ? Promise.resolve({ data: { properties: [
    { id: 1, name: 'Cozy Studio', location: 'San Jose, CA', pricePerNight: 120, coverImage: '/placeholder.svg' },
    { id: 2, name: 'Modern Loft', location: 'San Francisco, CA', pricePerNight: 220, coverImage: '/placeholder.svg' },
  ] } }) : api.get('/properties/search', { params }),
  details: (id) => MOCK ? Promise.resolve({ data: { property: { id, name:'Mock Home', location:'Somewhere', description:'A nice place', type:'Apartment', bedrooms:1, bathrooms:1, amenities:['Wifi'], pricePerNight:100 } } }) : api.get(`/properties/${id}`),
  add: (payload) => MOCK ? Promise.resolve({ data: { id: Date.now(), ...payload }}) : api.post('/properties', payload),
  update: (id, payload) => MOCK ? Promise.resolve({ data: { id, ...payload }}) : api.put(`/properties/${id}`, payload),
}

// Bookings
export const bookingApi = {
  create: (payload) => MOCK ? Promise.resolve({ data: { id: 1, status: 'Pending', ...payload }}) : api.post('/bookings', payload),
  listTraveler: (status) => MOCK ? Promise.resolve({ data: { bookings: [] }}) : api.get('/bookings/traveler', { params: { status } }),
  listOwner: () => MOCK ? Promise.resolve({ data: { requests: [] }}) : api.get('/bookings/owner'),
  respond: (bookingId, action) => MOCK ? Promise.resolve({ data: { id: bookingId, status: action==='accept'?'Accepted':'Cancelled' }}) : api.post(`/bookings/${bookingId}/${action}`), // action: accept|cancel
}

// Favorites
export const favoriteApi = {
  toggle: (propertyId) => MOCK ? Promise.resolve({}) : api.post(`/favorites/${propertyId}/toggle`),
  list: () => MOCK ? Promise.resolve({ data: { favorites: [] }}) : api.get('/favorites')
}
