"use client"

import { useState, useEffect, useCallback } from "react"

export interface Branch {
  id: string
  name: string
  location?: string
  manager?: string
  phone?: string
  email?: string
}

export function useBranchData() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Function to fetch branches
  const fetchBranches = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // First try to load from localStorage
      const savedBranches = localStorage.getItem("branches")
      
      if (savedBranches) {
        setBranches(JSON.parse(savedBranches))
        setIsLoading(false)
        return
      }
      
      // If no localStorage data, simulate a fetch from future DB
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Initial branches data
      const initialData: Branch[] = [
        { 
          id: "main", 
          name: "Main (Sanaya)", 
          location: "Muscat", 
          manager: "Ahmed Al-Balushi", 
          phone: "+968 9123 4567", 
          email: "main@hautomotives.com" 
        },
        { 
          id: "branch1", 
          name: "Hafith", 
          location: "Saham", 
          manager: "Mohammed Al-Farsi", 
          phone: "+968 9234 5678", 
          email: "saham@hautomotives.com" 
        },
        { 
          id: "branch2", 
          name: "Abu-Dhurus", 
          location: "Sohar", 
          manager: "Fatima Al-Zadjali", 
          phone: "+968 9345 6789", 
          email: "sohar@hautomotives.com" 
        },
      ]
      
      setBranches(initialData)
      
      // Save to localStorage
      localStorage.setItem("branches", JSON.stringify(initialData))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch data on mount
  useEffect(() => {
    fetchBranches()
  }, [fetchBranches])
  
  // Function to add a branch
  const addBranch = useCallback(async (branch: Branch) => {
    try {
      const updatedBranches = [...branches, branch]
      setBranches(updatedBranches)
      
      // Save to localStorage
      localStorage.setItem("branches", JSON.stringify(updatedBranches))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add branch'))
      return false
    }
  }, [branches])
  
  // Function to update a branch
  const updateBranch = useCallback(async (branch: Branch) => {
    try {
      const updatedBranches = branches.map(b => 
        b.id === branch.id ? branch : b
      )
      
      setBranches(updatedBranches)
      
      // Save to localStorage
      localStorage.setItem("branches", JSON.stringify(updatedBranches))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update branch'))
      return false
    }
  }, [branches])
  
  // Function to delete a branch
  const deleteBranch = useCallback(async (id: string) => {
    try {
      // Don't allow deleting the main branch
      if (id === "main") return false
      
      const updatedBranches = branches.filter(branch => branch.id !== id)
      setBranches(updatedBranches)
      
      // Save to localStorage
      localStorage.setItem("branches", JSON.stringify(updatedBranches))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete branch'))
      return false
    }
  }, [branches])

  return {
    branches,
    isLoading,
    error,
    fetchBranches,
    addBranch,
    updateBranch,
    deleteBranch
  }
} 