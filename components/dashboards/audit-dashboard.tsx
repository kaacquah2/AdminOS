"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { AlertCircle, CheckCircle2, TrendingUp, FileText, AlertTriangle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  getAuditLogs,
  getAuditFindings,
  getAuditReports,
  getRiskAssessments,
  type AuditLog,
  type AuditFinding,
  type AuditReport,
  type RiskAssessment,
} from "@/lib/database"

export function AuditDashboard() {
  const { user } = useAuth()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditFindings, setAuditFindings] = useState<AuditFinding[]>([])
  const [auditReports, setAuditReports] = useState<AuditReport[]>([])
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([])

  useEffect(() => {
    async function loadData() {
      const [logs, findings, reports, risks] = await Promise.all([
        getAuditLogs(),
        getAuditFindings(),
        getAuditReports(),
        getRiskAssessments(),
      ])
      setAuditLogs(logs)
      setAuditFindings(findings)
      setAuditReports(reports)
      setRiskAssessments(risks)
    }
    loadData()
  }, [])

  const findingsBySeverity = auditFindings.reduce(
    (acc, finding) => {
      acc[finding.severity] = (acc[finding.severity] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const risksByProbability = riskAssessments.reduce(
    (acc, risk) => {
      acc[risk.probability] = (acc[risk.probability] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const recentLogs = auditLogs.slice(0, 10)
  const openFindings = auditFindings.filter((f) => f.status === "open" || f.status === "in_progress")
  const activeRisks = riskAssessments.filter((r) => r.status === "active")

  const chartData = [
    { month: "Jan", audits: 12, findings: 8, risks: 5 },
    { month: "Feb", audits: 15, findings: 12, risks: 6 },
    { month: "Mar", audits: 18, findings: 10, risks: 7 },
    { month: "Apr", audits: 20, findings: 14, risks: 5 },
    { month: "May", audits: 22, findings: 11, risks: 4 },
    { month: "Jun", audits: 25, findings: 15, risks: 6 },
  ]

  const findingsPie = [
    { name: "Critical", value: findingsBySeverity.critical || 0, color: "#ef4444" },
    { name: "High", value: findingsBySeverity.high || 0, color: "#f97316" },
    { name: "Medium", value: findingsBySeverity.medium || 0, color: "#eab308" },
    { name: "Low", value: findingsBySeverity.low || 0, color: "#22c55e" },
  ]

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    }
    return colors[severity] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Audit Dashboard</h1>
        <p className="text-muted-foreground">Audit management, compliance monitoring, and risk assessment</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{auditLogs.length}</div>
              <AlertCircle className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Last 30 days activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-red-600">{openFindings.length}</div>
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Require action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-orange-600">{activeRisks.length}</div>
              <TrendingUp className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Under monitoring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Audit Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{auditReports.length}</div>
              <FileText className="h-8 w-8 text-green-500 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Completed audits</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Audit Trends</CardTitle>
            <CardDescription>Audits, findings, and risks over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="audits" stroke="#3b82f6" />
                <Line type="monotone" dataKey="findings" stroke="#ef4444" />
                <Line type="monotone" dataKey="risks" stroke="#f97316" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Findings by Severity</CardTitle>
            <CardDescription>Distribution of audit findings</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={findingsPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {findingsPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Findings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Findings</CardTitle>
          <CardDescription>Latest issues identified during audits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditFindings.slice(0, 5).map((finding) => (
              <div key={finding.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getSeverityColor(finding.severity)}>{finding.severity.toUpperCase()}</Badge>
                    <span className="font-medium text-sm">{finding.finding_type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{finding.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">Audited by: {finding.audited_by}</p>
                </div>
                <Badge variant={finding.status === "resolved" ? "default" : "destructive"}>{finding.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessments */}
      <Card>
        <CardHeader>
          <CardTitle>Active Risk Assessments</CardTitle>
          <CardDescription>Current organizational risks and mitigations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeRisks.slice(0, 5).map((risk) => (
              <div key={risk.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent">
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{risk.risk_category}</h4>
                  <p className="text-sm text-muted-foreground">{risk.description}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">Probability: {risk.probability}</Badge>
                    <Badge variant="outline">Impact: {risk.impact}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Mitigation: {risk.mitigation}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Logs</CardTitle>
          <CardDescription>System activity and user actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between text-sm p-2 border-b last:border-0">
                <div>
                  <span className="font-medium">{log.user_name}</span>
                  <span className="text-muted-foreground mx-2">·</span>
                  <span className="text-muted-foreground">{log.action}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getSeverityColor(log.severity)}>{log.severity}</Badge>
                  <span className="text-muted-foreground text-xs">{new Date(log.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
