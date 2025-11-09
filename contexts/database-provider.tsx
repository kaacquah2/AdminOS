"use client"

import type React from "react"
import { useEffect } from "react"
import { initializeDatabase } from "@/lib/database"

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize database connection (no-op with Supabase, but kept for compatibility)
    initializeDatabase()
  }, [])

  return <>{children}</>
}
