"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createWellnessProgram } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"

interface NewWellnessProgramModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function NewWellnessProgramModal({ isOpen, onClose, onSuccess }: NewWellnessProgramModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [objectives, setObjectives] = useState<string[]>([])
  const [newObjective, setNewObjective] = useState("")
  const [formData, setFormData] = useState({
    program_name: "",
    program_type: "fitness",
    description: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    target_audience: "",
    participation_limit: "",
    budget_allocated: "",
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)

      await createWellnessProgram({
        program_name: formData.program_name,
        program_type: formData.program_type,
        description: formData.description,
        objectives: objectives.length > 0 ? objectives : undefined,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        target_audience: formData.target_audience || undefined,
        participation_limit: formData.participation_limit ? parseInt(formData.participation_limit) : undefined,
        budget_allocated: formData.budget_allocated ? parseFloat(formData.budget_allocated) : undefined,
        created_by: user.id,
        created_by_name: user.fullName,
      })

      toast({
        title: "Success",
        description: "Wellness program created successfully.",
      })

      // Reset form
      setFormData({
        program_name: "",
        program_type: "fitness",
        description: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        target_audience: "",
        participation_limit: "",
        budget_allocated: "",
      })
      setObjectives([])
      setNewObjective("")

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Error creating wellness program:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create wellness program.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addObjective = () => {
    if (newObjective.trim()) {
      setObjectives([...objectives, newObjective.trim()])
      setNewObjective("")
    }
  }

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Create New Wellness Program</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="program_name">Program Name *</Label>
              <Input
                id="program_name"
                value={formData.program_name}
                onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                required
                placeholder="e.g., Corporate Fitness Challenge"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="program_type">Program Type *</Label>
              <Select
                value={formData.program_type}
                onValueChange={(value) => setFormData({ ...formData, program_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="mental_health">Mental Health</SelectItem>
                  <SelectItem value="nutrition">Nutrition</SelectItem>
                  <SelectItem value="stress_management">Stress Management</SelectItem>
                  <SelectItem value="work_life_balance">Work-Life Balance</SelectItem>
                  <SelectItem value="financial_wellness">Financial Wellness</SelectItem>
                  <SelectItem value="preventive_care">Preventive Care</SelectItem>
                  <SelectItem value="smoking_cessation">Smoking Cessation</SelectItem>
                  <SelectItem value="weight_management">Weight Management</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              placeholder="Describe the wellness program..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Objectives (Optional)</Label>
            <div className="flex gap-2">
              <Input
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                placeholder="Add an objective"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addObjective()
                  }
                }}
              />
              <Button type="button" onClick={addObjective} variant="outline">
                Add
              </Button>
            </div>
            {objectives.length > 0 && (
              <div className="mt-2 space-y-1">
                {objectives.map((obj, index) => (
                  <div key={index} className="flex items-center justify-between bg-secondary p-2 rounded">
                    <span className="text-sm">{obj}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeObjective(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date (Optional)</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_audience">Target Audience (Optional)</Label>
              <Select
                value={formData.target_audience}
                onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_employees">All Employees</SelectItem>
                  <SelectItem value="specific_department">Specific Department</SelectItem>
                  <SelectItem value="remote_employees">Remote Employees</SelectItem>
                  <SelectItem value="executives">Executives</SelectItem>
                  <SelectItem value="new_hires">New Hires</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="participation_limit">Participation Limit (Optional)</Label>
              <Input
                id="participation_limit"
                type="number"
                value={formData.participation_limit}
                onChange={(e) => setFormData({ ...formData, participation_limit: e.target.value })}
                placeholder="Max participants"
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget_allocated">Budget Allocated (Optional)</Label>
            <Input
              id="budget_allocated"
              type="number"
              step="0.01"
              value={formData.budget_allocated}
              onChange={(e) => setFormData({ ...formData, budget_allocated: e.target.value })}
              placeholder="0.00"
              min="0"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Program"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

