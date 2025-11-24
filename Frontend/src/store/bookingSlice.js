import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { bookingApi } from '../services/api'

export const fetchOwnerBookings = createAsyncThunk('bookings/fetchOwner', async (_, thunkAPI) => {
  const res = await bookingApi.listOwnerRequests()
  return res.data.bookings || []
})

export const acceptBooking = createAsyncThunk('bookings/accept', async (id, thunkAPI) => {
  await bookingApi.accept(id)
  return id
})

export const rejectBooking = createAsyncThunk('bookings/reject', async ({ id, reason }, thunkAPI) => {
  await bookingApi.reject(id, reason)
  return id
})

const bookingSlice = createSlice({
  name: 'bookings',
  initialState: { ownerBookings: [], status: 'idle' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOwnerBookings.pending, (state) => { state.status = 'loading' })
      .addCase(fetchOwnerBookings.fulfilled, (state, action) => { state.status = 'succeeded'; state.ownerBookings = action.payload })
      .addCase(fetchOwnerBookings.rejected, (state) => { state.status = 'failed' })
      .addCase(acceptBooking.fulfilled, (state, action) => {
        state.ownerBookings = state.ownerBookings.map(b => b.id === action.payload ? { ...b, status: 'Accepted' } : b)
      })
      .addCase(rejectBooking.fulfilled, (state, action) => {
        state.ownerBookings = state.ownerBookings.map(b => b.id === action.payload ? { ...b, status: 'Rejected' } : b)
      })
  }
})

export default bookingSlice.reducer
