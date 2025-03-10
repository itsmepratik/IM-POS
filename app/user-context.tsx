"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

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
  setCurrentUser: (user: User | null) => void
  addUser: (user: Omit<User, "id">) => void
  updateUser: (id: string, user: Partial<User>) => void
  deleteUser: (id: string) => void
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
  const [users, setUsers] = useState<User[]>([
    { id: "1", name: "Admin User", email: "admin@example.com", role: "admin" },
    { id: "2", name: "Manager User", email: "manager@example.com", role: "manager" },
    { id: "3", name: "Staff User", email: "staff@example.com", role: "staff" },
  ])

  useEffect(() => {
    // Simulating user authentication
    setCurrentUser(users[0]) // Set the admin user as the current user for demonstration
  }, [users]) // Added users to the dependency array

  const addUser = (newUser: Omit<User, "id">) => {
    setUsers((prevUsers) => [...prevUsers, { ...newUser, id: Date.now().toString() }])
  }

  const updateUser = (id: string, updatedUser: Partial<User>) => {
    setUsers((prevUsers) => prevUsers.map((user) => (user.id === id ? { ...user, ...updatedUser } : user)))
  }

  const deleteUser = (id: string) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id))
  }

  return (
    <UserContext.Provider value={{ currentUser, users, setCurrentUser, addUser, updateUser, deleteUser }}>
      {children}
    </UserContext.Provider>
  )
}

