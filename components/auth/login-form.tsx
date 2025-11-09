"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { ChevronDown } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotError, setForgotError] = useState("")
  const [forgotSuccess, setForgotSuccess] = useState("")
  const { login, resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email || !password) {
      setError("Please enter both email and password")
      setIsLoading(false)
      return
    }

    const result = await login(email, password)
    if (!result.success) {
      setError(result.error || "Login failed")
      setIsLoading(false)
      return
    }
    setIsLoading(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError("")
    setForgotSuccess("")

    if (!forgotEmail) {
      setForgotError("Please enter your email address")
      return
    }

    try {
      const result = await resetPassword(forgotEmail)
      if (result.success) {
        setForgotSuccess('Password reset link sent! Check your email for instructions.')
        setForgotEmail("")
      } else {
        setForgotError(result.error || 'Failed to send reset link')
      }
    } catch (error: any) {
      setForgotError(error.message || 'Failed to send reset link')
    }
  }

  const demoCredentials = [
    { role: "Super Admin", email: "admin@adminOS.com", password: "admin123" },
    { role: "Executive (CEO)", email: "ceo@company.com", password: "exec123" },
    { role: "Finance Director", email: "finance-director@company.com", password: "fin123" },
    { role: "Department Manager", email: "manager@company.com", password: "mgr123" },
    { role: "HR Head", email: "hr-head@company.com", password: "hr123" },
    { role: "Employee", email: "employee@company.com", password: "emp123" },
  ]

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">Reset Password</h1>
            <p className="text-muted-foreground mt-2">Enter your email to receive a reset link</p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="text-sm font-semibold block mb-2 text-foreground">Email Address</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {forgotError && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">{forgotError}</div>
            )}
            {forgotSuccess && <div className="p-3 bg-green-100 text-green-800 text-sm rounded-lg">{forgotSuccess}</div>}

            <Button type="submit" className="w-full">
              Send Reset Link
            </Button>
          </form>

          <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)} className="w-full mt-4">
            Back to Login
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center font-bold text-2xl text-primary-foreground mx-auto mb-4">
            A
          </div>
          <h1 className="text-3xl font-bold text-foreground">AdminOS</h1>
          <p className="text-muted-foreground mt-2">Enterprise Management Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-2 text-foreground">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2 text-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">{error}</div>}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setShowForgotPassword(true)}
          className="w-full text-sm text-primary hover:underline mt-4"
        >
          Forgot Password?
        </button>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowCredentials(!showCredentials)}
            className="w-full flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
          >
            <p className="text-sm font-semibold text-foreground">Demo Credentials</p>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${showCredentials ? "rotate-180" : ""}`}
            />
          </button>

          {showCredentials && (
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {demoCredentials.map((cred, index) => (
                <div
                  key={index}
                  className="p-3 bg-muted rounded-lg border border-border text-xs cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => {
                    setEmail(cred.email)
                    setPassword(cred.password)
                  }}
                >
                  <p className="font-semibold text-foreground">{cred.role}</p>
                  <p className="text-muted-foreground">{cred.email}</p>
                  <p className="text-muted-foreground/70">Password: {cred.password}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
