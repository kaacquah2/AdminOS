"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import type { User } from "@/contexts/auth-context"
import { X, Edit2, Plus, Eye, EyeOff } from "lucide-react"

const ROLE_OPTIONS = [
  { value: "admin", label: "Administrator" },
  { value: "hr_manager", label: "HR Manager" },
  { value: "finance_manager", label: "Finance Manager" },
  { value: "department_manager", label: "Department Manager" },
  { value: "employee", label: "Employee" },
  { value: "finance_officer", label: "Finance Officer" },
  { value: "recruiter", label: "Recruiter" },
  { value: "training_coordinator", label: "Training Coordinator" },
]

const DEPARTMENT_OPTIONS = [
  "Human Resources",
  "Finance",
  "Operations",
  "Sales",
  "Marketing",
  "Technology",
  "Customer Support",
  "Legal",
]

const getRolePermissions = (role: string) => {
  const permissionsMap: Record<string, string[]> = {
    admin: [
      "manage_all",
      "manage_employees",
      "manage_finance",
      "manage_compliance",
      "manage_settings",
      "view_analytics",
      "export_data",
    ],
    hr_manager: [
      "manage_employees",
      "manage_training",
      "manage_recruitment",
      "view_leave_requests",
      "approve_leave",
      "view_analytics",
    ],
    finance_manager: ["manage_finance", "manage_expenses", "approve_expenses", "manage_payroll", "view_analytics"],
    department_manager: ["view_team_employees", "manage_team_requests", "approve_team_leave", "manage_team_projects"],
    employee: ["view_own_profile", "request_leave", "view_payslip", "submit_request"],
    finance_officer: ["manage_expenses", "view_finance_reports", "export_finance_data"],
    recruiter: ["manage_recruitment", "manage_job_postings", "view_candidates"],
    training_coordinator: ["manage_training", "track_certifications", "schedule_training"],
  }
  return permissionsMap[role] || []
}

const getRoleModules = (role: string) => {
  const modulesMap: Record<string, string[]> = {
    admin: [
      "dashboard",
      "employees",
      "finance",
      "leave",
      "assets",
      "requests",
      "projects",
      "analytics",
      "payroll",
      "training",
      "recruitment",
      "communication",
      "compliance",
      "settings",
    ],
    hr_manager: [
      "dashboard",
      "employees",
      "leave",
      "requests",
      "training",
      "recruitment",
      "communication",
      "analytics",
    ],
    finance_manager: ["dashboard", "finance", "payroll", "assets", "requests", "analytics"],
    department_manager: ["dashboard", "employees", "leave", "requests", "projects", "analytics", "communication"],
    employee: ["dashboard", "leave", "requests", "projects", "communication"],
    finance_officer: ["dashboard", "finance", "requests"],
    recruiter: ["dashboard", "recruitment", "employees", "communication"],
    training_coordinator: ["dashboard", "training", "employees", "communication"],
  }
  return modulesMap[role] || []
}

export function AdminPanel() {
  const { getAllUsers, updateUser, signup } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    department: "",
    position: "",
    role: "employee",
    isActive: true,
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const allUsers = await getAllUsers()
    setUsers(allUsers)
  }

  const handleAddUser = async () => {
    if (!formData.fullName || !formData.email || !formData.password || !formData.department || !formData.position) {
      alert("Please fill all fields")
      return
    }

    const newUser = {
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      department: formData.department,
      position: formData.position,
      role: formData.role,
      permissions: getRolePermissions(formData.role),
      accessibleModules: getRoleModules(formData.role),
      isActive: formData.isActive,
    }

    const result = await signup(newUser)
    if (result.success) {
      await loadUsers()
      setFormData({
        fullName: "",
        email: "",
        password: "",
        department: "",
        position: "",
        role: "employee",
        isActive: true,
      })
      setShowAddForm(false)
    } else {
      alert(result.error)
    }
  }

  const handleUpdateUser = async (userId: string) => {
    const updates: Partial<User> = {
      fullName: formData.fullName,
      email: formData.email,
      department: formData.department,
      position: formData.position,
      role: formData.role,
      isActive: formData.isActive,
      permissions: getRolePermissions(formData.role),
      accessibleModules: getRoleModules(formData.role),
    }
    
    // Only update password if provided
    if (formData.password) {
      // Password updates need to be handled separately via updatePassword
      // For now, we'll skip it - admin can use separate password reset flow
    }
    
    await updateUser(userId, updates)
    await loadUsers()
    setEditingId(null)
    setFormData({
      fullName: "",
      email: "",
      password: "",
      department: "",
      position: "",
      role: "employee",
      isActive: true,
    })
  }

  const startEdit = (user: User) => {
    setFormData({
      fullName: user.fullName,
      email: user.email,
      password: "",
      department: user.department,
      position: user.position,
      role: user.role,
      isActive: user.isActive,
    })
    setEditingId(user.id)
  }

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    await updateUser(userId, { isActive: !currentStatus })
    await loadUsers()
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Staff Management</h2>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus size={18} />
          Add New Employee
        </Button>
      </div>

      {(showAddForm || editingId) && (
        <Card className="p-6 mb-6 border border-primary/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{editingId ? "Edit Employee" : "Add New Employee"}</h3>
            <button
              onClick={() => {
                setShowAddForm(false)
                setEditingId(null)
                setFormData({
                  fullName: "",
                  email: "",
                  password: "",
                  department: "",
                  position: "",
                  role: "employee",
                  isActive: true,
                })
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold block mb-1">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Full name"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email address"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Password"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">Select Department</option>
                {DEPARTMENT_OPTIONS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1">Position</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Job position"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={() => (editingId ? handleUpdateUser(editingId) : handleAddUser())} className="flex-1">
              {editingId ? "Update Employee" : "Add Employee"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false)
                setEditingId(null)
                setFormData({
                  fullName: "",
                  email: "",
                  password: "",
                  department: "",
                  position: "",
                  role: "employee",
                  isActive: true,
                })
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Department</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm">{user.fullName}</td>
                  <td className="px-4 py-3 text-sm">
                    <code className="px-2 py-1 bg-muted rounded text-xs">{user.email}</code>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-semibold">
                      {ROLE_OPTIONS.find((r) => r.value === user.role)?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{user.department}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleToggleActive(user.id, user.isActive)}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        user.isActive
                          ? "bg-green-500/10 text-green-700 dark:text-green-400"
                          : "bg-red-500/10 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setShowPasswords({ ...showPasswords, [user.id]: !showPasswords[user.id] })}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords[user.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      {showPasswords[user.id] && (
                        <div className="absolute bg-popover border border-border rounded p-2 text-xs mt-8 z-10">
                          <p className="text-muted-foreground">Password is encrypted and not accessible</p>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-semibold mb-2">Quick Stats</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Employees</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-600">{users.filter((u) => u.isActive).length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Inactive</p>
            <p className="text-2xl font-bold text-red-600">{users.filter((u) => !u.isActive).length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Roles</p>
            <p className="text-2xl font-bold">{new Set(users.map((u) => u.role)).size}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
