import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { bookingApi } from '../services/api'

export const createBooking = createAsyncThunk('travelerBookings/create', async (payload) => {
  const res = await bookingApi.create(payload)
  return res.data?.booking || res.data || {}
})

export const fetchTravelerBookings = createAsyncThunk('travelerBookings/fetch', async (params) => {
  const res = await bookingApi.listTraveler(params)
  return res.data?.bookings || []
})

const travelerBookingSlice = createSlice({
  name: 'travelerBookings',
  initialState: { items: [], status: 'idle' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createBooking.pending, (state) => { state.status = 'creating' })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items.unshift(action.payload)
      })
      .addCase(fetchTravelerBookings.pending, (state) => { state.status = 'loading' })
      .addCase(fetchTravelerBookings.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload })
      .addCase(fetchTravelerBookings.rejected, (state) => { state.status = 'failed' })
  }
})

export default travelerBookingSlice.reducer
