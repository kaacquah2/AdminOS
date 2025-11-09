"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Shield, 
  Filter,
  Search,
  X,
  Eye,
  Edit
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  getAuditLogs,
  getAuditFindings,
  updateAuditFinding,
  getAuditReports,
  getRiskAssessments,
  type AuditLog,
  type AuditFinding,
  type AuditReport,
  type RiskAssessment,
} from "@/lib/database"

export function ComplianceModule() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Data states
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditFindings, setAuditFindings] = useState<AuditFinding[]>([])
  const [auditReports, setAuditReports] = useState<AuditReport[]>([])
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([])
  
  // Filter states
  const [logFilter, setLogFilter] = useState<{ severity?: string; module?: string }>({})
  const [findingFilter, setFindingFilter] = useState<{ status?: string; severity?: string; type?: string }>({})
  const [searchQuery, setSearchQuery] = useState("")
  
  // Dialog states
  const [selectedFinding, setSelectedFinding] = useState<AuditFinding | null>(null)
  const [showResolveDialog, setShowResolveDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [resolveNotes, setResolveNotes] = useState("")
  const [resolveStatus, setResolveStatus] = useState<"in_progress" | "resolved" | "closed">("resolved")

  useEffect(() => {
    loadAllData()
  }, [user])

  async function loadAllData() {
    if (!user) return
    
    try {
      setLoading(true)
      
      // Load audit logs
      const logs = await getAuditLogs(logFilter)
      setAuditLogs(logs)
      
      // Load audit findings
      const findings = await getAuditFindings()
      setAuditFindings(findings)
      
      // Load audit reports
      const reports = await getAuditReports()
      setAuditReports(reports)
      
      // Load risk assessments
      const risks = await getRiskAssessments()
      setRiskAssessments(risks)
    } catch (error) {
      console.error("Error loading compliance data:", error)
      toast({
        title: "Error",
        description: "Failed to load compliance data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (logFilter.severity || logFilter.module) {
      loadAllData()
    }
  }, [logFilter])

  useEffect(() => {
    if (findingFilter.status || findingFilter.severity || findingFilter.type) {
      loadAllData()
    }
  }, [findingFilter])

  async function handleResolveFinding() {
    if (!selectedFinding) return

    try {
      const updates: any = {
        status: resolveStatus,
      }

      if (resolveStatus === "resolved" || resolveStatus === "closed") {
        updates.resolved_date = new Date().toISOString().split("T")[0]
      }

      // Append new notes to existing resolution notes
      const existingNotes = selectedFinding.resolution_notes || ""
      const newNotes = resolveNotes.trim()
      if (newNotes) {
        const timestamp = new Date().toLocaleString()
        const separator = existingNotes ? "\n\n---\n\n" : ""
        updates.resolution_notes = existingNotes + separator + `[${timestamp}] ${user?.fullName || "User"}: ${newNotes}`
      }

      await updateAuditFinding(selectedFinding.id, updates)
      
      await loadAllData()
      setShowResolveDialog(false)
      setSelectedFinding(null)
      setResolveNotes("")
      
      toast({
        title: "Success",
        description: `Finding ${resolveStatus === "resolved" ? "resolved" : resolveStatus === "closed" ? "closed" : "updated"} successfully.`,
      })
    } catch (error) {
      console.error("Error resolving finding:", error)
      toast({
        title: "Error",
        description: "Failed to update finding. Please try again.",
        variant: "destructive",
      })
    }
  }

  function handleViewDetails(finding: AuditFinding) {
    setSelectedFinding(finding)
    setShowDetailDialog(true)
  }

  // Calculate statistics
  const totalAuditLogs = auditLogs.length
  const highSeverityLogs = auditLogs.filter(log => log.severity === "high" || log.severity === "critical").length
  const openFindings = auditFindings.filter(f => f.status === "open" || f.status === "in_progress").length
  const criticalFindings = auditFindings.filter(f => f.severity === "critical" && (f.status === "open" || f.status === "in_progress")).length
  const resolvedFindings = auditFindings.filter(f => f.status === "resolved" || f.status === "closed").length
  const activeRisks = riskAssessments.filter(r => r.status === "active").length
  const publishedReports = auditReports.filter(r => r.status === "published").length

  // Filter data based on search query
  const filteredLogs = auditLogs.filter(log => 
    !searchQuery || 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.module.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredFindings = auditFindings.filter(finding => {
    const matchesSearch = !searchQuery || 
      finding.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      finding.recommendation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      finding.finding_type.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = !findingFilter.status || finding.status === findingFilter.status
    const matchesSeverity = !findingFilter.severity || finding.severity === findingFilter.severity
    const matchesType = !findingFilter.type || finding.finding_type === findingFilter.type
    
    return matchesSearch && matchesStatus && matchesSeverity && matchesType
  })

  const severityColors: Record<string, string> = {
    critical: "bg-red-600 text-white",
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  }

  const statusColors: Record<string, string> = {
    open: "bg-red-100 text-red-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
  }

  const findingTypeColors: Record<string, string> = {
    compliance: "bg-blue-100 text-blue-800",
    control: "bg-purple-100 text-purple-800",
    efficiency: "bg-orange-100 text-orange-800",
    security: "bg-red-100 text-red-800",
    financial: "bg-green-100 text-green-800",
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-muted-foreground">Loading compliance data...</div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Compliance & Audit</h1>
        <p className="text-muted-foreground">Monitor audit logs, compliance issues, reports, and risk assessments.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Audit Events</p>
                <p className="text-3xl font-bold">{totalAuditLogs}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            {highSeverityLogs > 0 && (
              <p className="text-xs text-red-600 mt-2">{highSeverityLogs} high severity</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Open Findings</p>
                <p className="text-3xl font-bold">{openFindings}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            {criticalFindings > 0 && (
              <p className="text-xs text-red-600 mt-2">{criticalFindings} critical</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Resolved Issues</p>
                <p className="text-3xl font-bold text-green-600">{resolvedFindings}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {auditFindings.length > 0 
                ? `${Math.round((resolvedFindings / auditFindings.length) * 100)}% resolution rate`
                : "No findings"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Risks</p>
                <p className="text-3xl font-bold">{activeRisks}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{publishedReports} published reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="risks">Risk Assessments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Critical Findings</CardTitle>
            </CardHeader>
            <CardContent>
              {auditFindings.filter(f => f.severity === "critical" && f.status !== "closed").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No critical findings at this time.
                </div>
              ) : (
                <div className="space-y-3">
                  {auditFindings
                    .filter(f => f.severity === "critical" && f.status !== "closed")
                    .slice(0, 5)
                    .map((finding) => (
                      <div
                        key={finding.id}
                        className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                        onClick={() => handleViewDetails(finding)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div>
                              <p className="font-semibold text-sm">{finding.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Type: {finding.finding_type} • Due: {finding.due_date || "Not set"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={severityColors[finding.severity]}>
                              {finding.severity}
                            </Badge>
                            <Badge className={statusColors[finding.status]}>
                              {finding.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>
                            <p className="text-sm text-muted-foreground ml-8">{finding.recommendation}</p>
                            {finding.resolution_notes && (
                              <div className="mt-2 ml-8 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs">
                                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Resolution Notes:</p>
                                <p className="text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{finding.resolution_notes}</p>
                              </div>
                            )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Audit Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="p-3 bg-secondary rounded-lg text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{log.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.user_name} • {log.module} • {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge className={severityColors[log.severity] || severityColors.low}>
                          {log.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Risk Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {riskAssessments.filter(r => r.status === "active").slice(0, 5).map((risk) => (
                    <div key={risk.id} className="p-3 bg-secondary rounded-lg text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{risk.risk_category}</p>
                          <p className="text-xs text-muted-foreground">
                            {risk.owner_name} • Impact: {risk.impact}
                          </p>
                        </div>
                        <Badge>
                          {risk.probability} prob.
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Findings Tab */}
        <TabsContent value="findings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Compliance Findings</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search findings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select
                    value={findingFilter.status || "all"}
                    onValueChange={(value) => setFindingFilter({ ...findingFilter, status: value === "all" ? undefined : value })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={findingFilter.severity || "all"}
                    onValueChange={(value) => setFindingFilter({ ...findingFilter, severity: value === "all" ? undefined : value })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredFindings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No findings found.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFindings.map((finding) => (
                    <div
                      key={finding.id}
                      className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-start gap-3 flex-1">
                          {finding.severity === "critical" && <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />}
                          <div className="flex-1">
                            <p className="font-semibold text-sm mb-1">{finding.description}</p>
                            <p className="text-xs text-muted-foreground mb-2">
                              Audit ID: {finding.audit_id} • Created: {new Date(finding.created_at).toLocaleDateString()}
                              {finding.due_date && ` • Due: ${new Date(finding.due_date).toLocaleDateString()}`}
                            </p>
                            <p className="text-sm text-muted-foreground mb-2">
                              <span className="font-medium">Recommendation:</span> {finding.recommendation}
                            </p>
                            {finding.resolution_notes && (
                              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs">
                                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Resolution Notes:</p>
                                <p className="text-blue-800 dark:text-blue-200 whitespace-pre-wrap line-clamp-2">{finding.resolution_notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge className={findingTypeColors[finding.finding_type]}>
                            {finding.finding_type}
                          </Badge>
                          <Badge className={severityColors[finding.severity]}>
                            {finding.severity}
                          </Badge>
                          <Badge className={statusColors[finding.status]}>
                            {finding.status.replace("_", " ")}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(finding)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            {(finding.status === "open" || finding.status === "in_progress") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedFinding(finding)
                                  setResolveStatus(finding.status === "open" ? "in_progress" : "resolved")
                                  setResolveNotes("")
                                  setShowResolveDialog(true)
                                }}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Audit Logs</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search logs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select
                    value={logFilter.severity || "all"}
                    onValueChange={(value) => setLogFilter({ ...logFilter, severity: value === "all" ? undefined : value })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No audit logs found.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          {log.severity === "high" || log.severity === "critical" ? (
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                          ) : (
                            <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                          )}
                          <div>
                            <p className="font-semibold text-sm">{log.action}</p>
                            <p className="text-xs text-muted-foreground">
                              By {log.user_name} ({log.department}) • {log.module} • {new Date(log.created_at).toLocaleString()}
                            </p>
                            {Object.keys(log.details).length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Details: {JSON.stringify(log.details)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className={severityColors[log.severity] || severityColors.low}>
                          {log.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {auditReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No audit reports found.
                </div>
              ) : (
                <div className="space-y-3">
                  {auditReports.map((report) => (
                    <div key={report.id} className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{report.title}</h3>
                            <Badge className={report.status === "published" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                              {report.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Period: {report.period} • Area: {report.audited_area}
                          </p>
                          {report.observations && (
                            <p className="text-sm mb-2">
                              <span className="font-medium">Observations:</span> {report.observations}
                            </p>
                          )}
                          {report.conclusion && (
                            <p className="text-sm">
                              <span className="font-medium">Conclusion:</span> {report.conclusion}
                            </p>
                          )}
                          {report.findings.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {report.findings.length} finding(s) referenced
                            </p>
                          )}
                        </div>
                        <div className="ml-4 flex flex-col gap-2">
                          {report.status === "published" && report.published_at && (
                            <p className="text-xs text-muted-foreground">
                              Published: {new Date(report.published_at).toLocaleDateString()}
                            </p>
                          )}
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Assessments Tab */}
        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              {riskAssessments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No risk assessments found.
                </div>
              ) : (
                <div className="space-y-3">
                  {riskAssessments.map((risk) => (
                    <div key={risk.id} className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{risk.risk_category}</h3>
                            <Badge className={risk.status === "active" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}>
                              {risk.status}
                            </Badge>
                          </div>
                          <p className="text-sm mb-2">{risk.description}</p>
                          <p className="text-sm mb-2">
                            <span className="font-medium">Mitigation:</span> {risk.mitigation}
                          </p>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>Probability: <Badge variant="outline">{risk.probability}</Badge></span>
                            <span>Impact: <Badge variant="outline">{risk.impact}</Badge></span>
                            <span>Owner: {risk.owner_name}</span>
                            {risk.last_review_date && (
                              <span>Last Review: {new Date(risk.last_review_date).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resolve Finding Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resolve Compliance Finding</DialogTitle>
            <DialogDescription>
              Update the status and add notes for this compliance finding.
            </DialogDescription>
          </DialogHeader>
          
          {selectedFinding && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Finding Description</label>
                <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-lg">
                  {selectedFinding.description}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Recommendation</label>
                <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-lg">
                  {selectedFinding.recommendation}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={resolveStatus} onValueChange={(value: any) => setResolveStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedFinding.resolution_notes && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Existing Resolution Notes</label>
                  <div className="p-3 bg-secondary rounded-lg mb-2 max-h-32 overflow-y-auto">
                    <p className="text-xs whitespace-pre-wrap text-muted-foreground">
                      {selectedFinding.resolution_notes}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {selectedFinding.resolution_notes ? "Add Additional Notes" : "Resolution Notes (Optional)"}
                </label>
                <Textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Add notes about the resolution or status update..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your notes will be appended with a timestamp to the resolution history.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolveFinding}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finding Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compliance Finding Details</DialogTitle>
            <DialogDescription>
              Complete information about this compliance finding
            </DialogDescription>
          </DialogHeader>
          
          {selectedFinding && (
            <div className="space-y-6">
              {/* Status and Severity */}
              <div className="flex items-center gap-4">
                <Badge className={severityColors[selectedFinding.severity]}>{selectedFinding.severity}</Badge>
                <Badge className={statusColors[selectedFinding.status]}>
                  {selectedFinding.status.replace("_", " ")}
                </Badge>
                <Badge className={findingTypeColors[selectedFinding.finding_type]}>
                  {selectedFinding.finding_type}
                </Badge>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Audit ID</label>
                  <p className="text-sm font-semibold">{selectedFinding.audit_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                  <p className="text-sm">{new Date(selectedFinding.created_at).toLocaleString()}</p>
                </div>
                {selectedFinding.due_date && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                    <p className="text-sm">{new Date(selectedFinding.due_date).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedFinding.resolved_date && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Resolved Date</label>
                    <p className="text-sm">{new Date(selectedFinding.resolved_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedFinding.description}</p>
                </div>
              </div>

              {/* Recommendation */}
              <div>
                <label className="text-sm font-medium mb-2 block">Recommendation</label>
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedFinding.recommendation}</p>
                </div>
              </div>

              {/* Resolution Notes */}
              {selectedFinding.resolution_notes && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Resolution Notes & History</label>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap text-blue-900 dark:text-blue-100">
                      {selectedFinding.resolution_notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                {(selectedFinding.status === "open" || selectedFinding.status === "in_progress") && (
                  <Button
                    onClick={() => {
                      setShowDetailDialog(false)
                      setResolveStatus(selectedFinding.status === "open" ? "in_progress" : "resolved")
                      setResolveNotes("")
                      setShowResolveDialog(true)
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Update Status
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
