"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RestockPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to restock-orders page
    router.push("/restock-orders")
  }, [router])
  
  return null
} 