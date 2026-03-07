import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

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
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AUTH_KEY = 'aria-quant-auth'

const DEMO_USERS: Record<string, { password: string; user: User }> = {
  'demo@ariaquant.com': {
    password: 'demo123',
    user: {
      id: 'usr_demo_001',
      email: 'demo@ariaquant.com',
      name: 'Demo Trader',
      avatar: 'DT',
      plan: 'pro',
      joinedAt: '2024-01-15',
    },
  },
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

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800))

    const entry = DEMO_USERS[email.toLowerCase()]
    if (entry && entry.password === password) {
      setUser(entry.user)
      localStorage.setItem(AUTH_KEY, JSON.stringify(entry.user))
      return true
    }

    // Accept any email/password for demo — create user on the fly
    const newUser: User = {
      id: `usr_${Date.now()}`,
      email: email.toLowerCase(),
      name: email.split('@')[0],
      avatar: email.substring(0, 2).toUpperCase(),
      plan: 'free',
      joinedAt: new Date().toISOString().split('T')[0],
    }
    setUser(newUser)
    localStorage.setItem(AUTH_KEY, JSON.stringify(newUser))
    return true
  }, [])

  const register = useCallback(async (name: string, email: string, _password: string): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 800))

    const newUser: User = {
      id: `usr_${Date.now()}`,
      email: email.toLowerCase(),
      name,
      avatar: name.substring(0, 2).toUpperCase(),
      plan: 'free',
      joinedAt: new Date().toISOString().split('T')[0],
    }
    setUser(newUser)
    localStorage.setItem(AUTH_KEY, JSON.stringify(newUser))
    return true
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(AUTH_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
