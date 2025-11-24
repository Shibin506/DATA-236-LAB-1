import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { propertyApi } from '../services/api'

// Async thunk to fetch property list (search)
export const fetchProperties = createAsyncThunk(
  'properties/fetch',
  async (params = {}) => {
    const res = await propertyApi.search(params)
    const properties = res.data?.properties || []
    return { properties, params }
  }
)

// Async thunk to fetch single property details
export const fetchPropertyDetails = createAsyncThunk(
  'properties/fetchDetails',
  async (propertyId) => {
    const res = await propertyApi.getById(propertyId)
    return res.data?.property || res.data || {}
  }
)

// Async thunk to get price quote
export const fetchPriceQuote = createAsyncThunk(
  'properties/fetchPriceQuote',
  async ({ propertyId, checkIn, checkOut }) => {
    const res = await propertyApi.priceQuote(propertyId, checkIn, checkOut)
    return { propertyId, quote: res.data }
  }
)

const propertiesSlice = createSlice({
  name: 'properties',
  initialState: {
    items: [],
    searchParams: {},
    selectedProperty: null,
    propertyCache: {}, // Cache for property details by ID
    priceQuotes: {}, // Cache for price quotes
    status: 'idle',
    error: null,
    filters: {
      location: '',
      minPrice: null,
      maxPrice: null,
      guests: null,
      propertyType: null
    }
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = {
        location: '',
        minPrice: null,
        maxPrice: null,
        guests: null,
        propertyType: null
      }
    },
    setSelectedProperty: (state, action) => {
      state.selectedProperty = action.payload
    },
    clearSelectedProperty: (state) => {
      state.selectedProperty = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch properties list
      .addCase(fetchProperties.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload.properties
        state.searchParams = action.payload.params
        state.error = null
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
      
      // Fetch property details
      .addCase(fetchPropertyDetails.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchPropertyDetails.fulfilled, (state, action) => {
        state.status = 'succeeded'
        const property = action.payload
        if (property && property.id) {
          state.propertyCache[property.id] = property
          state.selectedProperty = property
        }
        state.error = null
      })
      .addCase(fetchPropertyDetails.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
      
      // Fetch price quote
      .addCase(fetchPriceQuote.fulfilled, (state, action) => {
        const { propertyId, quote } = action.payload
        state.priceQuotes[propertyId] = quote
      })
  }
})

export const {
  setFilters,
  clearFilters,
  setSelectedProperty,
  clearSelectedProperty
} = propertiesSlice.actions

// Selectors
export const selectProperties = (state) => state.properties?.items || []
export const selectSelectedProperty = (state) => state.properties?.selectedProperty
export const selectPropertyById = (id) => (state) => 
  state.properties?.propertyCache[id] || state.properties?.items.find(p => p.id === id)
export const selectPropertiesStatus = (state) => state.properties?.status
export const selectPropertiesError = (state) => state.properties?.error
export const selectFilters = (state) => state.properties?.filters
export const selectPriceQuote = (propertyId) => (state) => 
  state.properties?.priceQuotes[propertyId]

export default propertiesSlice.reducer
