import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { bookingApi } from '../services/api'

// Async thunk to create a booking
export const createBooking = createAsyncThunk(
  'travelerBookings/create',
  async (payload) => {
    const res = await bookingApi.create(payload)
    return res.data?.booking || res.data || {}
  }
)

// Async thunk to fetch traveler bookings
export const fetchTravelerBookings = createAsyncThunk(
  'travelerBookings/fetch',
  async (params = {}) => {
    const res = await bookingApi.listTraveler(params)
    return res.data?.bookings || []
  }
)

// Async thunk to cancel a booking
export const cancelBooking = createAsyncThunk(
  'travelerBookings/cancel',
  async ({ id, reason }) => {
    await bookingApi.cancel(id, reason)
    return id
  }
)

const travelerBookingSlice = createSlice({
  name: 'travelerBookings',
  initialState: {
    items: [],
    currentBooking: null, // Current booking being created/viewed
    status: 'idle',
    error: null
  },
  reducers: {
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload
    },
    clearCurrentBooking: (state) => {
      state.currentBooking = null
    },
    updateBookingStatus: (state, action) => {
      const { id, status } = action.payload
      const booking = state.items.find(b => b.id === id)
      if (booking) {
        booking.status = status
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Create booking
      .addCase(createBooking.pending, (state) => {
        state.status = 'creating'
        state.error = null
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items.unshift(action.payload)
        state.currentBooking = action.payload
        state.error = null
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
      
      // Fetch bookings
      .addCase(fetchTravelerBookings.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchTravelerBookings.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
        state.error = null
      })
      .addCase(fetchTravelerBookings.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
      
      // Cancel booking
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const bookingId = action.payload
        const booking = state.items.find(b => b.id === bookingId)
        if (booking) {
          booking.status = 'Cancelled'
        }
      })
  }
})

export const {
  setCurrentBooking,
  clearCurrentBooking,
  updateBookingStatus
} = travelerBookingSlice.actions

// Selectors
export const selectTravelerBookings = (state) => state.travelerBookings?.items || []
export const selectCurrentBooking = (state) => state.travelerBookings?.currentBooking
export const selectTravelerBookingsStatus = (state) => state.travelerBookings?.status
export const selectTravelerBookingsError = (state) => state.travelerBookings?.error
export const selectBookingById = (id) => (state) =>
  state.travelerBookings?.items.find(b => b.id === id)
export const selectPendingBookings = (state) =>
  state.travelerBookings?.items.filter(b => b.status?.toLowerCase() === 'pending') || []
export const selectUpcomingBookings = (state) =>
  state.travelerBookings?.items.filter(b => 
    b.status?.toLowerCase() === 'accepted' && new Date(b.check_in_date) > new Date()
  ) || []

export default travelerBookingSlice.reducer
