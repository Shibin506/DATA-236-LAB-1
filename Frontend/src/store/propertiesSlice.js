import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { propertyApi } from '../services/api'

export const fetchProperties = createAsyncThunk('properties/fetch', async (params) => {
  const res = await propertyApi.search(params)
  const properties = res.data?.properties || []
  return properties
})

const propertiesSlice = createSlice({
  name: 'properties',
  initialState: { items: [], status: 'idle' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProperties.pending, (state) => { state.status = 'loading' })
      .addCase(fetchProperties.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload })
      .addCase(fetchProperties.rejected, (state) => { state.status = 'failed' })
  }
})

export default propertiesSlice.reducer
