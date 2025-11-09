"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ROLES_CONFIG } from "@/lib/roles-config"
import { useAuth } from "@/contexts/auth-context"

export function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [selectedDept, setSelectedDept] = useState<string>("")
  const { login } = useAuth()

  const handleLogin = async () => {
    if (!selectedRole) return

    // For demo purposes, you can use a test email/password
    // In production, this would be handled by actual authentication
    const demoCredentials: Record<string, { email: string; password: string }> = {
      admin: { email: "admin@adminOS.com", password: "admin123" },
      hr_manager: { email: "hr-head@company.com", password: "hr123" },
      finance_manager: { email: "finance-director@company.com", password: "fin123" },
      department_manager: { email: "manager@company.com", password: "mgr123" },
      employee: { email: "employee@company.com", password: "emp123" },
    }

    const creds = demoCredentials[selectedRole]
    if (creds) {
      await login(creds.email, creds.password)
    }
  }

  const departments = [
    "Human Resources",
    "Finance",
    "Operations",
    "Sales",
    "Marketing",
    "Technology",
    "Customer Support",
    "Legal",
  ]

  const roles = Object.entries(ROLES_CONFIG).map(([key, config]) => ({
    id: key,
    name: config.name,
    position: config.position,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center font-bold text-lg text-primary-foreground mx-auto mb-4">
            A
          </div>
          <h1 className="text-3xl font-bold">AdminOS</h1>
          <p className="text-muted-foreground mt-2">Enterprise Management Platform</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-2">Select Your Role</label>
            <div className="space-y-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedRole === role.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold text-sm">{role.name}</p>
                  <p className="text-xs text-muted-foreground">{role.position}</p>
                </button>
              ))}
            </div>
          </div>

          {selectedRole && selectedRole !== "admin" && (
            <div>
              <label className="text-sm font-semibold block mb-2">Select Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full p-2 border rounded-lg bg-background text-foreground"
              >
                <option value="">-- Choose Department --</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={!selectedRole || (selectedRole !== "admin" && !selectedDept)}
            className="w-full mt-6"
          >
            Sign In to AdminOS
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          This is a demo. Select a role to access the system with role-based permissions.
        </p>
      </Card>
    </div>
  )
}
