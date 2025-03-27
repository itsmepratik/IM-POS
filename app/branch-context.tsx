"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"

export interface Branch {
  id: string
  name: string
  location?: string
  manager?: string
  phone?: string
  email?: string
}

interface BranchContextType {
  branches: Branch[]
  currentBranch: Branch | null
  setCurrentBranch: (branch: Branch) => void
  addBranch: (branch: Branch) => void
  updateBranch: (branch: Branch) => void
  deleteBranch: (id: string) => void
}

const BranchContext = createContext<BranchContextType | undefined>(undefined)

export const useBranch = () => {
  const context = useContext(BranchContext)
  if (!context) {
    throw new Error("useBranch must be used within a BranchProvider")
  }
  return context
}

export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mock branch data
  const initialBranches: Branch[] = [
    { id: "main", name: "Main (Sanaya)", location: "Muscat", manager: "Ahmed Al-Balushi", phone: "+968 9123 4567", email: "main@hautomotives.com" },
    { id: "branch1", name: "Hafith", location: "Saham", manager: "Mohammed Al-Farsi", phone: "+968 9234 5678", email: "saham@hautomotives.com" },
    { id: "branch2", name: "Abu-Dhurus", location: "Sohar", manager: "Fatima Al-Zadjali", phone: "+968 9345 6789", email: "sohar@hautomotives.com" },
  ]

  const [branches, setBranches] = useState<Branch[]>(initialBranches)
  const [currentBranch, setCurrentBranchState] = useState<Branch | null>(initialBranches[0])

  // Load branches from localStorage on mount
  useEffect(() => {
    const savedBranches = localStorage.getItem("branches")
    const savedCurrentBranch = localStorage.getItem("currentBranch")
    
    if (savedBranches) {
      setBranches(JSON.parse(savedBranches))
    }
    
    if (savedCurrentBranch) {
      setCurrentBranchState(JSON.parse(savedCurrentBranch))
    }
  }, [])

  // Save branches to localStorage when they change
  useEffect(() => {
    localStorage.setItem("branches", JSON.stringify(branches))
  }, [branches])

  // Save current branch to localStorage when it changes
  useEffect(() => {
    if (currentBranch) {
      localStorage.setItem("currentBranch", JSON.stringify(currentBranch))
    }
  }, [currentBranch])

  const setCurrentBranch = useCallback((branch: Branch) => {
    setCurrentBranchState(branch)
  }, [])

  const addBranch = useCallback((branch: Branch) => {
    setBranches(prev => [...prev, branch])
  }, [])

  const updateBranch = useCallback((branch: Branch) => {
    setBranches(prev => 
      prev.map(b => 
        b.id === branch.id ? branch : b
      )
    )
    
    // Update current branch if it's the one being updated
    if (currentBranch && currentBranch.id === branch.id) {
      setCurrentBranchState(branch)
    }
  }, [currentBranch])

  const deleteBranch = useCallback((id: string) => {
    // Don't allow deleting the main branch
    if (id === "main") return
    
    setBranches(prev => prev.filter(branch => branch.id !== id))
    
    // Reset current branch to main if the deleted branch is the current one
    if (currentBranch && currentBranch.id === id) {
      const mainBranch = branches.find(branch => branch.id === "main")
      if (mainBranch) {
        setCurrentBranchState(mainBranch)
      }
    }
  }, [branches, currentBranch])

  return (
    <BranchContext.Provider
      value={{
        branches,
        currentBranch,
        setCurrentBranch,
        addBranch,
        updateBranch,
        deleteBranch,
      }}
    >
      {children}
    </BranchContext.Provider>
  )
} 