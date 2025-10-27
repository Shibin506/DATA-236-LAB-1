import React, { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../services/api'

const normalizeUser = (u) => {
  if (!u) return u
  return { ...u, role: u.role || u.user_type }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const sess = await authApi.sessionInfo()
        if (!sess?.authenticated) {
          if (mounted) setUser(null)
          return
        }
        const { data } = await authApi.me()
        if (mounted) setUser(normalizeUser(data.user) || null)
      } catch (e) {
        if (mounted) setUser(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    init()
    return () => { mounted = false }
  }, [])

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password })
    setUser(normalizeUser(data.user))
  }
  const logout = async () => {
    try {
      await authApi.logout()
    } catch (e) {
      // Even if the API call fails (e.g., session already gone), force client logout state
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
