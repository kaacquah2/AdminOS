"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Save } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { AdminPanel } from "@/components/auth/admin-panel"

interface SettingsModuleProps {
  onDarkModeChange?: (enabled: boolean) => void
}

export function SettingsModule({ onDarkModeChange }: SettingsModuleProps) {
  const { user } = useAuth()
  const [companySettings, setCompanySettings] = useState({
    companyName: "Acme Corporation",
    industry: "Technology",
    employees: 342,
    country: "United States",
    timezone: "EST",
  })

  const [departments, setDepartments] = useState([
    { id: 1, name: "Engineering", manager: "Sarah Chen", budget: 450000 },
    { id: 2, name: "Sales", manager: "Marcus Johnson", budget: 320000 },
    { id: 3, name: "Marketing", manager: "Emily Rodriguez", budget: 180000 },
    { id: 4, name: "HR", manager: "Lisa Anderson", budget: 150000 },
    { id: 5, name: "Operations", manager: "David Lee", budget: 220000 },
  ])

  const [roles, setRoles] = useState([
    { id: 1, name: "Admin", permissions: ["All"] },
    { id: 2, name: "Manager", permissions: ["HR", "Finance", "Reports"] },
    { id: 3, name: "Employee", permissions: ["View Only", "Submit Requests"] },
    { id: 4, name: "Finance", permissions: ["Finance", "Reports"] },
  ])

  const [newDepartment, setNewDepartment] = useState({ name: "", manager: "" })
  const [darkMode, setDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState("company")
  const [editingId, setEditingId] = useState<number | null>(null)

  const addDepartment = () => {
    if (newDepartment.name.trim()) {
      setDepartments([
        ...departments,
        { id: departments.length + 1, name: newDepartment.name, manager: newDepartment.manager, budget: 200000 },
      ])
      setNewDepartment({ name: "", manager: "" })
    }
  }

  const deleteDepartment = (id: number) => {
    setDepartments(departments.filter((d) => d.id !== id))
  }

  const handleDarkModeToggle = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    onDarkModeChange?.(newDarkMode)
  }

  const tabs = [
    { id: "company", label: "Company Settings" },
    { id: "departments", label: "Departments" },
    { id: "roles", label: "Roles & Permissions" },
    { id: "preferences", label: "Preferences" },
    ...(user?.role === "admin" ? [{ id: "staff", label: "Staff Management" }] : []),
  ]

  // If admin viewing staff management tab, show admin panel
  if (user?.role === "admin" && activeTab === "staff") {
    return <AdminPanel />
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage organization settings, departments, and user roles.</p>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 border-b border-border mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "company" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Company Name</label>
              <input
                type="text"
                value={companySettings.companyName}
                onChange={(e) => setCompanySettings({ ...companySettings, companyName: e.target.value })}
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Industry</label>
              <input
                type="text"
                value={companySettings.industry}
                onChange={(e) => setCompanySettings({ ...companySettings, industry: e.target.value })}
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Country</label>
                <input
                  type="text"
                  value={companySettings.country}
                  onChange={(e) => setCompanySettings({ ...companySettings, country: e.target.value })}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Timezone</label>
                <select className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option>EST</option>
                  <option>CST</option>
                  <option>MST</option>
                  <option>PST</option>
                  <option>UTC</option>
                </select>
              </div>
            </div>
            <Button className="gap-2">
              <Save className="w-4 h-4" />
              Save Settings
            </Button>
          </div>
        )}

        {activeTab === "departments" && (
          <div className="space-y-4">
            <div className="bg-secondary p-4 rounded-lg space-y-3">
              <h3 className="font-semibold">Add New Department</h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Department name"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                  className="px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="text"
                  placeholder="Manager name"
                  value={newDepartment.manager}
                  onChange={(e) => setNewDepartment({ ...newDepartment, manager: e.target.value })}
                  className="px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <Button onClick={addDepartment} size="sm">
                Add Department
              </Button>
            </div>

            <div className="space-y-2">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="flex justify-between items-center p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  <div>
                    <p className="font-semibold">{dept.name}</p>
                    <p className="text-sm text-muted-foreground">Manager: {dept.manager}</p>
                    <p className="text-xs text-muted-foreground">Budget: ${dept.budget.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive bg-transparent"
                      onClick={() => deleteDepartment(dept.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "roles" && (
          <div className="space-y-4">
            {roles.map((role) => (
              <div key={role.id} className="p-4 bg-secondary rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold">{role.name}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit Permissions
                  </Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {role.permissions.map((perm, idx) => (
                    <span key={idx} className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 bg-secondary rounded-lg">
              <div>
                <p className="font-semibold">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Enable dark theme for AdminOS</p>
              </div>
              <button
                onClick={handleDarkModeToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkMode ? "bg-primary" : "bg-secondary-foreground/20"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${darkMode ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Display Preferences</h3>
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg hover:bg-secondary/80 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                <label className="text-sm">Show notifications</label>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg hover:bg-secondary/80 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                <label className="text-sm">Email alerts for approvals</label>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg hover:bg-secondary/80 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" />
                <label className="text-sm">Weekly report digest</label>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
