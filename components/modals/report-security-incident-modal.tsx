"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface ReportSecurityIncidentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function ReportSecurityIncidentModal({ isOpen, onClose, onSubmit }: ReportSecurityIncidentModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    incident_type: "unauthorized_access",
    severity: "medium",
    title: "",
    description: "",
    affected_users: "",
    affected_systems: "",
  })

  const handleSubmit = () => {
    if (formData.title && formData.description) {
      const affectedSystems = formData.affected_systems
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0)

      onSubmit({
        ...formData,
        affected_users: formData.affected_users ? parseInt(formData.affected_users) : undefined,
        affected_systems: affectedSystems.length > 0 ? affectedSystems : undefined,
        detected_by: user?.id || "",
        detected_by_name: user?.fullName || "Unknown",
      })
      setFormData({
        incident_type: "unauthorized_access",
        severity: "medium",
        title: "",
        description: "",
        affected_users: "",
        affected_systems: "",
      })
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Report Security Incident</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Incident Type *</Label>
              <Select value={formData.incident_type} onValueChange={(value) => setFormData({ ...formData, incident_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
                  <SelectItem value="data_breach">Data Breach</SelectItem>
                  <SelectItem value="malware">Malware</SelectItem>
                  <SelectItem value="phishing">Phishing</SelectItem>
                  <SelectItem value="policy_violation">Policy Violation</SelectItem>
                  <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Severity *</Label>
              <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
                <SelectTrigger>
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
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief title of the incident..."
              required
            />
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide detailed description of the incident..."
              rows={6}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Affected Users (Optional)</Label>
              <Input
                type="number"
                value={formData.affected_users}
                onChange={(e) => setFormData({ ...formData, affected_users: e.target.value })}
                placeholder="0"
              />
            </div>

            <div>
              <Label>Affected Systems (Optional)</Label>
              <Input
                value={formData.affected_systems}
                onChange={(e) => setFormData({ ...formData, affected_systems: e.target.value })}
                placeholder="Comma-separated list..."
              />
              <p className="text-xs text-muted-foreground mt-1">Separate multiple systems with commas</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!formData.title || !formData.description}>
              Report Incident
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

