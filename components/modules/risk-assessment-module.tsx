"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, AlertTriangle } from "lucide-react"
import { createRiskAssessment, getRiskAssessments, updateRiskAssessment, type RiskAssessment } from "@/lib/database"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export function RiskAssessmentModule() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [risks, setRisks] = useState<RiskAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    riskCategory: "",
    description: "",
    probability: "medium" as const,
    impact: "medium" as const,
    mitigation: "",
  })

  useEffect(() => {
    loadRisks()
  }, [])

  async function loadRisks() {
    try {
      setLoading(true)
      const data = await getRiskAssessments()
      setRisks(data || [])
    } catch (error) {
      console.error("Error loading risk assessments:", error)
      toast({
        title: "Error",
        description: "Failed to load risk assessments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!formData.riskCategory || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const newRisk = await createRiskAssessment({
        riskCategory: formData.riskCategory,
        description: formData.description,
        probability: formData.probability,
        impact: formData.impact,
        mitigation: formData.mitigation,
        owner: user?.fullName || "Unknown",
        status: "active",
      })

      setRisks([newRisk, ...risks])
      setFormData({ riskCategory: "", description: "", probability: "medium", impact: "medium", mitigation: "" })
      setShowForm(false)
      toast({
        title: "Success",
        description: "Risk assessment created successfully.",
      })
    } catch (error) {
      console.error("Error creating risk assessment:", error)
      toast({
        title: "Error",
        description: "Failed to create risk assessment. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function updateRiskStatus(riskId: string, status: string) {
    try {
      const updated = await updateRiskAssessment(riskId, {
        status: status as "active" | "mitigated" | "closed",
        lastReviewDate: new Date().toISOString(),
      })
      if (updated) {
        setRisks(risks.map((r) => (r.id === riskId ? updated : r)))
        toast({
          title: "Success",
          description: "Risk assessment updated successfully.",
        })
      }
    } catch (error) {
      console.error("Error updating risk assessment:", error)
      toast({
        title: "Error",
        description: "Failed to update risk assessment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getRiskColor = (probability: string, impact: string) => {
    if (
      (probability === "high" && impact === "high") ||
      (probability === "high" && impact === "critical") ||
      (probability === "critical" && impact === "high") ||
      (probability === "critical" && impact === "critical")
    ) {
      return "border-l-4 border-red-600"
    }
    if ((probability === "high" && impact === "medium") || (probability === "medium" && impact === "high")) {
      return "border-l-4 border-orange-500"
    }
    return "border-l-4 border-yellow-500"
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading risk assessments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Risk Assessment</h1>
          <p className="text-muted-foreground">Identify, assess, and mitigate organizational risks</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus size={20} />
          New Risk Assessment
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Create Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Risk Category</label>
              <Input
                placeholder="e.g., Operational, Financial, Compliance"
                value={formData.riskCategory}
                onChange={(e) => setFormData({ ...formData, riskCategory: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe the risk..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Probability</label>
                <Select
                  value={formData.probability}
                  onValueChange={(value: any) => setFormData({ ...formData, probability: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Impact</label>
                <Select
                  value={formData.impact}
                  onValueChange={(value: any) => setFormData({ ...formData, impact: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Mitigation Strategy</label>
              <Textarea
                placeholder="How to mitigate this risk..."
                value={formData.mitigation}
                onChange={(e) => setFormData({ ...formData, mitigation: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="flex-1">
                Create Assessment
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {risks.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle size={48} className="text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No risk assessments found</p>
            </CardContent>
          </Card>
        ) : (
          risks.map((risk) => (
            <Card key={risk.id} className={getRiskColor(risk.probability, risk.impact)}>
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <CardTitle className="text-lg">{risk.riskCategory}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Owner: {risk.owner}</p>
                  </div>
                  <Badge
                    className={
                      risk.status === "active"
                        ? "bg-yellow-100 text-yellow-800"
                        : risk.status === "mitigated"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                    }
                  >
                    {risk.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{risk.description}</p>
                <div className="flex gap-2">
                  <Badge variant="outline">Probability: {risk.probability}</Badge>
                  <Badge variant="outline">Impact: {risk.impact}</Badge>
                </div>
                {risk.mitigation && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Mitigation:</p>
                    <p className="text-xs">{risk.mitigation}</p>
                  </div>
                )}
                {risk.lastReviewDate && (
                  <p className="text-xs text-muted-foreground">
                    Last reviewed: {new Date(risk.lastReviewDate).toLocaleDateString()}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  {risk.status === "active" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRiskStatus(risk.id, "mitigated")}
                        className="flex-1"
                      >
                        Mark Mitigated
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRiskStatus(risk.id, "closed")}
                        className="flex-1"
                      >
                        Close
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
