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

interface NewVolunteerActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function NewVolunteerActivityModal({ isOpen, onClose, onSubmit }: NewVolunteerActivityModalProps) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [formData, setFormData] = useState({
    activity_name: "",
    activity_type: "community_service",
    description: "",
    location: "",
    activity_date: new Date().toISOString().split("T")[0],
    duration_hours: "",
    csr_project_id: "",
  })

  useEffect(() => {
    if (isOpen) {
      loadProjects()
    }
  }, [isOpen])

  async function loadProjects() {
    try {
      const data = await getCSRProjects({ status: "active" })
      setProjects(data || [])
    } catch (error) {
      console.error("Error loading projects:", error)
    }
  }

  const handleSubmit = () => {
    if (formData.activity_name && formData.description && formData.activity_date && formData.duration_hours) {
      onSubmit({
        ...formData,
        duration_hours: parseFloat(formData.duration_hours),
        csr_project_id: formData.csr_project_id || undefined,
        organizer_id: user?.id || "",
        organizer_name: user?.fullName || "Unknown",
      })
      setFormData({
        activity_name: "",
        activity_type: "community_service",
        description: "",
        location: "",
        activity_date: new Date().toISOString().split("T")[0],
        duration_hours: "",
        csr_project_id: "",
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

        <h2 className="text-2xl font-bold mb-6">Schedule Volunteer Activity</h2>

        <div className="space-y-4">
          <div>
            <Label>Activity Name *</Label>
            <Input
              value={formData.activity_name}
              onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
              placeholder="Enter activity name..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Activity Type *</Label>
              <Select value={formData.activity_type} onValueChange={(value) => setFormData({ ...formData, activity_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="community_service">Community Service</SelectItem>
                  <SelectItem value="environmental_cleanup">Environmental Cleanup</SelectItem>
                  <SelectItem value="mentoring">Mentoring</SelectItem>
                  <SelectItem value="fundraising">Fundraising</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Duration (Hours) *</Label>
              <Input
                type="number"
                step="0.5"
                value={formData.duration_hours}
                onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                placeholder="4.0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Activity Date *</Label>
              <Input
                type="date"
                value={formData.activity_date}
                onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Address or location..."
              />
            </div>
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

          <div>
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the volunteer activity..."
              rows={4}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!formData.activity_name || !formData.description || !formData.duration_hours}>
              Schedule Activity
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

