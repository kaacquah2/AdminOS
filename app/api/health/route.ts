import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Check database connection
    const { error: dbError } = await supabase.from("user_profiles").select("id").limit(1)

    // Check Supabase auth
    const { error: authError } = await supabase.auth.getSession()

    const status = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
      environment: process.env.NODE_ENV || "development",
      services: {
        database: dbError ? "unhealthy" : "healthy",
        authentication: authError ? "unhealthy" : "healthy",
      },
    }

    const isHealthy = !dbError && !authError

    return NextResponse.json(status, {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    )
  }
}

