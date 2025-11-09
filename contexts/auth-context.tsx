"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase, getCurrentUserProfile } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export interface User {
  id: string
  email: string
  fullName: string
  department: string
  position: string
  role: string
  permissions: string[]
  accessibleModules: string[]
  isActive: boolean
  createdAt: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  signup: (userData: Omit<User, "id" | "createdAt"> & { password: string }) => Promise<{ success: boolean; error?: string }>
  updateUser: (id: string, updates: Partial<User>) => Promise<void>
  getAllUsers: () => Promise<User[]>
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state from Supabase
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      // Use direct query instead of helper function for better performance
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error("Error loading user profile:", error)
        setLoading(false)
        return
      }

      if (profile) {
        setUser({
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          department: profile.department,
          position: profile.position,
          role: profile.role,
          permissions: profile.permissions || [],
          accessibleModules: profile.accessible_modules || [],
          isActive: profile.is_active,
          createdAt: profile.created_at,
        })
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        await loadUserProfile(data.user.id)
        return { success: true }
      }

      return { success: false, error: "Login failed" }
    } catch (error: any) {
      return { success: false, error: error.message || "An error occurred during login" }
    }
  }

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const signup = async (
    userData: Omit<User, "id" | "createdAt"> & { password: string },
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      })

      if (authError) {
        return { success: false, error: authError.message }
      }

      if (!authData.user) {
        return { success: false, error: "Failed to create user" }
      }

      // Create user profile
      const { error: profileError } = await supabase.from("user_profiles").insert({
        id: authData.user.id,
        email: userData.email,
        full_name: userData.fullName,
        department: userData.department,
        position: userData.position,
        role: userData.role,
        permissions: userData.permissions || [],
        accessible_modules: userData.accessibleModules || [],
        is_active: userData.isActive ?? true,
      })

      if (profileError) {
        // Note: Admin user deletion would need to be handled server-side
        // For now, return error - the auth user will need manual cleanup if needed
        return { success: false, error: profileError.message }
      }

      await loadUserProfile(authData.user.id)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || "An error occurred during signup" }
    }
  }

  const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {
    try {
      const updateData: any = {}
      if (updates.fullName) updateData.full_name = updates.fullName
      if (updates.department) updateData.department = updates.department
      if (updates.position) updateData.position = updates.position
      if (updates.role) updateData.role = updates.role
      if (updates.permissions) updateData.permissions = updates.permissions
      if (updates.accessibleModules) updateData.accessible_modules = updates.accessibleModules
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive

      const { error } = await supabase.from("user_profiles").update(updateData).eq("id", id)

      if (error) throw error

      if (user?.id === id) {
        await loadUserProfile(id)
      }
    } catch (error) {
      console.error("Error updating user:", error)
      throw error
    }
  }

  const getAllUsers = async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase.from("user_profiles").select("*").order("created_at", { ascending: false })

      if (error) throw error

      return (
        data?.map((profile) => ({
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          department: profile.department,
          position: profile.position,
          role: profile.role,
          permissions: profile.permissions || [],
          accessibleModules: profile.accessible_modules || [],
          isActive: profile.is_active,
          createdAt: profile.created_at,
        })) || []
      )
    } catch (error) {
      console.error("Error fetching users:", error)
      return []
    }
  }

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to update password" }
    }
  }

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // Store reset token in database for tracking
      await supabase.from("password_reset_tokens").insert({
        email,
        token: crypto.randomUUID(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to send reset email" }
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, signup, updateUser, getAllUsers, updatePassword, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
