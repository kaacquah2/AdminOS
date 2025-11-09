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
import { getRNDProjects } from "@/lib/database"

interface NewRNDExperimentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function NewRNDExperimentModal({ isOpen, onClose, onSubmit }: NewRNDExperimentModalProps) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [formData, setFormData] = useState({
    rnd_project_id: "",
    experiment_name: "",
    experiment_type: "lab_experiment",
    hypothesis: "",
    objective: "",
    methodology: "",
    protocol: "",
    equipment_used: "",
    materials_used: "",
    experiment_date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    if (isOpen) {
      loadProjects()
    }
  }, [isOpen])

  async function loadProjects() {
    try {
      const data = await getRNDProjects({ status: "active" })
      setProjects(data || [])
    } catch (error) {
      console.error("Error loading projects:", error)
    }
  }

  const handleSubmit = () => {
    if (formData.experiment_name && formData.hypothesis && formData.objective && formData.experiment_date) {
      const equipment = formData.equipment_used
        .split(",")
        .map(e => e.trim())
        .filter(e => e.length > 0)

      const materials = formData.materials_used
        .split(",")
        .map(m => m.trim())
        .filter(m => m.length > 0)

      onSubmit({
        ...formData,
        rnd_project_id: formData.rnd_project_id || undefined,
        equipment_used: equipment.length > 0 ? equipment : undefined,
        materials_used: materials.length > 0 ? materials : undefined,
        conducted_by: user?.id || "",
        conducted_by_name: user?.fullName || "Unknown",
      })
      setFormData({
        rnd_project_id: "",
        experiment_name: "",
        experiment_type: "lab_experiment",
        hypothesis: "",
        objective: "",
        methodology: "",
        protocol: "",
        equipment_used: "",
        materials_used: "",
        experiment_date: new Date().toISOString().split("T")[0],
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

        <h2 className="text-2xl font-bold mb-6">Create Experiment</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Experiment Type</Label>
              <Select value={formData.experiment_type} onValueChange={(value) => setFormData({ ...formData, experiment_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lab_experiment">Lab Experiment</SelectItem>
                  <SelectItem value="simulation">Simulation</SelectItem>
                  <SelectItem value="field_test">Field Test</SelectItem>
                  <SelectItem value="prototype_test">Prototype Test</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Experiment Date *</Label>
              <Input
                type="date"
                value={formData.experiment_date}
                onChange={(e) => setFormData({ ...formData, experiment_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Related R&D Project (Optional)</Label>
            <Select value={formData.rnd_project_id} onValueChange={(value) => setFormData({ ...formData, rnd_project_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.project_number} - {project.research_objective.substring(0, 50)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Experiment Name *</Label>
            <Input
              value={formData.experiment_name}
              onChange={(e) => setFormData({ ...formData, experiment_name: e.target.value })}
              placeholder="Enter experiment name..."
              required
            />
          </div>

          <div>
            <Label>Hypothesis *</Label>
            <Textarea
              value={formData.hypothesis}
              onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })}
              placeholder="State your hypothesis..."
              rows={2}
              required
            />
          </div>

          <div>
            <Label>Objective *</Label>
            <Textarea
              value={formData.objective}
              onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
              placeholder="Describe the experiment objective..."
              rows={2}
              required
            />
          </div>

          <div>
            <Label>Methodology (Optional)</Label>
            <Textarea
              value={formData.methodology}
              onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
              placeholder="Describe the methodology..."
              rows={3}
            />
          </div>

          <div>
            <Label>Protocol (Optional)</Label>
            <Textarea
              value={formData.protocol}
              onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
              placeholder="Enter experimental protocol..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Equipment Used (Optional)</Label>
              <Input
                value={formData.equipment_used}
                onChange={(e) => setFormData({ ...formData, equipment_used: e.target.value })}
                placeholder="Comma-separated list..."
              />
              <p className="text-xs text-muted-foreground mt-1">Separate with commas</p>
            </div>

            <div>
              <Label>Materials Used (Optional)</Label>
              <Input
                value={formData.materials_used}
                onChange={(e) => setFormData({ ...formData, materials_used: e.target.value })}
                placeholder="Comma-separated list..."
              />
              <p className="text-xs text-muted-foreground mt-1">Separate with commas</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!formData.experiment_name || !formData.hypothesis || !formData.objective}>
              Create Experiment
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

