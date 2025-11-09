"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { DatabaseProvider } from "@/contexts/database-provider"
import { LoginForm } from "@/components/auth/login-form"
import { ProtectedNavigation } from "@/components/protected-navigation"
import { Dashboard } from "@/components/dashboard"
import { EmployeeModule } from "@/components/modules/employee-module"
import { FinanceModule } from "@/components/modules/finance-module"
import { LeaveModule } from "@/components/modules/leave-module"
import { AssetModule } from "@/components/modules/asset-module"
import { RequestsModule } from "@/components/modules/requests-module"
import { AnalyticsModule } from "@/components/modules/analytics-module"
import { ProjectsModule } from "@/components/modules/projects-module"
import { SettingsModule } from "@/components/modules/settings-module"
import { SearchFilterModule } from "@/components/modules/search-filter-module"
import { NotificationsModule } from "@/components/modules/notifications-module"
import { BulkActionsModule } from "@/components/modules/bulk-actions-module"
import { ComplianceModule } from "@/components/modules/compliance-module"
import { CommunicationModule } from "@/components/modules/communication-module"
import { PayrollModule } from "@/components/modules/payroll-module"
import { TrainingModule } from "@/components/modules/training-module"
import { RecruitmentModule } from "@/components/modules/recruitment-module"
// All dashboards are now unified in components/dashboard.tsx with role-specific content
import { getRoleDefaultModule } from "@/lib/role-routing"
import { WorkflowsModule } from "@/components/modules/workflows-module"
import { MessagingModule } from "@/components/modules/messaging-module"
import { AnnouncementsModule } from "@/components/modules/announcements-module"
import { ApprovalsModule } from "@/components/modules/approvals-module"
import { EmailLogsModule } from "@/components/modules/email-logs-module"
import { CampaignsModule } from "@/components/modules/campaigns-module"
import { ContentCalendarModule } from "@/components/modules/content-calendar-module"
import { SocialMediaModule } from "@/components/modules/social-media-module"
import { MarketingEventsModule } from "@/components/modules/marketing-events-module"
import { BrandAssetsModule } from "@/components/modules/brand-assets-module"

function HomeContent() {
  const [activeModule, setActiveModule] = useState("dashboard")
  const [darkMode, setDarkMode] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user && !isInitialized) {
      const defaultModule = getRoleDefaultModule(user.role)
      setActiveModule(defaultModule)
      setIsInitialized(true)
    }
  }, [user, isInitialized])

  if (!user) {
    return <LoginForm />
  }

  const modules: Record<string, React.ReactNode> = {
    dashboard: <Dashboard onNavigate={setActiveModule} />,
    employees: <EmployeeModule />,
    finance: <FinanceModule />,
    expenses: <FinanceModule />, // Expenses module maps to FinanceModule
    leave: <LeaveModule />,
    assets: <AssetModule />,
    requests: <RequestsModule />,
    projects: <ProjectsModule />,
    analytics: <AnalyticsModule />,
    settings: <SettingsModule onDarkModeChange={setDarkMode} />,
    search: <SearchFilterModule />,
    notifications: <NotificationsModule />,
    bulkActions: <BulkActionsModule />,
    compliance: <ComplianceModule />,
    communication: <CommunicationModule />,
    payroll: <PayrollModule />,
    training: <TrainingModule />,
    recruitment: <RecruitmentModule />,
    workflows: <WorkflowsModule />,
    messaging: <MessagingModule />,
    announcements: <AnnouncementsModule />,
    approvals: <ApprovalsModule />,
    emailLogs: <EmailLogsModule />,
    campaigns: <CampaignsModule />,
    contentCalendar: <ContentCalendarModule />,
    socialMedia: <SocialMediaModule />,
    marketingEvents: <MarketingEventsModule />,
    brandAssets: <BrandAssetsModule />,
  }

  return (
    <div className={`flex flex-col md:flex-row h-screen bg-background ${darkMode ? "dark" : ""}`}>
      <ProtectedNavigation activeModule={activeModule} onModuleChange={setActiveModule} />
      <main className="flex-1 overflow-auto pt-16 md:pt-0">{modules[activeModule] || <Dashboard />}</main>
    </div>
  )
}

export default function Home() {
  return (
    <DatabaseProvider>
      <AuthProvider>
        <HomeContent />
      </AuthProvider>
    </DatabaseProvider>
  )
}
