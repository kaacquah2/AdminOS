"use client"

import { useState } from "react"
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
  Zap,
  Hammer,
  GitBranch,
  Mail,
  Megaphone,
  Building2,
  Briefcase,
  Menu,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { isModuleAccessible } from "@/lib/role-routing"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent } from "@/components/ui/sheet"

interface NavigationProps {
  activeModule: string
  onModuleChange: (module: string) => void
}

export function ProtectedNavigation({ activeModule, onModuleChange }: NavigationProps) {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!user) return null

  const allModules = [
    // Unified Dashboard - shows role-specific content
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: [
        "super_admin",
        "executive",
        "hr_head",
        "hr_officer",
        "finance_director",
        "finance_officer",
        "accountant",
        "dept_manager",
        "project_manager",
        "employee",
        "it_manager",
        "it_support",
        "trainer",
        "procurement_officer",
        "facilities_manager",
        "audit_head",
        "audit_manager",
        "internal_auditor",
        "recruiter",
        "compliance_officer",
        "support_manager",
        "wellness_manager",
      ],
    },

    {
      id: "workflows",
      label: "Workflows & Tasks",
      icon: GitBranch,
      roles: ["super_admin", "hr_head", "finance_director", "dept_manager", "project_manager", "employee", "trainer"],
    },
    {
      id: "messaging",
      label: "Messaging",
      icon: Mail,
      roles: [
        "super_admin",
        "executive",
        "hr_head",
        "hr_officer",
        "finance_director",
        "accountant",
        "finance_officer",
        "dept_manager",
        "employee",
        "recruiter",
        "trainer",
        "compliance_officer",
        "procurement_officer",
        "facilities_manager",
        "it_manager",
        "it_support",
        "project_manager",
      ],
    },
    {
      id: "announcements",
      label: "Announcements",
      icon: Megaphone,
      roles: [
        "super_admin",
        "executive",
        "hr_head",
        "hr_officer",
        "finance_director",
        "accountant",
        "finance_officer",
        "dept_manager",
        "employee",
        "recruiter",
        "trainer",
        "compliance_officer",
        "procurement_officer",
        "facilities_manager",
        "it_manager",
        "it_support",
        "project_manager",
      ],
    },

    // Shared modules
    {
      id: "employees",
      label: "HR & Employees",
      icon: Users,
      roles: ["super_admin", "hr_head", "hr_officer", "dept_manager", "recruiter", "project_manager"],
    },
    {
      id: "finance",
      label: "Finance",
      icon: DollarSign,
      roles: ["super_admin", "finance_director", "finance_officer", "accountant"],
    },
    {
      id: "expenses",
      label: "Expenses",
      icon: DollarSign,
      roles: ["super_admin", "finance_director", "finance_officer", "accountant"],
    },
    {
      id: "leave",
      label: "Leave & Attendance",
      icon: Calendar,
      roles: ["super_admin", "hr_head", "hr_officer", "dept_manager", "employee", "project_manager"],
    },
    {
      id: "assets",
      label: "Assets & Procurement",
      icon: Package,
      roles: ["super_admin", "finance_director", "procurement_officer", "facilities_manager"],
    },
    {
      id: "requests",
      label: "Requests",
      icon: Ticket,
      roles: [
        "super_admin",
        "hr_head",
        "hr_officer",
        "dept_manager",
        "employee",
        "finance_officer",
        "it_support",
        "facilities_manager",
      ],
    },
    {
      id: "projects",
      label: "Projects",
      icon: CheckSquare,
      roles: ["super_admin", "dept_manager", "project_manager", "employee"],
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      roles: ["super_admin", "executive", "hr_head", "finance_director", "dept_manager", "project_manager"],
    },
    {
      id: "payroll",
      label: "Payroll",
      icon: DollarSign,
      roles: ["super_admin", "finance_director", "accountant", "finance_officer"],
    },
    { id: "training", label: "Training", icon: BookOpen, roles: ["super_admin", "hr_head", "trainer", "employee"] },
    { id: "recruitment", label: "Recruitment", icon: Users, roles: ["super_admin", "hr_head", "recruiter"] },
    {
      id: "communication",
      label: "Communication",
      icon: MessageSquare,
      roles: [
        "super_admin",
        "hr_head",
        "hr_officer",
        "dept_manager",
        "employee",
        "recruiter",
        "trainer",
        "facilities_manager",
      ],
    },
    { id: "compliance", label: "Compliance", icon: Shield, roles: ["super_admin", "compliance_officer", "it_manager"] },
    {
      id: "search",
      label: "Search & Filter",
      icon: Search,
      roles: [
        "super_admin",
        "executive",
        "hr_head",
        "hr_officer",
        "finance_director",
        "accountant",
        "finance_officer",
        "dept_manager",
        "employee",
        "recruiter",
        "trainer",
        "compliance_officer",
        "procurement_officer",
        "facilities_manager",
        "it_manager",
        "it_support",
        "project_manager",
      ],
    },
    { id: "bulkActions", label: "Bulk Actions", icon: Layout, roles: ["super_admin", "hr_head", "finance_director"] },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      roles: [
        "super_admin",
        "executive",
        "hr_head",
        "hr_officer",
        "finance_director",
        "accountant",
        "finance_officer",
        "dept_manager",
        "employee",
        "recruiter",
        "trainer",
        "compliance_officer",
        "procurement_officer",
        "facilities_manager",
        "it_manager",
        "it_support",
        "project_manager",
      ],
    },
    { id: "settings", label: "Settings", icon: Settings, roles: ["super_admin"] },
  ]

  // Use database accessible_modules if available, otherwise fall back to hardcoded role checks
  const accessibleModules = allModules.filter((module) => {
    // Super admin always has access to all modules
    if (user.role === "super_admin") {
      return true
    }
    // First check if user has accessible_modules from database
    if (user.accessibleModules && user.accessibleModules.length > 0) {
      return user.accessibleModules.includes(module.id)
    }
    // Fall back to hardcoded role checks for backward compatibility
    return module.roles.includes(user.role) || isModuleAccessible(user.role, module.id)
  })

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

  const handleModuleChange = (moduleId: string) => {
    onModuleChange(moduleId)
    if (isMobile) setMobileMenuOpen(false)
  }

  const NavigationContent = () => (
    <>
      <div className="p-4 sm:p-6 border-b border-sidebar-border">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center font-bold">A</div>
            <div>
              <p className="font-semibold text-sm">AdminOS</p>
              <p className="text-xs text-sidebar-foreground/60">v1.0</p>
            </div>
          </div>
          
          {/* Enhanced User Profile Section */}
          <div className="pt-3 border-t border-sidebar-border/30">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/60 rounded-full flex items-center justify-center font-semibold text-sm text-sidebar-primary-foreground flex-shrink-0">
                {user.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-sidebar-foreground truncate">
                  {user.fullName}
                </p>
                <div className="flex flex-col gap-1 mt-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-sidebar-foreground/70">
                    <Briefcase className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{user.position}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-sidebar-foreground/60">
                    <Building2 className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{user.department}</span>
                  </div>
                </div>
                
                {/* Role Badge */}
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-sidebar-primary/20 text-sidebar-primary border border-sidebar-primary/30">
                    <Shield className="w-2.5 h-2.5" />
                    {user.role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-auto p-4 space-y-2">
        {accessibleModules.map((module) => {
          const Icon = module.icon
          const isActive = activeModule === module.id
          return (
            <button
              key={module.id}
              onClick={() => handleModuleChange(module.id)}
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
          onClick={() => handleModuleChange("settings")}
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
    </>
  )

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-40 md:hidden bg-background/80 backdrop-blur-sm border border-border shadow-md"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-80 p-0 bg-sidebar text-sidebar-foreground">
            <div className="flex flex-col h-full">
              <NavigationContent />
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <div className="hidden md:flex w-64 bg-sidebar text-sidebar-foreground flex-col border-r border-sidebar-border h-screen">
      <NavigationContent />
    </div>
  )
}
