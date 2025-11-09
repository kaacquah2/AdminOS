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

interface NewCSRProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function NewCSRProjectModal({ isOpen, onClose, onSubmit }: NewCSRProjectModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    project_name: "",
    project_type: "community_engagement",
    description: "",
    location: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    budget_amount: "",
    partner_organizations: "",
  })

  const handleSubmit = () => {
    if (formData.project_name && formData.description && formData.start_date) {
      const partners = formData.partner_organizations
        .split(",")
        .map(p => p.trim())
        .filter(p => p.length > 0)

      onSubmit({
        ...formData,
        budget_amount: formData.budget_amount ? parseFloat(formData.budget_amount) : undefined,
        partner_organizations: partners.length > 0 ? partners : undefined,
        created_by: user?.id || "",
        created_by_name: user?.fullName || "Unknown",
      })
      setFormData({
        project_name: "",
        project_type: "community_engagement",
        description: "",
        location: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        budget_amount: "",
        partner_organizations: "",
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

        <h2 className="text-2xl font-bold mb-6">Create New CSR Project</h2>

        <div className="space-y-4">
          <div>
            <Label>Project Name *</Label>
            <Input
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              placeholder="Enter project name..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Project Type *</Label>
              <Select value={formData.project_type} onValueChange={(value) => setFormData({ ...formData, project_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="community_engagement">Community Engagement</SelectItem>
                  <SelectItem value="environmental">Environmental</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="disaster_relief">Disaster Relief</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>End Date (Optional)</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Budget Amount (Optional)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.budget_amount}
              onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label>Partner Organizations (Optional)</Label>
            <Input
              value={formData.partner_organizations}
              onChange={(e) => setFormData({ ...formData, partner_organizations: e.target.value })}
              placeholder="Comma-separated list of partner organizations..."
            />
            <p className="text-xs text-muted-foreground mt-1">Separate multiple partners with commas</p>
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a detailed description of the project..."
              rows={5}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!formData.project_name || !formData.description}>
              Create Project
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

