import { useState, useCallback, useEffect } from "react"

export interface UserType {
  id: string
  name: string
  staff_id: string
  is_active: boolean
  lastActive?: string // Keep for UI compatibility if needed, using updated_at or null
}

export function useSettingsUsers() {
  const [users, setUsers] = useState<UserType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Function to fetch users from API
  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/staff');
      const result = await response.json();
      
      if (result.success) {
        setUsers((result.data as Array<{ id: string; name: string; staff_id: string; is_active: boolean; updated_at?: string | null }>).map((staff) => ({
          id: staff.id,
          name: staff.name,
          staff_id: staff.staff_id,
          is_active: staff.is_active,
          lastActive: staff.updated_at ?? undefined,
        })));
      } else {
        throw new Error(result.error || 'Failed to fetch staff');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Function to add a user
  const addUser = useCallback(async (user: { name: string, staff_id: string }) => {
    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      
      const result = await response.json();
      
      if (result.success) {
        const newUser = {
          id: result.data.id,
          name: result.data.name,
          staff_id: result.data.staff_id,
          is_active: result.data.is_active,
          lastActive: undefined
        };
        
        setUsers(prev => [...prev, newUser]);
        return newUser;
      } else {
        throw new Error(result.error || 'Failed to add user');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add user'))
      return null
    }
  }, [])

  // Function to update a user
  const updateUser = useCallback(async (user: UserType) => {
    try {
      const response = await fetch(`/api/staff/${user.staff_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          is_active: user.is_active
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setUsers(prev => prev.map(u => 
          u.staff_id === user.staff_id ? { ...u, ...user } : u
        ));
        return true;
      } else {
        throw new Error(result.error || 'Failed to update user');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update user'))
      return false
    }
  }, [])

  // Function to delete a user
  const deleteUser = useCallback(async (userId: string) => {
    // Note: userId here receives the ID from the UI. 
    // If the UI passes the UUID (user.id), we need to find the staff_id to call the API 
    // because our API route is /api/staff/[staff_id] (text ID).
    // However, looking at the UI code, it passes `user.id`.
    // Let's find the user in our state to get the staff_id.
    const user = users.find(u => u.id === userId);
    if (!user) return false;

    try {
      const response = await fetch(`/api/staff/${user.staff_id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Staff with sales/shift history are deactivated, not deleted.
        if (result.deactivated) {
          setUsers(prev => prev.map(u => (u.id === userId ? { ...u, is_active: false } : u)));
        } else {
          setUsers(prev => prev.filter(u => u.id !== userId));
        }
        return true;
      } else {
        throw new Error(result.error || 'Failed to delete user');
      }
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