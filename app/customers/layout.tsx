"use client"

import { ReactNode } from "react"
import { CustomersProvider } from "./customers-context"

export default function CustomersLayout({ children }: { children: ReactNode }) {
  return (
    <CustomersProvider>
      {children}
    </CustomersProvider>
  )
} 