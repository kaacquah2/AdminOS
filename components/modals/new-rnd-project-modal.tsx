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
import { supabase } from "@/lib/supabase"

interface NewRNDProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function NewRNDProjectModal({ isOpen, onClose, onSubmit }: NewRNDProjectModalProps) {
  const { user } = useAuth()
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [formData, setFormData] = useState({
    project_type: "basic_research",
    research_phase: "ideation",
    research_objective: "",
    hypothesis: "",
    methodology: "",
    expected_outcomes: "",
    success_criteria: "",
    risk_level: "medium",
    innovation_potential: "medium",
    commercialization_readiness: "0",
    start_date: new Date().toISOString().split("T")[0],
    target_completion_date: "",
    budget_allocated: "",
    team_lead_id: "",
    team_lead_name: "",
  })

  useEffect(() => {
    if (isOpen) {
      loadTeamMembers()
    }
  }, [isOpen])

  async function loadTeamMembers() {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, full_name, email, role")
        .eq("department", "Research & Development")
        .eq("is_active", true)
        .order("full_name")

      if (error) throw error
      setTeamMembers(data || [])
    } catch (error) {
      console.error("Error loading team members:", error)
    }
  }

  const handleSubmit = () => {
    if (formData.research_objective && formData.start_date) {
      const selectedMember = teamMembers.find(m => m.id === formData.team_lead_id)
      
      onSubmit({
        ...formData,
        commercialization_readiness: parseInt(formData.commercialization_readiness) || 0,
        budget_allocated: formData.budget_allocated ? parseFloat(formData.budget_allocated) : 0,
        team_lead_id: formData.team_lead_id || undefined,
        team_lead_name: selectedMember?.full_name || undefined,
        created_by: user?.id || "",
        created_by_name: user?.fullName || "Unknown",
      })
      setFormData({
        project_type: "basic_research",
        research_phase: "ideation",
        research_objective: "",
        hypothesis: "",
        methodology: "",
        expected_outcomes: "",
        success_criteria: "",
        risk_level: "medium",
        innovation_potential: "medium",
        commercialization_readiness: "0",
        start_date: new Date().toISOString().split("T")[0],
        target_completion_date: "",
        budget_allocated: "",
        team_lead_id: "",
        team_lead_name: "",
      })
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Create R&D Project</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Project Type *</Label>
              <Select value={formData.project_type} onValueChange={(value) => setFormData({ ...formData, project_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic_research">Basic Research</SelectItem>
                  <SelectItem value="applied_research">Applied Research</SelectItem>
                  <SelectItem value="product_development">Product Development</SelectItem>
                  <SelectItem value="process_improvement">Process Improvement</SelectItem>
                  <SelectItem value="technology_transfer">Technology Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Research Phase *</Label>
              <Select value={formData.research_phase} onValueChange={(value) => setFormData({ ...formData, research_phase: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ideation">Ideation</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="testing">Testing</SelectItem>
                  <SelectItem value="commercialization">Commercialization</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Research Objective *</Label>
            <Textarea
              value={formData.research_objective}
              onChange={(e) => setFormData({ ...formData, research_objective: e.target.value })}
              placeholder="Describe the research objective..."
              rows={3}
              required
            />
          </div>

          <div>
            <Label>Hypothesis (Optional)</Label>
            <Textarea
              value={formData.hypothesis}
              onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })}
              placeholder="State your research hypothesis..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div>
              <Label>Innovation Potential</Label>
              <Select value={formData.innovation_potential} onValueChange={(value) => setFormData({ ...formData, innovation_potential: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="breakthrough">Breakthrough</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
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
              <Label>Target Completion Date</Label>
              <Input
                type="date"
                value={formData.target_completion_date}
                onChange={(e) => setFormData({ ...formData, target_completion_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Commercialization Readiness (0-100)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.commercialization_readiness}
                onChange={(e) => setFormData({ ...formData, commercialization_readiness: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Budget Allocated (Optional)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.budget_allocated}
                onChange={(e) => setFormData({ ...formData, budget_allocated: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Team Lead (Optional)</Label>
              <Select value={formData.team_lead_id} onValueChange={(value) => {
                const member = teamMembers.find(m => m.id === value)
                setFormData({ ...formData, team_lead_id: value, team_lead_name: member?.full_name || "" })
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team lead..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Methodology (Optional)</Label>
            <Textarea
              value={formData.methodology}
              onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
              placeholder="Describe the research methodology..."
              rows={3}
            />
          </div>

          <div>
            <Label>Expected Outcomes (Optional)</Label>
            <Textarea
              value={formData.expected_outcomes}
              onChange={(e) => setFormData({ ...formData, expected_outcomes: e.target.value })}
              placeholder="Describe expected outcomes..."
              rows={2}
            />
          </div>

          <div>
            <Label>Success Criteria (Optional)</Label>
            <Textarea
              value={formData.success_criteria}
              onChange={(e) => setFormData({ ...formData, success_criteria: e.target.value })}
              placeholder="Define success criteria..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!formData.research_objective || !formData.start_date}>
              Create Project
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

