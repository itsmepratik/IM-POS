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
  actions,
  leftAction
}: { 
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode
  leftAction?: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6", className)}>
      <div className="flex items-center gap-2">
        {leftAction}
        <h2 className="text-2xl font-bold">{children}</h2>
      </div>
      {actions && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  )
} 