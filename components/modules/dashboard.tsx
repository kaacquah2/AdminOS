"use client"

import { useAuth } from "@/contexts/auth-context"

export function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="p-6 space-y-6">
      {user && (
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-2">Welcome, {user.fullName}!</h2>
          <p className="text-muted-foreground mb-4">
            {user.position} • {user.department}
          </p>
          <p className="text-sm text-muted-foreground">
            Accessible Modules: {user.accessibleModules.length} | Permissions: {user.permissions.length}
          </p>
        </div>
      )}
    </div>
  )
}
