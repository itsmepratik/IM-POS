import { useState, useCallback, useEffect } from "react"

export interface UserType {
  id: string
  name: string
  email: string
  role: string
  lastActive: string
}

/**
 * Custom React hook for managing users in the settings.
 * Provides functions to fetch, add, update, and delete users,
 * as well as state for the current users, loading status, and any errors.
 *
 * @returns {Object} An object containing the following properties and methods:
 *   @property {UserType[]} users - The current list of users.
 *   @property {boolean} isLoading - Indicates whether user data is being loaded.
 *   @property {Error|null} error - Any error that occurred during operations.
 *   @property {Function} addUser - Async function to add a new user.
 *   @property {Function} updateUser - Async function to update an existing user.
 *   @property {Function} deleteUser - Async function to delete a user.
 *   @property {Function} refreshUsers - Function to refresh the user list.
 */
export function useSettingsUsers() {
  const [users, setUsers] = useState<UserType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Function to fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // First try to load from localStorage
      const savedUsers = localStorage.getItem("settingsUsers")
      
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
          id: "1",
          name: "Admin User",
          email: "admin@example.com",
          role: "admin",
          lastActive: "2023-03-15T10:30:00Z"
        },
        {
          id: "2",
          name: "Store Manager",
          email: "manager@example.com",
          role: "manager",
          lastActive: "2023-03-15T09:45:00Z"
        },
        {
          id: "3",
          name: "Staff Member",
          email: "staff@example.com",
          role: "staff",
          lastActive: "2023-03-15T08:15:00Z"
        }
      ]
      
      setUsers(initialData)
      
      // Save to localStorage
      localStorage.setItem("settingsUsers", JSON.stringify(initialData))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Function to add a user
  const addUser = useCallback(async (user: Omit<UserType, "id" | "lastActive">) => {
    try {
      const newUser: UserType = {
        ...user,
        id: `${Date.now()}`,
        lastActive: new Date().toISOString()
      }
      
      const updatedUsers = [...users, newUser]
      setUsers(updatedUsers)
      
      // Save to localStorage
      localStorage.setItem("settingsUsers", JSON.stringify(updatedUsers))
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
      localStorage.setItem("settingsUsers", JSON.stringify(updatedUsers))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update user'))
      return false
    }
  }, [users])

  // Function to delete a user
  const deleteUser = useCallback(async (userId: string) => {
    try {
      const updatedUsers = users.filter(u => u.id !== userId)
      setUsers(updatedUsers)
      
      // Save to localStorage
      localStorage.setItem("settingsUsers", JSON.stringify(updatedUsers))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete user'))
      return false
    }
  }, [users])

  // Fetch data on mount
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    isLoading,
    error,
    addUser,
    updateUser,
    deleteUser,
    refreshUsers: fetchUsers
  }
} 