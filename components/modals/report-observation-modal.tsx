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

interface ReportObservationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function ReportObservationModal({ isOpen, onClose, onSubmit }: ReportObservationModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    observation_type: "unsafe_condition",
    location: "",
    department: user?.department || "",
    description: "",
    risk_level: "low",
    immediate_action_taken: "",
    action_required: false,
  })

  const handleSubmit = () => {
    if (formData.location && formData.description && formData.department) {
      onSubmit({
        ...formData,
        observed_by: user?.id || "",
        observed_by_name: user?.fullName || "Unknown",
      })
      setFormData({
        observation_type: "unsafe_condition",
        location: "",
        department: user?.department || "",
        description: "",
        risk_level: "low",
        immediate_action_taken: "",
        action_required: false,
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

        <h2 className="text-2xl font-bold mb-6">Report Safety Observation</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Observation Type</Label>
              <Select value={formData.observation_type} onValueChange={(value) => setFormData({ ...formData, observation_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="safe_behavior">Safe Behavior</SelectItem>
                  <SelectItem value="unsafe_condition">Unsafe Condition</SelectItem>
                  <SelectItem value="unsafe_act">Unsafe Act</SelectItem>
                  <SelectItem value="positive">Positive Observation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Risk Level</Label>
              <Select value={formData.risk_level} onValueChange={(value) => setFormData({ ...formData, risk_level: value })}>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Location *</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Building, floor, area..."
                required
              />
            </div>

            <div>
              <Label>Department *</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what you observed..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label>Immediate Action Taken (Optional)</Label>
            <Textarea
              value={formData.immediate_action_taken}
              onChange={(e) => setFormData({ ...formData, immediate_action_taken: e.target.value })}
              placeholder="Any immediate actions taken to address the observation..."
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="action_required"
              checked={formData.action_required}
              onChange={(e) => setFormData({ ...formData, action_required: e.target.checked })}
            />
            <Label htmlFor="action_required">Action Required</Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!formData.location || !formData.description}>
              Submit Observation
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

