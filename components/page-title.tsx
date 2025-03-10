"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface PageTitleProps {
  children: React.ReactNode
  className?: string
}

export function PageTitle({ children, className }: PageTitleProps) {
  return (
    <h1 className={cn("text-2xl font-bold hidden", className)}>
      {children}
    </h1>
  )
}

export function PageHeader({ 
  children, 
  className,
  actions
}: { 
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode
}) {
  // If there are no actions, don't render anything
  if (!actions) return null;
  
  return (
    <div className={cn("flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 mb-6", className)}>
      <PageTitle>{children}</PageTitle>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {actions}
      </div>
    </div>
  )
} 