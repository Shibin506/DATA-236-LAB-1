import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { favoriteApi } from '../services/api'

// Async thunks for favorite operations
export const fetchFavorites = createAsyncThunk(
  'favorites/fetchAll',
  async (params = {}) => {
    const res = await favoriteApi.list(params)
    return res.data?.favorites || []
  }
)

export const addFavorite = createAsyncThunk(
  'favorites/add',
  async (propertyId) => {
    const res = await favoriteApi.add(propertyId)
    return res.data?.favorite || { property_id: propertyId }
  }
)

export const removeFavorite = createAsyncThunk(
  'favorites/remove',
  async (propertyId) => {
    await favoriteApi.remove(propertyId)
    return propertyId
  }
)

export const checkFavorite = createAsyncThunk(
  'favorites/check',
  async (propertyId) => {
    const res = await favoriteApi.check(propertyId)
    return { propertyId, isFavorite: res.data?.isFavorite || false }
  }
)

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: {
    items: [],
    favoriteIds: new Set(),
    status: 'idle',
    error: null
  },
  reducers: {
    clearFavorites: (state) => {
      state.items = []
      state.favoriteIds = new Set()
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch favorites
      .addCase(fetchFavorites.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
        state.favoriteIds = new Set(action.payload.map(f => f.property_id || f.id))
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
      
      // Add favorite
      .addCase(addFavorite.fulfilled, (state, action) => {
        const propertyId = action.payload.property_id || action.payload.id
        if (propertyId) {
          state.favoriteIds.add(propertyId)
          state.items.push(action.payload)
        }
      })
      
      // Remove favorite
      .addCase(removeFavorite.fulfilled, (state, action) => {
        const propertyId = action.payload
        state.favoriteIds.delete(propertyId)
        state.items = state.items.filter(f => (f.property_id || f.id) !== propertyId)
      })
      
      // Check favorite
      .addCase(checkFavorite.fulfilled, (state, action) => {
        const { propertyId, isFavorite } = action.payload
        if (isFavorite) {
          state.favoriteIds.add(propertyId)
        } else {
          state.favoriteIds.delete(propertyId)
        }
      })
  }
})

export const { clearFavorites } = favoritesSlice.actions

// Selectors
export const selectFavorites = (state) => state.favorites?.items || []
export const selectFavoriteIds = (state) => Array.from(state.favorites?.favoriteIds || new Set())
export const selectIsFavorite = (propertyId) => (state) => 
  state.favorites?.favoriteIds?.has(propertyId) || false
export const selectFavoritesStatus = (state) => state.favorites?.status || 'idle'

export default favoritesSlice.reducer
