import React, { createContext, useContext, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { login as loginThunk, logout as logoutThunk } from '../store/authSlice'

const normalizeUser = (u) => {
  if (!u) return u
  return { ...u, role: u.role || u.user_type }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const dispatch = useDispatch()
  const authState = useSelector(state => state.auth || {})
  const { user, status } = authState

  useEffect(() => {
    // If you want to perform an initial session check against the backend,
    // we could dispatch an action here. For now, rely on persisted auth token
    // and `authApi.me` if needed elsewhere.
  }, [])

  const login = async (email, password) => {
    await dispatch(loginThunk({ email, password }))
  }
  const logout = async () => {
    await dispatch(logoutThunk())
  }

  return (
    <AuthContext.Provider value={{ user, loading: status === 'loading', login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
