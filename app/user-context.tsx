"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export type UserRole = "admin" | "manager" | "staff"

interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

interface UserContextType {
  currentUser: User | null
  users: User[]
  supabaseUser: SupabaseUser | null
  setCurrentUser: (user: User | null) => void
  addUser: (user: Omit<User, "id">) => void
  updateUser: (id: string, user: Partial<User>) => void
  deleteUser: (id: string) => void
  signOut: () => Promise<void>
  isLoading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  
  // Mock users for backward compatibility
  const [users, setUsers] = useState<User[]>([
    { id: "1", name: "Admin User", email: "admin@example.com", role: "admin" },
    { id: "2", name: "Manager User", email: "manager@example.com", role: "manager" },
    { id: "3", name: "Staff User", email: "staff@example.com", role: "staff" },
  ])

  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setSupabaseUser(user)
        
        if (user) {
          // Map Supabase user to our User interface
          // For now, we'll use a default role of "admin" - you can extend this later
          const mappedUser: User = {
            id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || "User",
            email: user.email || "",
            role: user.user_metadata?.role || "admin" // Default to admin, extend later
          }
          setCurrentUser(mappedUser)
        } else {
          setCurrentUser(null)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        setSupabaseUser(null)
        setCurrentUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setSupabaseUser(session.user)
          const mappedUser: User = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "User",
            email: session.user.email || "",
            role: session.user.user_metadata?.role || "admin"
          }
          setCurrentUser(mappedUser)
        } else {
          setSupabaseUser(null)
          setCurrentUser(null)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const addUser = (newUser: Omit<User, "id">) => {
    setUsers((prevUsers) => [...prevUsers, { ...newUser, id: Date.now().toString() }])
  }

  const updateUser = (id: string, updatedUser: Partial<User>) => {
    setUsers((prevUsers) => prevUsers.map((user) => (user.id === id ? { ...user, ...updatedUser } : user)))
  }

  const deleteUser = (id: string) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id))
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setCurrentUser(null)
      setSupabaseUser(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <UserContext.Provider 
      value={{ 
        currentUser, 
        users, 
        supabaseUser, 
        setCurrentUser, 
        addUser, 
        updateUser, 
        deleteUser, 
        signOut, 
        isLoading 
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

