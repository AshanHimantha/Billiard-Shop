"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type User = {
  username: string
  role: "admin" | "cashier"
}

type AuthContextType = {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored authentication on mount
    const storedUser = localStorage.getItem("billiard-user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Failed to parse stored user:", error)
        localStorage.removeItem("billiard-user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    // In a real app, this would be an API call
    let role: "admin" | "cashier" | null = null

    if (username === "admin" && password === "admin123") {
      role = "admin"
    } else if (username === "cashier" && password === "cashier123") {
      role = "cashier"
    }

    if (role) {
      const userData = { username, role }
      setUser(userData)
      localStorage.setItem("billiard-user", JSON.stringify(userData))
      
      // Redirect based on role
      const redirectTo = role === "admin" ? "/admin/stations" : "/cashier/active"
      router.push(redirectTo)
      
      return true
    }

    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("billiard-user")
    router.push("/")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}