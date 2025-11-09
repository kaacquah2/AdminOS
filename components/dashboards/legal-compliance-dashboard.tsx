"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Shield, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  AlertCircle,
  Briefcase,
  Target,
  Activity,
  XCircle,
  Eye,
  Plus,
  Edit,
  Download,
  Bell,
  RefreshCw,
  BarChart3,
  DollarSign
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  getPMOProjects,
  getPMOMilestones,
  getPMOProjectRisks,
  getPMOProjectIssues,
  getAuditFindings,
  getAuditReports,
  getRiskAssessments,
  getContracts,
  getRegulatoryDeadlines,
  getCertifications,
  getLegalDocuments,
  createContract,
  type PMOProject,
  type AuditFinding,
  type AuditReport,
  type RiskAssessment,
  type Contract,
  type RegulatoryDeadline,
  type CertificationLicense,
  type LegalDocument
} from "@/lib/database"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NewContractModal } from "@/components/modals/new-contract-modal"

export function LegalComplianceDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [projectSearchQuery, setProjectSearchQuery] = useState("")
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>("all")
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>("all")
  const [projectPriorityFilter, setProjectPriorityFilter] = useState<string>("all")
  
  // Compliance Metrics
  const [complianceMetrics, setComplianceMetrics] = useState({
    complianceScore: 0,
    openFindings: 0,
    upcomingDeadlines: 0,
    highRiskItems: 0,
    resolvedFindings: 0,
    totalAudits: 0,
  })
  
  // Data States
  const [pmoProjects, setPmoProjects] = useState<PMOProject[]>([])
  const [complianceProjects, setComplianceProjects] = useState<PMOProject[]>([])
  const [auditFindings, setAuditFindings] = useState<AuditFinding[]>([])
  const [auditReports, setAuditReports] = useState<AuditReport[]>([])
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([])
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [regulatoryDeadlines, setRegulatoryDeadlines] = useState<RegulatoryDeadline[]>([])
  const [certifications, setCertifications] = useState<CertificationLicense[]>([])
  const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>([])
  
  // UI States
  const [activeTab, setActiveTab] = useState("overview")
  const [contractRenewalAlerts, setContractRenewalAlerts] = useState<any[]>([])
  const [deadlineReminders, setDeadlineReminders] = useState<any[]>([])
  const [certificationExpiryAlerts, setCertificationExpiryAlerts] = useState<any[]>([])
  const [isNewContractModalOpen, setIsNewContractModalOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadComplianceData()
    } else {
      setLoading(false)
    }
  }, [user])

  async function loadComplianceData() {
    try {
      setLoading(true)

      // Load all compliance data
      const [
        pmoProjectsData, 
        findingsData, 
        reportsData, 
        risksData,
        contractsData,
        deadlinesData,
        certificationsData,
        documentsData
      ] = await Promise.all([
        getPMOProjects(),
        getAuditFindings(),
        getAuditReports(),
        getRiskAssessments(),
        getContracts(),
        getRegulatoryDeadlines(),
        getCertifications(),
        getLegalDocuments(),
      ])

      setPmoProjects(pmoProjectsData || [])
      
      // Filter compliance-related projects
      const complianceProjs = (pmoProjectsData || []).filter((p: PMOProject) => 
        p.project_type === 'compliance' || 
        p.project_number?.toLowerCase().includes('compliance') ||
        p.project_number?.toLowerCase().includes('audit') ||
        p.project_number?.toLowerCase().includes('legal') ||
        p.project_number?.toLowerCase().includes('regulatory')
      )
      setComplianceProjects(complianceProjs)

      setAuditFindings(findingsData || [])
      setAuditReports(reportsData || [])
      setRiskAssessments(risksData || [])
      setContracts(contractsData || [])
      setRegulatoryDeadlines(deadlinesData || [])
      setCertifications(certificationsData || [])
      setLegalDocuments(documentsData || [])

      // Calculate compliance metrics
      const openFindings = (findingsData || []).filter((f: AuditFinding) => 
        f.status === 'open' || f.status === 'in_progress'
      ).length

      const resolvedFindings = (findingsData || []).filter((f: AuditFinding) => 
        f.status === 'resolved' || f.status === 'closed'
      ).length

      const totalFindings = (findingsData || []).length
      const complianceScore = totalFindings > 0 
        ? Math.round((resolvedFindings / totalFindings) * 100)
        : 100

      const highRiskItems = (risksData || []).filter((r: RiskAssessment) => 
        r.impact === 'high' || r.impact === 'critical'
      ).length

      // Calculate upcoming deadlines (next 30 days)
      const today = new Date()
      const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      const next90Days = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)
      
      // Audit finding deadlines
      const upcomingFindings = (findingsData || []).filter((f: AuditFinding) => {
        if (!f.due_date) return false
        const dueDate = new Date(f.due_date)
        return dueDate >= today && dueDate <= next30Days
      })

      // Regulatory deadlines
      const upcomingRegulatory = (deadlinesData || []).filter((d: RegulatoryDeadline) => {
        const deadlineDate = new Date(d.deadline_date)
        return deadlineDate >= today && deadlineDate <= next30Days
      })

      setUpcomingDeadlines([...upcomingFindings, ...upcomingRegulatory])

      // Contract renewal alerts (next 90 days)
      const contractAlerts = (contractsData || []).filter((c: Contract) => {
        if (!c.renewal_date || c.status !== 'active') return false
        const renewalDate = new Date(c.renewal_date)
        return renewalDate >= today && renewalDate <= next90Days
      }).map((c: Contract) => ({
        type: 'contract_renewal',
        title: `Contract Renewal: ${c.contract_name}`,
        description: `Contract ${c.contract_number} with ${c.party_name} needs renewal`,
        dueDate: c.renewal_date,
        daysRemaining: c.renewal_date ? Math.ceil((new Date(c.renewal_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0,
        contract: c
      }))
      setContractRenewalAlerts(contractAlerts)

      // Deadline reminders (next 7 days)
      const deadlineAlerts = (deadlinesData || []).filter((d: RegulatoryDeadline) => {
        if (d.status === 'submitted' || d.status === 'approved') return false
        const deadlineDate = new Date(d.deadline_date)
        const daysUntil = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntil >= 0 && daysUntil <= 7
      }).map((d: RegulatoryDeadline) => ({
        type: 'deadline_reminder',
        title: `Deadline: ${d.title}`,
        description: d.description || `Regulatory deadline from ${d.regulatory_body}`,
        dueDate: d.deadline_date,
        daysRemaining: Math.ceil((new Date(d.deadline_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        deadline: d
      }))
      setDeadlineReminders(deadlineAlerts)

      // Certification expiry alerts (next 60 days)
      const certAlerts = (certificationsData || []).filter((c: CertificationLicense) => {
        if (c.status === 'expired' || c.status === 'revoked') return false
        const expiryDate = new Date(c.expiry_date)
        const daysUntil = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntil >= 0 && daysUntil <= 60
      }).map((c: CertificationLicense) => ({
        type: 'certification_expiry',
        title: `Certification Expiring: ${c.name}`,
        description: `${c.cert_number} issued by ${c.issuing_body} is expiring soon`,
        dueDate: c.expiry_date,
        daysRemaining: Math.ceil((new Date(c.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        certification: c
      }))
      setCertificationExpiryAlerts(certAlerts)

      setComplianceMetrics({
        complianceScore,
        openFindings,
        upcomingDeadlines: upcomingFindings.length + upcomingRegulatory.length,
        highRiskItems,
        resolvedFindings,
        totalAudits: (reportsData || []).length,
      })

      // Build critical alerts (combine all alert types)
      const alerts: any[] = []
      
      // Add contract renewal alerts
      contractAlerts.forEach(alert => alerts.push(alert))
      
      // Add deadline reminders
      deadlineAlerts.forEach(alert => alerts.push(alert))
      
      // Add certification expiry alerts
      certAlerts.forEach(alert => alerts.push(alert))
      
      // Overdue findings
      const overdueFindings = (findingsData || []).filter((f: AuditFinding) => {
        if (!f.due_date || f.status === 'resolved' || f.status === 'closed') return false
        return new Date(f.due_date) < today
      })
      
      overdueFindings.forEach((f: AuditFinding) => {
        alerts.push({
          type: 'overdue_finding',
          severity: 'critical',
          title: `Overdue Audit Finding: ${f.finding_type}`,
          description: f.description,
          dueDate: f.due_date,
          id: f.id,
        })
      })

      // Critical/high severity findings
      const criticalFindings = (findingsData || []).filter((f: AuditFinding) => 
        (f.severity === 'critical' || f.severity === 'high') && 
        (f.status === 'open' || f.status === 'in_progress')
      )
      
      criticalFindings.forEach((f: AuditFinding) => {
        alerts.push({
          type: 'critical_finding',
          severity: f.severity,
          title: `${f.severity.toUpperCase()} Finding: ${f.finding_type}`,
          description: f.description,
          dueDate: f.due_date,
          id: f.id,
        })
      })

      // High-risk assessments
      const highRisks = (risksData || []).filter((r: RiskAssessment) => 
        (r.impact === 'high' || r.impact === 'critical') && r.status !== 'mitigated'
      )
      
      highRisks.forEach((r: RiskAssessment) => {
        alerts.push({
          type: 'high_risk',
          severity: r.impact,
          title: `High Risk: ${r.risk_category}`,
          description: r.description,
          id: r.id,
        })
      })

      setCriticalAlerts(alerts)

    } catch (error) {
      console.error("Error loading compliance data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateContract(contractData: any) {
    try {
      const newContract = await createContract(contractData)
      // Reload contracts to ensure we have the latest data
      const updatedContracts = await getContracts()
      setContracts(updatedContracts || [])
    } catch (error) {
      console.error("Error creating contract:", error)
      alert("Failed to create contract. Please try again.")
    }
  }

  // Filter projects based on search and filters
  const filteredProjects = complianceProjects.filter((project) => {
    const matchesSearch = projectSearchQuery === "" || 
      project.project_number?.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      project.project_number?.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      project.project_type?.toLowerCase().includes(projectSearchQuery.toLowerCase())
    
    const matchesStatus = projectStatusFilter === "all" || project.health_indicator === projectStatusFilter
    const matchesType = projectTypeFilter === "all" || project.project_type === projectTypeFilter
    const matchesPriority = projectPriorityFilter === "all" || project.priority === projectPriorityFilter

    return matchesSearch && matchesStatus && matchesType && matchesPriority
  })

  // Filter audit findings
  const filteredFindings = auditFindings.filter((finding) => {
    const matchesStatus = projectStatusFilter === "all" || finding.status === projectStatusFilter
    return matchesStatus
  })

  const stats = [
    {
      label: "Compliance Score",
      value: `${complianceMetrics.complianceScore}%`,
      icon: Shield,
      color: complianceMetrics.complianceScore >= 95 
        ? "from-green-500/10 to-green-500/5"
        : complianceMetrics.complianceScore >= 80
        ? "from-yellow-500/10 to-yellow-500/5"
        : "from-red-500/10 to-red-500/5",
      trend: complianceMetrics.complianceScore >= 95 ? "Excellent" : complianceMetrics.complianceScore >= 80 ? "Good" : "Needs Improvement",
      trendColor: complianceMetrics.complianceScore >= 95 ? "text-green-600" : complianceMetrics.complianceScore >= 80 ? "text-yellow-600" : "text-red-600",
    },
    {
      label: "Open Findings",
      value: complianceMetrics.openFindings,
      icon: AlertTriangle,
      color: "from-red-500/10 to-red-500/5",
      trend: `${complianceMetrics.resolvedFindings} Resolved`,
      trendColor: "text-blue-600",
    },
    {
      label: "Upcoming Deadlines",
      value: complianceMetrics.upcomingDeadlines,
      icon: Calendar,
      color: "from-orange-500/10 to-orange-500/5",
      trend: "Next 30 Days",
      trendColor: "text-orange-600",
    },
    {
      label: "High-Risk Items",
      value: complianceMetrics.highRiskItems,
      icon: AlertCircle,
      color: "from-red-500/10 to-red-500/5",
      trend: "Requires Attention",
      trendColor: "text-red-600",
    },
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical": return "bg-red-500"
      case "high": return "bg-orange-500"
      case "medium": return "bg-yellow-500"
      case "low": return "bg-blue-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open": return <Badge className="bg-red-500">Open</Badge>
      case "in_progress": return <Badge className="bg-yellow-500">In Progress</Badge>
      case "resolved": return <Badge className="bg-green-500">Resolved</Badge>
      case "closed": return <Badge className="bg-gray-500">Closed</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6 space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">Legal & Compliance Dashboard</h2>
          <p className="text-muted-foreground">Please log in to view the Legal & Compliance Dashboard.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Legal & Compliance Dashboard</h1>
          <p className="text-muted-foreground mt-2">Compliance monitoring, audit management, and regulatory tracking</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadComplianceData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Automation Alerts Section */}
      {(contractRenewalAlerts.length > 0 || deadlineReminders.length > 0 || certificationExpiryAlerts.length > 0) && (
        <Card className="p-6 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Bell className="w-5 h-5" />
              Automation Alerts & Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {contractRenewalAlerts.length > 0 && (
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-orange-600" />
                    <span className="font-semibold">Contract Renewals</span>
                    <Badge className="bg-orange-500">{contractRenewalAlerts.length}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {contractRenewalAlerts.length} contract{contractRenewalAlerts.length !== 1 ? 's' : ''} need renewal in next 90 days
                  </p>
                </div>
              )}
              {deadlineReminders.length > 0 && (
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-red-600" />
                    <span className="font-semibold">Deadline Reminders</span>
                    <Badge className="bg-red-500">{deadlineReminders.length}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {deadlineReminders.length} deadline{deadlineReminders.length !== 1 ? 's' : ''} due in next 7 days
                  </p>
                </div>
              )}
              {certificationExpiryAlerts.length > 0 && (
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-yellow-600" />
                    <span className="font-semibold">Certification Expiry</span>
                    <Badge className="bg-yellow-500">{certificationExpiryAlerts.length}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {certificationExpiryAlerts.length} certification{certificationExpiryAlerts.length !== 1 ? 's' : ''} expiring in next 60 days
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className={`p-6 bg-gradient-to-br ${stat.color} hover:shadow-lg transition-shadow`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  <p className={`text-xs ${stat.trendColor} mt-2`}>
                    {stat.trend}
                  </p>
                </div>
                <Icon className="w-10 h-10 text-primary" />
              </div>
            </Card>
          )
        })}
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card className="p-6 border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Critical Alerts Requiring Immediate Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.slice(0, 5).map((alert, index) => (
                <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getSeverityColor(alert.severity || 'high')}>
                          {alert.severity?.toUpperCase() || 'HIGH'}
                        </Badge>
                        <span className="font-semibold">{alert.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{alert.description}</p>
                      {alert.dueDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(alert.dueDate).toLocaleDateString()}
                          {alert.daysRemaining !== undefined && (
                            <span className="ml-2">({alert.daysRemaining} days remaining)</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Project Search and Filters */}
          <Card className="p-6">
        <CardHeader>
          <CardTitle>Compliance Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search projects by name, number, or department..."
                    value={projectSearchQuery}
                    onChange={(e) => setProjectSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={projectStatusFilter} onValueChange={setProjectStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={projectTypeFilter} onValueChange={setProjectTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="audit">Audit</SelectItem>
                  <SelectItem value="regulatory">Regulatory</SelectItem>
                </SelectContent>
              </Select>
              <Select value={projectPriorityFilter} onValueChange={setProjectPriorityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Projects Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Project Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Priority</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Department</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.length > 0 ? (
                      filteredProjects.map((project) => (
                        <tr key={project.id} className="border-t hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div className="font-medium">{project.project_number}</div>
                            <div className="text-xs text-muted-foreground">{project.project_number}</div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{project.project_type}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{project.health_indicator}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={getSeverityColor(project.priority || 'medium')}>
                              {project.priority}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">{project.project_type}</td>
                          <td className="px-4 py-3">
                            {project.health_indicator === 'green' && <Badge className="bg-green-500">On Track</Badge>}
                            {project.health_indicator === 'yellow' && <Badge className="bg-yellow-500">At Risk</Badge>}
                            {project.health_indicator === 'red' && <Badge className="bg-red-500">Critical</Badge>}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          No compliance projects found matching your search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recent Audit Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredFindings.slice(0, 5).map((finding) => (
                <div key={finding.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(finding.severity)}>
                        {finding.severity}
                      </Badge>
                      <span className="font-medium text-sm">{finding.finding_type}</span>
                    </div>
                    {getStatusBadge(finding.status)}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{finding.description}</p>
                  {finding.due_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {new Date(finding.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
              {filteredFindings.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No audit findings found.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Risk Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {riskAssessments.slice(0, 5).map((risk) => (
                <div key={risk.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-sm">{risk.risk_category}</span>
                    <Badge className={getSeverityColor(risk.impact)}>
                      {risk.impact}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{risk.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {risk.status} | Probability: {risk.probability}
                  </p>
                </div>
              ))}
              {riskAssessments.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No risk assessments found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Deadlines (Next 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingDeadlines.map((deadline: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200">
                  <div>
                    <p className="font-medium">{deadline.title || 'Audit Finding'}</p>
                    <p className="text-sm text-muted-foreground">{deadline.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-yellow-600">
                      {new Date(deadline.dueDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.ceil((new Date(deadline.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-6">
          <Card className="p-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Contract Management
                </CardTitle>
                <Button size="sm" onClick={() => setIsNewContractModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Contract
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Contract Filters */}
                <div className="flex gap-4">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="pending_renewal">Pending Renewal</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="lease">Lease</SelectItem>
                      <SelectItem value="employment">Employment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Contracts Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Contract</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Party</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Value</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Renewal Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contracts.length > 0 ? (
                          contracts.map((contract) => {
                            const renewalDate = contract.renewal_date ? new Date(contract.renewal_date) : null
                            const today = new Date()
                            const daysUntilRenewal = renewalDate ? Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null
                            const isRenewalSoon = daysUntilRenewal !== null && daysUntilRenewal <= 90 && daysUntilRenewal >= 0

                            return (
                              <tr key={contract.id} className="border-t hover:bg-muted/50">
                                <td className="px-4 py-3">
                                  <div className="font-medium">{contract.contract_name}</div>
                                  <div className="text-xs text-muted-foreground">{contract.contract_number}</div>
                                </td>
                                <td className="px-4 py-3 text-sm">{contract.party_name}</td>
                                <td className="px-4 py-3">
                                  <Badge variant="outline">{contract.contract_type}</Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge className={contract.status === 'active' ? 'bg-green-500' : contract.status === 'expired' ? 'bg-red-500' : 'bg-gray-500'}>
                                    {contract.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {contract.value ? `${contract.currency || 'USD'} ${contract.value.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-4 py-3">
                                  {renewalDate ? (
                                    <div>
                                      <p className="text-sm">{renewalDate.toLocaleDateString()}</p>
                                      {isRenewalSoon && (
                                        <Badge className="bg-orange-500 text-xs mt-1">
                                          {daysUntilRenewal} days
                                        </Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <Button variant="ghost" size="sm">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                              No contracts found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Regulatory Deadlines Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Calendar View - Monthly Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="p-2 text-center text-sm font-semibold text-muted-foreground">
                      {day}
                    </div>
                  ))}
                  {/* Calendar days would go here - simplified for now */}
                  {Array.from({ length: 35 }).map((_, i) => {
                    const day = i + 1
                    const dayDeadlines = regulatoryDeadlines.filter((d) => {
                      const deadlineDate = new Date(d.deadline_date)
                      return deadlineDate.getDate() === day && deadlineDate.getMonth() === new Date().getMonth()
                    })
                    return (
                      <div key={i} className="p-2 border rounded min-h-[60px]">
                        <div className="text-sm font-medium mb-1">{day}</div>
                        {dayDeadlines.length > 0 && (
                          <div className="space-y-1">
                            {dayDeadlines.slice(0, 2).map((d) => (
                              <div key={d.id} className="text-xs bg-red-100 dark:bg-red-900 rounded px-1 truncate">
                                {d.title}
                              </div>
                            ))}
                            {dayDeadlines.length > 2 && (
                              <div className="text-xs text-muted-foreground">+{dayDeadlines.length - 2} more</div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Upcoming Deadlines List */}
                <div className="mt-6">
                  <h3 className="font-semibold mb-4">Upcoming Deadlines</h3>
                  <div className="space-y-2">
                    {regulatoryDeadlines
                      .filter((d) => {
                        const deadlineDate = new Date(d.deadline_date)
                        return deadlineDate >= new Date() && deadlineDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                      })
                      .sort((a, b) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime())
                      .slice(0, 10)
                      .map((deadline) => {
                        const daysUntil = Math.ceil((new Date(deadline.deadline_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        return (
                          <div key={deadline.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium">{deadline.title}</p>
                              <p className="text-sm text-muted-foreground">{deadline.regulatory_body} - {deadline.regulation_type}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{new Date(deadline.deadline_date).toLocaleDateString()}</p>
                              <Badge className={daysUntil <= 7 ? 'bg-red-500' : daysUntil <= 14 ? 'bg-orange-500' : 'bg-yellow-500'}>
                                {daysUntil} days
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Score Chart */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Compliance Score Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { month: 'Jan', score: 92 },
                    { month: 'Feb', score: 94 },
                    { month: 'Mar', score: 93 },
                    { month: 'Apr', score: 95 },
                    { month: 'May', score: complianceMetrics.complianceScore },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Risk Distribution */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Risk Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Critical', value: riskAssessments.filter(r => r.impact === 'critical').length, color: '#ef4444' },
                        { name: 'High', value: riskAssessments.filter(r => r.impact === 'high').length, color: '#f97316' },
                        { name: 'Medium', value: riskAssessments.filter(r => r.impact === 'medium').length, color: '#eab308' },
                        { name: 'Low', value: riskAssessments.filter(r => r.impact === 'low').length, color: '#3b82f6' },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Critical', value: riskAssessments.filter(r => r.impact === 'critical').length, color: '#ef4444' },
                        { name: 'High', value: riskAssessments.filter(r => r.impact === 'high').length, color: '#f97316' },
                        { name: 'Medium', value: riskAssessments.filter(r => r.impact === 'medium').length, color: '#eab308' },
                        { name: 'Low', value: riskAssessments.filter(r => r.impact === 'low').length, color: '#3b82f6' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Audit Findings by Status */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Audit Findings by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { status: 'Open', count: auditFindings.filter(f => f.status === 'open').length },
                    { status: 'In Progress', count: auditFindings.filter(f => f.status === 'in_progress').length },
                    { status: 'Resolved', count: auditFindings.filter(f => f.status === 'resolved').length },
                    { status: 'Closed', count: auditFindings.filter(f => f.status === 'closed').length },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Contract Value by Type */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Contract Value by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(
                    contracts.reduce((acc, c) => {
                      const type = c.contract_type
                      acc[type] = (acc[type] || 0) + (c.value || 0)
                      return acc
                    }, {} as Record<string, number>)
                  ).map(([type, value]) => ({ type, value: value / 1000 }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value}K`} />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Reports List */}
          <Card className="p-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Compliance Reports
                </CardTitle>
                <Button size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditReports.map((report) => (
                  <div key={report.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <p className="text-sm text-muted-foreground">{report.period} - {report.audited_area}</p>
                        <p className="text-sm text-muted-foreground mt-1">{report.observations}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={report.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}>
                          {report.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {auditReports.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No compliance reports found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card className="p-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Legal Documents
                </CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Document Filters */}
                <div className="flex gap-4">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="policy">Policy</SelectItem>
                      <SelectItem value="procedure">Procedure</SelectItem>
                      <SelectItem value="agreement">Agreement</SelectItem>
                      <SelectItem value="memo">Memo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Documents Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Document</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Version</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Effective Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Review Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {legalDocuments.length > 0 ? (
                          legalDocuments.map((doc) => (
                            <tr key={doc.id} className="border-t hover:bg-muted/50">
                              <td className="px-4 py-3">
                                <div className="font-medium">{doc.title}</div>
                                <div className="text-xs text-muted-foreground">{doc.document_number}</div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline">{doc.document_type}</Badge>
                              </td>
                              <td className="px-4 py-3 text-sm">{doc.version}</td>
                              <td className="px-4 py-3">
                                <Badge className={doc.status === 'active' ? 'bg-green-500' : doc.status === 'draft' ? 'bg-yellow-500' : 'bg-gray-500'}>
                                  {doc.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {doc.effective_date ? new Date(doc.effective_date).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {doc.review_date ? new Date(doc.review_date).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => window.open(doc.document_url, '_blank')}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                              No legal documents found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Certifications & Licenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {certifications.map((cert) => {
                  const expiryDate = new Date(cert.expiry_date)
                  const today = new Date()
                  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  const isExpiringSoon = daysUntilExpiry <= 60 && daysUntilExpiry >= 0

                  return (
                    <div key={cert.id} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{cert.name}</p>
                          <p className="text-sm text-muted-foreground">{cert.cert_number} - {cert.issuing_body}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Expires: {expiryDate.toLocaleDateString()}
                            {isExpiringSoon && (
                              <Badge className="bg-yellow-500 ml-2">
                                {daysUntilExpiry} days
                              </Badge>
                            )}
                          </p>
                        </div>
                        <Badge className={cert.status === 'active' ? 'bg-green-500' : cert.status === 'expired' ? 'bg-red-500' : 'bg-gray-500'}>
                          {cert.status}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
                {certifications.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No certifications found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NewContractModal
        isOpen={isNewContractModalOpen}
        onClose={() => setIsNewContractModalOpen(false)}
        onSubmit={handleCreateContract}
      />
    </div>
  )
}

