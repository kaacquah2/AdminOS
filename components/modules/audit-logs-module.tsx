"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileDown, Search } from "lucide-react"
import { getAuditLogs, type AuditLog } from "@/lib/database"
import { useAuth } from "@/contexts/auth-context"

export function AuditLogsModule() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [moduleFilter, setModuleFilter] = useState<string>("all")

  useEffect(() => {
    async function loadLogs() {
      const auditLogs = await getAuditLogs()
      setLogs(auditLogs)
      setFilteredLogs(auditLogs)
    }
    loadLogs()
  }, [])

  useEffect(() => {
    let filtered = logs
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    if (severityFilter !== "all") {
      filtered = filtered.filter((log) => log.severity === severityFilter)
    }
    if (moduleFilter !== "all") {
      filtered = filtered.filter((log) => log.module === moduleFilter)
    }
    setFilteredLogs(filtered)
  }, [searchTerm, severityFilter, moduleFilter, logs])

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    }
    return colors[severity] || "bg-gray-100 text-gray-800"
  }

  const exportLogs = () => {
    const csv = [
      ["User", "Department", "Action", "Module", "Severity", "Timestamp", "Details"],
      ...filteredLogs.map((log) => [
        log.user_name,
        log.department,
        log.action,
        log.module,
        log.severity,
        log.created_at,
        JSON.stringify(log.details),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const modules = [...new Set(logs.map((l) => l.module))]

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Audit Logs</h1>
        <p className="text-muted-foreground">Track all system activities and user actions</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Severity Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {modules.map((mod) => (
                  <SelectItem key={mod} value={mod}>
                    {mod}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={exportLogs} variant="outline" className="mt-4 gap-2 bg-transparent">
            <FileDown className="h-4 w-4" />
            Export to CSV
          </Button>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs.length} logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{log.user_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {log.department}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.action}</p>
                    <p className="text-xs text-muted-foreground mt-1">Module: {log.module}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getSeverityColor(log.severity)}>{log.severity.toUpperCase()}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">No audit logs found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
