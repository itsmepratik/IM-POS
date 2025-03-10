"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <div className="w-full max-w-md mx-auto flex flex-col items-center">
        {/* 404 Illustration */}
        <div className="relative w-full h-64 mb-8">
          <Image
            src="/images/404-illustration.svg"
            alt="404 Error Illustration"
            fill
            priority
            className="object-contain"
          />
        </div>
        
        {/* Error Message */}
        <h1 className="text-2xl font-bold text-center mb-2">
          Your page didn't respond.
        </h1>
        
        {/* Subtext */}
        <p className="text-gray-500 text-center mb-8">
          This page doesn't exist or maybe fell asleep!
          <br />
          We suggest you back to home
        </p>
        
        {/* Back Home Button */}
        <Link href="/">
          <Button className="bg-black hover:bg-black/90 text-white rounded-full px-8 py-2 h-auto">
            Back Home
          </Button>
        </Link>
      </div>
    </div>
  )
} 