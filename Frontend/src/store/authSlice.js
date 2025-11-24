import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authApi, setAuthToken } from '../services/api'

// Async thunk for login
export const login = createAsyncThunk('auth/login', async (payload, thunkAPI) => {
  const res = await authApi.login(payload)
  const data = res.data || {}
  const token = data.token || data.auth_token || data.accessToken || (data.user && data.user.token)
  let user = data.user || null
  // Normalize user_type to role for frontend consistency
  if (user && user.user_type) {
    user = { ...user, role: user.user_type }
  }
  return { token, user }
})

// Async thunk for signup
export const signup = createAsyncThunk('auth/signup', async (payload, thunkAPI) => {
  const res = await authApi.signup(payload)
  const data = res.data || {}
  const token = data.token || data.auth_token || data.accessToken || (data.user && data.user.token)
  let user = data.user || null
  // Normalize user_type to role for frontend consistency
  if (user && user.user_type) {
    user = { ...user, role: user.user_type }
  }
  return { token, user }
})

// Async thunk for logout
export const logout = createAsyncThunk('auth/logout', async (_, thunkAPI) => {
  try { await authApi.logout() } catch (err) { /* ignore */ }
  return {}
})

// Async thunk to fetch current user profile
export const fetchUserProfile = createAsyncThunk('auth/fetchProfile', async (_, thunkAPI) => {
  const res = await authApi.getProfile()
  let user = res.data?.user || null
  if (user && user.user_type) {
    user = { ...user, role: user.user_type }
  }
  return user
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: null,
    user: null,
    status: 'idle',
    error: null,
    isAuthenticated: false
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.token = action.payload.token || null
        state.user = action.payload.user || null
        state.isAuthenticated = !!action.payload.token
        state.error = null
        if (state.token) setAuthToken(state.token)
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
        state.isAuthenticated = false
      })
      
      // Signup
      .addCase(signup.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.token = action.payload.token || null
        state.user = action.payload.user || null
        state.isAuthenticated = !!action.payload.token
        state.error = null
        if (state.token) setAuthToken(state.token)
      })
      .addCase(signup.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
        state.isAuthenticated = false
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.token = null
        state.user = null
        state.isAuthenticated = false
        state.status = 'idle'
        state.error = null
        setAuthToken(null)
      })
      
      // Fetch profile
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload
      })
  }
})

export const { clearError, updateUser } = authSlice.actions

// Selectors
export const selectAuth = (state) => state.auth
export const selectUser = (state) => state.auth?.user
export const selectToken = (state) => state.auth?.token
export const selectIsAuthenticated = (state) => state.auth?.isAuthenticated || false
export const selectUserRole = (state) => state.auth?.user?.role || state.auth?.user?.user_type
export const selectAuthStatus = (state) => state.auth?.status
export const selectAuthError = (state) => state.auth?.error

export default authSlice.reducer
