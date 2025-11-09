"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Plus, FileText } from "lucide-react"
import { createAuditReport, getAuditReports, updateAuditReport, type AuditReport } from "@/lib/database"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export function AuditReportsModule() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [reports, setReports] = useState<AuditReport[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    period: "",
    auditedArea: "",
    observations: "",
    conclusion: "",
  })

  useEffect(() => {
    loadReports()
  }, [])

  async function loadReports() {
    try {
      setLoading(true)
      const data = await getAuditReports()
      setReports(data || [])
    } catch (error) {
      console.error("Error loading audit reports:", error)
      toast({
        title: "Error",
        description: "Failed to load audit reports. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!formData.title || !formData.period || !formData.auditedArea) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const newReport = await createAuditReport({
        title: formData.title,
        period: formData.period,
        audited_area: formData.auditedArea,
        created_by: user?.id || "",
        status: "draft",
        findings: [],
        observations: formData.observations,
        conclusion: formData.conclusion,
      })

      setReports([newReport, ...reports])
      setFormData({ title: "", period: "", auditedArea: "", observations: "", conclusion: "" })
      setShowForm(false)
      toast({
        title: "Success",
        description: "Audit report created successfully.",
      })
    } catch (error) {
      console.error("Error creating audit report:", error)
      toast({
        title: "Error",
        description: "Failed to create audit report. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function updateStatus(reportId: string, status: string) {
    try {
      const updated = await updateAuditReport(reportId, {
        status: status as "draft" | "submitted" | "approved" | "published",
        published_at: status === "published" ? new Date().toISOString() : undefined,
      })
      if (updated) {
        setReports(reports.map((r) => (r.id === reportId ? updated : r)))
        toast({
          title: "Success",
          description: "Audit report status updated successfully.",
        })
      }
    } catch (error) {
      console.error("Error updating audit report:", error)
      toast({
        title: "Error",
        description: "Failed to update audit report. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      published: "bg-purple-100 text-purple-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading audit reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Audit Reports</h1>
          <p className="text-muted-foreground">Create and manage comprehensive audit reports</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus size={20} />
          New Audit Report
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Create Audit Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Report Title</label>
              <Input
                placeholder="e.g., Q2 2024 Financial Audit"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Audit Period</label>
              <Input
                placeholder="e.g., April - June 2024"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Audited Area</label>
              <Input
                placeholder="e.g., Finance Department"
                value={formData.auditedArea}
                onChange={(e) => setFormData({ ...formData, auditedArea: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Observations</label>
              <Textarea
                placeholder="Document audit observations..."
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                className="mt-1"
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Conclusion</label>
              <Textarea
                placeholder="Summary and conclusion..."
                value={formData.conclusion}
                onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="flex-1">
                Create Report
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText size={48} className="text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No audit reports found</p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">By {report.created_by}</p>
                  </div>
                  <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Period</p>
                  <p className="text-sm">{report.period}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Audited Area</p>
                  <p className="text-sm">{report.audited_area}</p>
                </div>
                {report.observations && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Observations</p>
                    <p className="text-xs line-clamp-3">{report.observations}</p>
                  </div>
                )}
                {report.published_at && (
                  <p className="text-xs text-muted-foreground">
                    Published: {new Date(report.published_at).toLocaleDateString()}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  {report.status === "draft" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(report.id, "submitted")} className="flex-1">
                      Submit
                    </Button>
                  )}
                  {report.status === "submitted" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(report.id, "approved")} className="flex-1">
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(report.id, "published")} className="flex-1">
                        Publish
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
