import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { auth as authApi, setToken, getToken } from '@/services/api'
import type { ApiUser } from '@/services/api'

export interface User {
  id: string
  email: string
  name: string
  avatar: string
  plan: 'free' | 'pro' | 'enterprise'
  joinedAt: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  forgotPassword: (email: string) => Promise<string>
  resetPassword: (data: { token: string; email: string; password: string; password_confirmation: string }) => Promise<string>
  updateProfile: (data: Partial<{ name: string; avatar: string; theme: string }>) => Promise<void>
}

const AUTH_KEY = 'aria-quant-auth'

function apiUserToLocal(u: ApiUser): User {
  return {
    id: String(u.id),
    email: u.email,
    name: u.name,
    avatar: u.avatar || u.name.substring(0, 2).toUpperCase(),
    plan: u.plan,
    joinedAt: u.joined_at,
  }
}

function loadAuth(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadAuth)
  const [loading, setLoading] = useState(!!getToken())

  // On mount, if we have a token, validate it
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }

    authApi.me()
      .then((res) => {
        const u = apiUserToLocal(res.user)
        setUser(u)
        localStorage.setItem(AUTH_KEY, JSON.stringify(u))
      })
      .catch(() => {
        // Token invalid — clear auth
        setToken(null)
        setUser(null)
        localStorage.removeItem(AUTH_KEY)
      })
      .finally(() => setLoading(false))
  }, [])

  // Listen for forced logout (401 from API)
  useEffect(() => {
    const handler = () => {
      setUser(null)
      localStorage.removeItem(AUTH_KEY)
    }
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await authApi.login({ email, password })
      const u = apiUserToLocal(res.user)
      setUser(u)
      localStorage.setItem(AUTH_KEY, JSON.stringify(u))
      return true
    } catch {
      return false
    }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await authApi.register({
        name,
        email,
        password,
        password_confirmation: password,
      })
      const u = apiUserToLocal(res.user)
      setUser(u)
      localStorage.setItem(AUTH_KEY, JSON.stringify(u))
      return true
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch { /* ignore */ }
    setUser(null)
    localStorage.removeItem(AUTH_KEY)
  }, [])

  const forgotPassword = useCallback(async (email: string): Promise<string> => {
    const res = await authApi.forgotPassword(email)
    return res.message
  }, [])

  const resetPassword = useCallback(async (data: { token: string; email: string; password: string; password_confirmation: string }): Promise<string> => {
    const res = await authApi.resetPassword(data)
    return res.message
  }, [])

  const updateProfile = useCallback(async (data: Partial<{ name: string; avatar: string; theme: string }>) => {
    const res = await authApi.updateProfile(data)
    const u = apiUserToLocal(res.user)
    setUser(u)
    localStorage.setItem(AUTH_KEY, JSON.stringify(u))
  }, [])

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, loading,
      login, register, logout, forgotPassword, resetPassword, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
