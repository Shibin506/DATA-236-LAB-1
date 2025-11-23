import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authApi, setAuthToken } from '../services/api'

export const login = createAsyncThunk('auth/login', async (payload, thunkAPI) => {
  const res = await authApi.login(payload)
  // res: { data: { user, token? } } based on backend shapes
  const data = res.data || {}
  const token = data.token || data.auth_token || data.accessToken || (data.user && data.user.token)
  const user = data.user || null
  return { token, user }
})

export const logout = createAsyncThunk('auth/logout', async (_, thunkAPI) => {
  try { await authApi.logout() } catch (err) { /* ignore */ }
  return {}
})

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: null, user: null, status: 'idle' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.status = 'loading' })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.token = action.payload.token || null
        state.user = action.payload.user || null
        if (state.token) setAuthToken(state.token)
      })
      .addCase(login.rejected, (state) => { state.status = 'failed' })
      .addCase(logout.fulfilled, (state) => {
        state.token = null
        state.user = null
        setAuthToken(null)
      })
  }
})

export default authSlice.reducer
