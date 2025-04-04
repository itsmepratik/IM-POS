"use client"

import { useState, useEffect, useCallback } from "react"

export interface UserType {
  id: string
  name: string
  role: string
  email: string
  phone: string
  status: "active" | "inactive"
  lastActive?: string
  permissions?: string[]
  avatar?: string
}

export function useUsers() {
  const [users, setUsers] = useState<UserType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Function to fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // First try to load from localStorage
      const savedUsers = localStorage.getItem("users")
      
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers))
        setIsLoading(false)
        return
      }
      
      // If no localStorage data, simulate a fetch from future DB
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Initial users data
      const initialData: UserType[] = [
        {
          id: "user1",
          name: "Ahmed Al-Balushi",
          role: "Manager",
          email: "ahmed@hautomotives.com",
          phone: "+968 9123 4567",
          status: "active",
          lastActive: "Online now",
          permissions: ["dashboard", "inventory", "sales", "reports", "settings", "users"],
          avatar: "/avatars/user1.png"
        },
        {
          id: "user2",
          name: "Mohammed Al-Farsi",
          role: "Sales Associate",
          email: "mohammed@hautomotives.com",
          phone: "+968 9234 5678",
          status: "active",
          lastActive: "1 hour ago", 
          permissions: ["inventory", "sales"],
          avatar: "/avatars/user2.png"
        },
        {
          id: "user3",
          name: "Fatima Al-Zadjali",
          role: "Accountant",
          email: "fatima@hautomotives.com",
          phone: "+968 9345 6789",
          status: "inactive",
          lastActive: "2 days ago",
          permissions: ["dashboard", "reports", "sales"],
          avatar: "/avatars/user3.png"
        },
        {
          id: "user4",
          name: "Khalid Al-Habsi",
          role: "Inventory Manager",
          email: "khalid@hautomotives.com", 
          phone: "+968 9456 7890",
          status: "active",
          lastActive: "5 hours ago",
          permissions: ["inventory", "reports"],
          avatar: "/avatars/user4.png"
        }
      ]
      
      setUsers(initialData)
      
      // Save to localStorage
      localStorage.setItem("users", JSON.stringify(initialData))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch data on mount
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])
  
  // Function to add a user
  const addUser = useCallback(async (user: Omit<UserType, 'id'>) => {
    try {
      const newUser: UserType = {
        ...user,
        id: `user${Date.now()}`
      }
      
      const updatedUsers = [...users, newUser]
      setUsers(updatedUsers)
      
      // Save to localStorage
      localStorage.setItem("users", JSON.stringify(updatedUsers))
      return newUser
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add user'))
      return null
    }
  }, [users])
  
  // Function to update a user
  const updateUser = useCallback(async (user: UserType) => {
    try {
      const updatedUsers = users.map(u => 
        u.id === user.id ? user : u
      )
      
      setUsers(updatedUsers)
      
      // Save to localStorage
      localStorage.setItem("users", JSON.stringify(updatedUsers))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update user'))
      return false
    }
  }, [users])
  
  // Function to delete a user
  const deleteUser = useCallback(async (id: string) => {
    try {
      const updatedUsers = users.filter(user => user.id !== id)
      setUsers(updatedUsers)
      
      // Save to localStorage
      localStorage.setItem("users", JSON.stringify(updatedUsers))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete user'))
      return false
    }
  }, [users])

  return {
    users,
    isLoading,
    error,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser
  }
} 