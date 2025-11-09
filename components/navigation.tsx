"use client"

import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Calendar,
  Package,
  Ticket,
  BarChart3,
  CheckSquare,
  Settings,
  LogOut,
  BookOpen,
  MessageSquare,
  Shield,
  Search,
  Layout,
  Bell,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface NavigationProps {
  activeModule: string
  onModuleChange: (module: string) => void
}

export function Navigation({ activeModule, onModuleChange }: NavigationProps) {
  const { logout } = useAuth()
  const { toast } = useToast()
  const modules = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "employees", label: "HR & Employees", icon: Users },
    { id: "finance", label: "Finance", icon: DollarSign },
    { id: "leave", label: "Leave & Attendance", icon: Calendar },
    { id: "assets", label: "Assets & Procurement", icon: Package },
    { id: "requests", label: "Requests", icon: Ticket },
    { id: "projects", label: "Projects", icon: CheckSquare },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "payroll", label: "Payroll", icon: DollarSign },
    { id: "training", label: "Training", icon: BookOpen },
    { id: "recruitment", label: "Recruitment", icon: Users },
    { id: "communication", label: "Communication", icon: MessageSquare },
    { id: "compliance", label: "Compliance", icon: Shield },
    { id: "search", label: "Search & Filter", icon: Search },
    { id: "bulkActions", label: "Bulk Actions", icon: Layout },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const handleSettingsClick = () => {
    onModuleChange("settings")
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Success",
        description: "Logged out successfully.",
      })
      // The auth context will handle redirecting to login
    } catch (error) {
      console.error("Error logging out:", error)
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center font-bold">A</div>
          <div>
            <p className="font-semibold text-sm">AdminOS</p>
            <p className="text-xs text-sidebar-foreground/60">v1.0</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-auto p-4 space-y-2">
        {modules.map((module) => {
          const Icon = module.icon
          const isActive = activeModule === module.id
          return (
            <button
              key={module.id}
              onClick={() => onModuleChange(module.id)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{module.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start bg-transparent"
          onClick={handleSettingsClick}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-destructive hover:text-destructive bg-transparent"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )
}
