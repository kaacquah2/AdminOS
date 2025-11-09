"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getCSRProjects } from "@/lib/database"

interface RecordCommunityImpactModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function RecordCommunityImpactModal({ isOpen, onClose, onSubmit }: RecordCommunityImpactModalProps) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [formData, setFormData] = useState({
    impact_type: "people_reached",
    description: "",
    quantity: "",
    unit: "people",
    location: "",
    beneficiary_group: "",
    csr_project_id: "",
    impact_date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    if (isOpen) {
      loadProjects()
    }
  }, [isOpen])

  async function loadProjects() {
    try {
      const data = await getCSRProjects()
      setProjects(data || [])
    } catch (error) {
      console.error("Error loading projects:", error)
    }
  }

  const getUnits = () => {
    switch (formData.impact_type) {
      case "people_reached":
        return ["people", "individuals", "families"]
      case "funds_donated":
        return ["USD", "EUR", "local currency"]
      case "jobs_created":
        return ["jobs", "positions"]
      case "training_provided":
        return ["hours", "sessions", "participants"]
      default:
        return ["units"]
    }
  }

  const handleSubmit = () => {
    if (formData.description && formData.quantity && formData.impact_date) {
      onSubmit({
        ...formData,
        quantity: parseInt(formData.quantity),
        csr_project_id: formData.csr_project_id || undefined,
        recorded_by: user?.id || "",
        recorded_by_name: user?.fullName || "Unknown",
      })
      setFormData({
        impact_type: "people_reached",
        description: "",
        quantity: "",
        unit: "people",
        location: "",
        beneficiary_group: "",
        csr_project_id: "",
        impact_date: new Date().toISOString().split("T")[0],
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

        <h2 className="text-2xl font-bold mb-6">Record Community Impact</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Impact Type *</Label>
              <Select value={formData.impact_type} onValueChange={(value) => setFormData({ ...formData, impact_type: value, unit: value === "people_reached" ? "people" : value === "funds_donated" ? "USD" : value === "jobs_created" ? "jobs" : "hours" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="people_reached">People Reached</SelectItem>
                  <SelectItem value="funds_donated">Funds Donated</SelectItem>
                  <SelectItem value="jobs_created">Jobs Created</SelectItem>
                  <SelectItem value="training_provided">Training Provided</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Beneficiary Group</Label>
              <Select value={formData.beneficiary_group} onValueChange={(value) => setFormData({ ...formData, beneficiary_group: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="youth">Youth</SelectItem>
                  <SelectItem value="elderly">Elderly</SelectItem>
                  <SelectItem value="underserved_communities">Underserved Communities</SelectItem>
                  <SelectItem value="environment">Environment</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Quantity *</Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
                required
              />
            </div>

            <div>
              <Label>Unit</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getUnits().map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Impact Date *</Label>
              <Input
                type="date"
                value={formData.impact_date}
                onChange={(e) => setFormData({ ...formData, impact_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country..."
              />
            </div>

            <div>
              <Label>Related CSR Project (Optional)</Label>
              <Select value={formData.csr_project_id} onValueChange={(value) => setFormData({ ...formData, csr_project_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.project_number} - {project.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the impact achieved..."
              rows={4}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!formData.description || !formData.quantity}>
              Record Impact
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

