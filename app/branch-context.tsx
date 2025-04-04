"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { useBranchData, Branch } from "@/lib/hooks/data/useBranchData"

interface BranchContextType {
  branches: Branch[]
  currentBranch: Branch | null
  setCurrentBranch: (branch: Branch) => void
  addBranch: (branch: Branch) => void
  updateBranch: (branch: Branch) => void
  deleteBranch: (id: string) => void
  isLoading: boolean
}

const BranchContext = createContext<BranchContextType | undefined>(undefined)

export const useBranch = () => {
  const context = useContext(BranchContext)
  if (!context) {
    throw new Error("useBranch must be used within a BranchProvider")
  }
  return context
}

export { type Branch }

export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { branches, isLoading, addBranch: addBranchData, updateBranch: updateBranchData, deleteBranch: deleteBranchData } = useBranchData()
  const [currentBranch, setCurrentBranchState] = useState<Branch | null>(null)

  // Set current branch when branches load or change
  useEffect(() => {
    if (branches.length > 0 && !currentBranch) {
      // Try to load from localStorage first
      const savedCurrentBranch = localStorage.getItem("currentBranch")
      
      if (savedCurrentBranch) {
        const parsedBranch = JSON.parse(savedCurrentBranch)
        // Verify the branch still exists
        if (branches.some(b => b.id === parsedBranch.id)) {
          setCurrentBranchState(parsedBranch)
          return
        }
      }
      
      // Default to first branch if none stored
      setCurrentBranchState(branches[0])
    }
  }, [branches, currentBranch])

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
    addBranchData(branch)
  }, [addBranchData])

  const updateBranch = useCallback((branch: Branch) => {
    updateBranchData(branch)
    
    // Update current branch if it's the one being updated
    if (currentBranch && currentBranch.id === branch.id) {
      setCurrentBranchState(branch)
    }
  }, [currentBranch, updateBranchData])

  const deleteBranch = useCallback((id: string) => {
    // Don't allow deleting the main branch
    if (id === "main") return
    
    deleteBranchData(id)
    
    // Reset current branch to main if the deleted branch is the current one
    if (currentBranch && currentBranch.id === id) {
      const mainBranch = branches.find(branch => branch.id === "main")
      if (mainBranch) {
        setCurrentBranchState(mainBranch)
      }
    }
  }, [branches, currentBranch, deleteBranchData])

  return (
    <BranchContext.Provider
      value={{
        branches,
        currentBranch,
        setCurrentBranch,
        addBranch,
        updateBranch,
        deleteBranch,
        isLoading
      }}
    >
      {children}
    </BranchContext.Provider>
  )
} 