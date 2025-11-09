"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  AlertTriangle, 
  Shield, 
  TrendingDown, 
  TrendingUp,
  Clock,
  FileCheck,
  Users,
  Activity,
  Leaf,
  Target,
  AlertCircle,
  Calendar,
  Award,
  Zap
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { 
  createSafetyIncident, 
  createSafetyObservation, 
  createEnvironmentalMetric,
  updateSafetyIncident,
  updateSafetyInspection,
  updateCorrectiveAction,
  createCorrectiveAction,
  getSafetyIncidents,
  getSafetyInspections,
  getCorrectiveActions,
} from "@/lib/database"
import { ReportIncidentModal } from "@/components/modals/report-incident-modal"
import { ReportObservationModal } from "@/components/modals/report-observation-modal"
import { ReportEnvironmentalMetricModal } from "@/components/modals/report-environmental-metric-modal"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Eye, X } from "lucide-react"

export function HSEDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Data states
  const [incidents, setIncidents] = useState<any[]>([])
  const [inspections, setInspections] = useState<any[]>([])
  const [trainingRecords, setTrainingRecords] = useState<any[]>([])
  const [environmentalMetrics, setEnvironmentalMetrics] = useState<any[]>([])
  const [correctiveActions, setCorrectiveActions] = useState<any[]>([])
  const [observations, setObservations] = useState<any[]>([])

  // Modal states
  const [showReportIncident, setShowReportIncident] = useState(false)
  const [showReportObservation, setShowReportObservation] = useState(false)
  const [showReportEnvironmental, setShowReportEnvironmental] = useState(false)
  const [showIncidentDetail, setShowIncidentDetail] = useState(false)
  const [showInspectionDetail, setShowInspectionDetail] = useState(false)
  const [showActionDetail, setShowActionDetail] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<any>(null)
  const [selectedInspection, setSelectedInspection] = useState<any>(null)
  const [selectedAction, setSelectedAction] = useState<any>(null)
  
  // Management states
  const [investigationNotes, setInvestigationNotes] = useState("")
  const [rootCause, setRootCause] = useState("")
  const [inspectionFindings, setInspectionFindings] = useState("")
  const [actionCompletionNotes, setActionCompletionNotes] = useState("")
  
  const isManager = user?.role === "hse_manager" || 
                    user?.role === "dept_manager" || 
                    user?.role === "super_admin" ||
                    user?.department === "Health, Safety & Environment"

  // Metrics
  const [metrics, setMetrics] = useState({
    trir: 0,
    ltifr: 0,
    daysSinceLastIncident: 0,
    totalIncidents: 0,
    openCorrectiveActions: 0,
    overdueInspections: 0,
    trainingCompliance: 0,
    environmentalCompliance: 0,
  })

  useEffect(() => {
    loadHSEData()
  }, [user])

  async function loadHSEData() {
    if (!user) return

    try {
      setLoading(true)

      // Load incidents - managers see all, employees see their own
      let incidentsQuery = supabase.from("safety_incidents").select("*")
      if (!isManager) {
        incidentsQuery = incidentsQuery.eq("reported_by", user.id)
      }
      const { data: incidentsData } = await incidentsQuery
        .order("incident_date", { ascending: false })
        .limit(50)

      // Load inspections - managers see all, employees see their department
      let inspectionsQuery = supabase.from("safety_inspections").select("*")
      if (!isManager) {
        inspectionsQuery = inspectionsQuery.eq("department", user.department || "")
      }
      const { data: inspectionsData } = await inspectionsQuery
        .order("scheduled_date", { ascending: false })

      // Load training records - managers see all, employees see their own
      let trainingQuery = supabase.from("safety_training_records").select("*")
      if (!isManager) {
        trainingQuery = trainingQuery.eq("employee_id", user.id)
      }
      const { data: trainingData } = await trainingQuery
        .order("expiry_date", { ascending: true })

      // Load environmental metrics - managers see all, employees see their department
      let envQuery = supabase.from("environmental_metrics").select("*")
      if (!isManager) {
        envQuery = envQuery.eq("department", user.department || "")
      }
      const { data: envData } = await envQuery
        .order("measurement_date", { ascending: false })
        .limit(100)

      // Load corrective actions - managers see all, employees see assigned to them
      let actionsQuery = supabase.from("corrective_actions").select("*")
      if (!isManager) {
        actionsQuery = actionsQuery.eq("assigned_to", user.id)
      }
      const { data: actionsData } = await actionsQuery
        .order("due_date", { ascending: true })

      // Load observations - managers see all, employees see their own
      let obsQuery = supabase.from("safety_observations").select("*")
      if (!isManager) {
        obsQuery = obsQuery.eq("observed_by", user.id)
      }
      const { data: obsData } = await obsQuery
        .order("observation_date", { ascending: false })
        .limit(50)

      setIncidents(incidentsData || [])
      setInspections(inspectionsData || [])
      setTrainingRecords(trainingData || [])
      setEnvironmentalMetrics(envData || [])
      setCorrectiveActions(actionsData || [])
      setObservations(obsData || [])

      // Reload incidents using database function for better filtering
      const allIncidents = await getSafetyIncidents(isManager ? undefined : { department: user.department || "" })
      setIncidents(allIncidents || incidentsData || [])

      // Calculate metrics
      const now = new Date()
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      
      // Calculate TRIR and LTIFR (simplified - would use actual hours worked)
      const recordableIncidents = (incidentsData || []).filter(
        (i: any) => i.incident_type === "injury" && 
        ["moderate", "serious", "critical", "fatal"].includes(i.severity) &&
        new Date(i.incident_date) >= startOfYear
      ).length

      const lostTimeIncidents = (incidentsData || []).filter(
        (i: any) => i.incident_type === "injury" && 
        ["serious", "critical", "fatal"].includes(i.severity) &&
        new Date(i.incident_date) >= startOfYear
      ).length

      // Simplified calculation (assuming 100 employees, 2000 hours/year each)
      const totalHours = 100 * 2000
      const trir = totalHours > 0 ? (recordableIncidents * 200000) / totalHours : 0
      const ltifr = totalHours > 0 ? (lostTimeIncidents * 1000000) / totalHours : 0

      // Days since last incident
      const lastIncident = (incidentsData || []).find(
        (i: any) => i.incident_type === "injury" && i.severity !== "minor"
      )
      const daysSinceLastIncident = lastIncident
        ? Math.floor((now.getTime() - new Date(lastIncident.incident_date).getTime()) / (1000 * 60 * 60 * 24))
        : 999

      // Overdue inspections
      const overdueInspections = (inspectionsData || []).filter(
        (i: any) => i.status === "scheduled" && new Date(i.scheduled_date) < now
      ).length

      // Training compliance (percentage with valid certifications)
      const totalEmployees = new Set(trainingData?.map((t: any) => t.employee_id) || []).size
      const validCertifications = (trainingData || []).filter(
        (t: any) => t.status === "completed" && 
        (!t.expiry_date || new Date(t.expiry_date) > now)
      ).length
      const trainingCompliance = totalEmployees > 0 ? (validCertifications / totalEmployees) * 100 : 0

      // Environmental compliance
      const recentEnvMetrics = (envData || []).slice(0, 10)
      const envCompliant = recentEnvMetrics.filter((m: any) => m.compliance_status === "compliant").length
      const environmentalCompliance = recentEnvMetrics.length > 0 
        ? (envCompliant / recentEnvMetrics.length) * 100 
        : 100

      setMetrics({
        trir: Math.round(trir * 100) / 100,
        ltifr: Math.round(ltifr * 100) / 100,
        daysSinceLastIncident,
        totalIncidents: allIncidents?.length || incidentsData?.length || 0,
        openCorrectiveActions: (actionsData || []).filter((a: any) => a.status !== "completed").length,
        overdueInspections,
        trainingCompliance: Math.round(trainingCompliance),
        environmentalCompliance: Math.round(environmentalCompliance),
      })
    } catch (error) {
      console.error("Error loading HSE data:", error)
      toast({
        title: "Error",
        description: "Failed to load HSE data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handler functions for reporting
  const handleReportIncident = async (data: any) => {
    try {
      await createSafetyIncident(data)
      await loadHSEData()
      toast({
        title: "Success",
        description: "Incident reported successfully. HSE team will review it.",
      })
    } catch (error) {
      console.error("Error reporting incident:", error)
      toast({
        title: "Error",
        description: "Failed to report incident. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleReportObservation = async (data: any) => {
    try {
      await createSafetyObservation(data)
      await loadHSEData()
      toast({
        title: "Success",
        description: "Safety observation submitted successfully.",
      })
    } catch (error) {
      console.error("Error reporting observation:", error)
      toast({
        title: "Error",
        description: "Failed to submit observation. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleReportEnvironmental = async (data: any) => {
    try {
      await createEnvironmentalMetric(data)
      await loadHSEData()
      toast({
        title: "Success",
        description: "Environmental metric recorded successfully.",
      })
    } catch (error) {
      console.error("Error recording metric:", error)
      toast({
        title: "Error",
        description: "Failed to record metric. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Management functions
  const handleUpdateIncidentStatus = async (incidentId: string, status: string) => {
    try {
      const updates: any = { status }
      if (status === "investigating" && investigationNotes) {
        updates.investigation_notes = investigationNotes
      }
      if (status === "resolved" && rootCause) {
        updates.root_cause = rootCause
        updates.investigation_completed_at = new Date().toISOString()
      }
      if (status === "closed") {
        updates.closed_at = new Date().toISOString()
      }
      await updateSafetyIncident(incidentId, updates)
      await loadHSEData()
      setShowIncidentDetail(false)
      setSelectedIncident(null)
      setInvestigationNotes("")
      setRootCause("")
      toast({
        title: "Success",
        description: "Incident status updated successfully.",
      })
    } catch (error) {
      console.error("Error updating incident:", error)
      toast({
        title: "Error",
        description: "Failed to update incident. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCompleteInspection = async (inspectionId: string) => {
    try {
      const findings = inspectionFindings.split("\n").filter(f => f.trim())
      await updateSafetyInspection(inspectionId, {
        status: "completed",
        completed_date: new Date().toISOString().split("T")[0],
        findings: findings,
        non_conformances: findings.length,
      })
      await loadHSEData()
      setShowInspectionDetail(false)
      setSelectedInspection(null)
      setInspectionFindings("")
      toast({
        title: "Success",
        description: "Inspection completed successfully.",
      })
    } catch (error) {
      console.error("Error completing inspection:", error)
      toast({
        title: "Error",
        description: "Failed to complete inspection. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCompleteAction = async (actionId: string) => {
    try {
      await updateCorrectiveAction(actionId, {
        status: "completed",
        completed_date: new Date().toISOString().split("T")[0],
        completion_notes: actionCompletionNotes,
      })
      await loadHSEData()
      setShowActionDetail(false)
      setSelectedAction(null)
      setActionCompletionNotes("")
      toast({
        title: "Success",
        description: "Corrective action completed successfully.",
      })
    } catch (error) {
      console.error("Error completing action:", error)
      toast({
        title: "Error",
        description: "Failed to complete action. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Incident trends (last 12 months)
  const incidentTrends = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (11 - i))
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const monthIncidents = incidents.filter((inc: any) => {
      const incDate = new Date(inc.incident_date)
      return incDate >= monthStart && incDate <= monthEnd
    })

    return {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      incidents: monthIncidents.length,
      injuries: monthIncidents.filter((i: any) => i.incident_type === "injury").length,
      nearMisses: monthIncidents.filter((i: any) => i.incident_type === "near_miss").length,
    }
  })

  // Incident by type
  const incidentByType = incidents.reduce((acc: any, inc: any) => {
    acc[inc.incident_type] = (acc[inc.incident_type] || 0) + 1
    return acc
  }, {})

  const incidentTypeData = Object.entries(incidentByType).map(([type, count]) => ({
    type: type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    count,
  }))

  // Inspection status
  const inspectionStatus = inspections.reduce((acc: any, insp: any) => {
    acc[insp.status] = (acc[insp.status] || 0) + 1
    return acc
  }, {})

  const inspectionStatusData = Object.entries(inspectionStatus).map(([status, count]) => ({
    status: status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    count,
  }))

  // Environmental metrics trend
  const envTrend = environmentalMetrics.slice(0, 12).reverse().map((m: any) => ({
    date: new Date(m.measurement_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: parseFloat(m.value),
    category: m.category,
  }))

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading HSE dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">HSE Dashboard</h1>
          <p className="text-muted-foreground">
            {isManager 
              ? "Health, Safety & Environment Management - Monitor incidents, compliance, and performance metrics."
              : "Report safety incidents, observations, and environmental metrics."}
          </p>
        </div>
        {!isManager && (
          <div className="flex gap-2">
            <Button onClick={() => setShowReportIncident(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Report Incident
            </Button>
            <Button variant="outline" onClick={() => setShowReportObservation(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Report Observation
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="environmental">Environmental</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Safety Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">TRIR</p>
                    <p className="text-3xl font-bold">{metrics.trir}</p>
                    <p className="text-xs text-muted-foreground mt-1">per 200K hours</p>
                  </div>
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <div className="mt-2">
                  {metrics.trir < 2 ? (
                    <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                  ) : metrics.trir < 4 ? (
                    <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">LTIFR</p>
                    <p className="text-3xl font-bold">{metrics.ltifr}</p>
                    <p className="text-xs text-muted-foreground mt-1">per 1M hours</p>
                  </div>
                  <Activity className="w-8 h-8 text-red-600" />
                </div>
                <div className="mt-2">
                  {metrics.ltifr === 0 ? (
                    <Badge className="bg-green-100 text-green-800">Zero LTI</Badge>
                  ) : metrics.ltifr < 1 ? (
                    <Badge className="bg-yellow-100 text-yellow-800">Low</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">High</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Days Since Last Incident</p>
                    <p className="text-3xl font-bold">{metrics.daysSinceLastIncident}</p>
                    <p className="text-xs text-muted-foreground mt-1">Recordable incident</p>
                  </div>
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>
                <div className="mt-2">
                  {metrics.daysSinceLastIncident > 365 ? (
                    <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                  ) : metrics.daysSinceLastIncident > 90 ? (
                    <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">Recent Incident</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Training Compliance</p>
                    <p className="text-3xl font-bold">{metrics.trainingCompliance}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Valid certifications</p>
                  </div>
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
                <div className="mt-2">
                  {metrics.trainingCompliance >= 95 ? (
                    <Badge className="bg-green-100 text-green-800">Compliant</Badge>
                  ) : metrics.trainingCompliance >= 85 ? (
                    <Badge className="bg-yellow-100 text-yellow-800">At Risk</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">Non-Compliant</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Incidents (YTD)</p>
                    <p className="text-3xl font-bold">{metrics.totalIncidents}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Open Corrective Actions</p>
                    <p className="text-3xl font-bold text-yellow-600">{metrics.openCorrectiveActions}</p>
                  </div>
                  <Target className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Overdue Inspections</p>
                    <p className="text-3xl font-bold text-red-600">{metrics.overdueInspections}</p>
                  </div>
                  <Clock className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Environmental Compliance</p>
                    <p className="text-3xl font-bold">{metrics.environmentalCompliance}%</p>
                  </div>
                  <Leaf className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Incident Trends (12 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={incidentTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="incidents" stroke="#3b82f6" name="Total Incidents" />
                    <Line type="monotone" dataKey="injuries" stroke="#ef4444" name="Injuries" />
                    <Line type="monotone" dataKey="nearMisses" stroke="#f59e0b" name="Near Misses" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Incidents by Type</CardTitle>
              </CardHeader>
              <CardContent>
                {incidentTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={incidentTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, count }) => `${type}: ${count}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {incidentTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No incident data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Critical Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                {incidents.slice(0, 5).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No recent incidents</div>
                ) : (
                  <div className="space-y-3">
                    {incidents.slice(0, 5).map((incident: any) => (
                      <div key={incident.id} className="p-3 bg-secondary rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">{incident.incident_number}</p>
                            <p className="text-xs text-muted-foreground">{incident.description.substring(0, 60)}...</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {incident.location} • {new Date(incident.incident_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={
                            incident.severity === "fatal" ? "bg-red-600 text-white" :
                            incident.severity === "critical" ? "bg-red-100 text-red-800" :
                            incident.severity === "serious" ? "bg-orange-100 text-orange-800" :
                            "bg-yellow-100 text-yellow-800"
                          }>
                            {incident.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Overdue Corrective Actions</CardTitle>
              </CardHeader>
              <CardContent>
                {correctiveActions.filter((a: any) => 
                  a.status !== "completed" && new Date(a.due_date) < new Date()
                ).slice(0, 5).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No overdue actions</div>
                ) : (
                  <div className="space-y-3">
                    {correctiveActions
                      .filter((a: any) => a.status !== "completed" && new Date(a.due_date) < new Date())
                      .slice(0, 5)
                      .map((action: any) => (
                        <div key={action.id} className="p-3 bg-secondary rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-sm">{action.action_number}</p>
                              <p className="text-xs text-muted-foreground">{action.description.substring(0, 60)}...</p>
                              <p className="text-xs text-red-600 mt-1">
                                Due: {new Date(action.due_date).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Safety Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Incident #</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Severity</th>
                      <th className="text-left py-3 px-4 font-semibold">Location</th>
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No incidents recorded
                        </td>
                      </tr>
                    ) : (
                      incidents.map((incident: any) => (
                        <tr key={incident.id} className="border-b hover:bg-secondary/50">
                          <td className="py-4 px-4 font-medium">{incident.incident_number}</td>
                          <td className="py-4 px-4">{incident.incident_type.replace("_", " ")}</td>
                          <td className="py-4 px-4">
                            <Badge className={
                              incident.severity === "fatal" ? "bg-red-600 text-white" :
                              incident.severity === "critical" ? "bg-red-100 text-red-800" :
                              incident.severity === "serious" ? "bg-orange-100 text-orange-800" :
                              "bg-yellow-100 text-yellow-800"
                            }>
                              {incident.severity}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">{incident.location}</td>
                          <td className="py-4 px-4">{new Date(incident.incident_date).toLocaleDateString()}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Badge className={
                                incident.status === "closed" ? "bg-green-100 text-green-800" :
                                incident.status === "resolved" ? "bg-blue-100 text-blue-800" :
                                "bg-yellow-100 text-yellow-800"
                              }>
                                {incident.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedIncident(incident)
                                  setShowIncidentDetail(true)
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inspections Tab */}
        <TabsContent value="inspections" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Safety Inspections</CardTitle>
                {isManager && (
                  <Button onClick={() => {
                    // TODO: Add create inspection modal
                    toast({
                      title: "Info",
                      description: "Inspection creation feature coming soon.",
                    })
                  }} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Schedule Inspection
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Inspection #</th>
                        <th className="text-left py-3 px-4 font-semibold">Type</th>
                        <th className="text-left py-3 px-4 font-semibold">Location</th>
                        <th className="text-left py-3 px-4 font-semibold">Scheduled</th>
                        <th className="text-left py-3 px-4 font-semibold">Status</th>
                        <th className="text-left py-3 px-4 font-semibold">Findings</th>
                        <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspections.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No inspections scheduled
                        </td>
                      </tr>
                    ) : (
                      inspections.map((inspection: any) => (
                        <tr key={inspection.id} className="border-b hover:bg-secondary/50">
                          <td className="py-4 px-4 font-medium">{inspection.inspection_number}</td>
                          <td className="py-4 px-4">{inspection.inspection_type.replace("_", " ")}</td>
                          <td className="py-4 px-4">{inspection.location}</td>
                          <td className="py-4 px-4">{new Date(inspection.scheduled_date).toLocaleDateString()}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Badge className={
                                inspection.status === "completed" ? "bg-green-100 text-green-800" :
                                inspection.status === "overdue" ? "bg-red-100 text-red-800" :
                                inspection.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                                "bg-yellow-100 text-yellow-800"
                              }>
                                {inspection.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedInspection(inspection)
                                  setShowInspectionDetail(true)
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                          <td className="py-4 px-4">{inspection.non_conformances || 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Expiring Certifications (Next 30 Days): {
                    trainingRecords.filter((t: any) => {
                      if (!t.expiry_date) return false
                      const expiry = new Date(t.expiry_date)
                      const thirtyDaysFromNow = new Date()
                      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
                      return expiry <= thirtyDaysFromNow && expiry > new Date()
                    }).length
                  }
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Employee</th>
                      <th className="text-left py-3 px-4 font-semibold">Training</th>
                      <th className="text-left py-3 px-4 font-semibold">Completed</th>
                      <th className="text-left py-3 px-4 font-semibold">Expiry</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainingRecords.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No training records
                        </td>
                      </tr>
                    ) : (
                      trainingRecords.map((training: any) => {
                        const isExpiring = training.expiry_date && 
                          new Date(training.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
                          new Date(training.expiry_date) > new Date()
                        const isExpired = training.expiry_date && new Date(training.expiry_date) < new Date()

                        return (
                          <tr key={training.id} className={`border-b hover:bg-secondary/50 ${isExpired ? "bg-red-50" : isExpiring ? "bg-yellow-50" : ""}`}>
                            <td className="py-4 px-4">{training.employee_name}</td>
                            <td className="py-4 px-4">{training.training_name}</td>
                            <td className="py-4 px-4">
                              {training.completed_date ? new Date(training.completed_date).toLocaleDateString() : "N/A"}
                            </td>
                            <td className="py-4 px-4">
                              {training.expiry_date ? new Date(training.expiry_date).toLocaleDateString() : "N/A"}
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={
                                isExpired ? "bg-red-100 text-red-800" :
                                isExpiring ? "bg-yellow-100 text-yellow-800" :
                                training.status === "completed" ? "bg-green-100 text-green-800" :
                                "bg-gray-100 text-gray-800"
                              }>
                                {isExpired ? "Expired" : isExpiring ? "Expiring Soon" : training.status}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Environmental Tab */}
        <TabsContent value="environmental" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Environmental Metrics</CardTitle>
                <Button onClick={() => setShowReportEnvironmental(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Record Metric
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {envTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={envTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No environmental data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Corrective Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Corrective Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Action #</th>
                        <th className="text-left py-3 px-4 font-semibold">Description</th>
                        <th className="text-left py-3 px-4 font-semibold">Assigned To</th>
                        <th className="text-left py-3 px-4 font-semibold">Due Date</th>
                        <th className="text-left py-3 px-4 font-semibold">Priority</th>
                        <th className="text-left py-3 px-4 font-semibold">Status</th>
                        <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {correctiveActions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No corrective actions
                        </td>
                      </tr>
                    ) : (
                      correctiveActions.map((action: any) => {
                        const isOverdue = new Date(action.due_date) < new Date() && action.status !== "completed"
                        return (
                          <tr key={action.id} className={`border-b hover:bg-secondary/50 ${isOverdue ? "bg-red-50" : ""}`}>
                            <td className="py-4 px-4 font-medium">{action.action_number}</td>
                            <td className="py-4 px-4">{action.description.substring(0, 50)}...</td>
                            <td className="py-4 px-4">{action.assigned_to_name}</td>
                            <td className="py-4 px-4">{new Date(action.due_date).toLocaleDateString()}</td>
                            <td className="py-4 px-4">
                              <Badge className={
                                action.priority === "critical" ? "bg-red-100 text-red-800" :
                                action.priority === "high" ? "bg-orange-100 text-orange-800" :
                                action.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                                "bg-blue-100 text-blue-800"
                              }>
                                {action.priority}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={
                                action.status === "completed" ? "bg-green-100 text-green-800" :
                                isOverdue ? "bg-red-100 text-red-800" :
                                action.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                                "bg-yellow-100 text-yellow-800"
                              }>
                                {isOverdue ? "Overdue" : action.status}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedAction(action)
                                  setShowActionDetail(true)
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

