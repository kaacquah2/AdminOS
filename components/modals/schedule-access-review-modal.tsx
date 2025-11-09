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

interface ScheduleAccessReviewModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function ScheduleAccessReviewModal({ isOpen, onClose, onSubmit }: ScheduleAccessReviewModalProps) {
  const { user } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [formData, setFormData] = useState({
    review_type: "user_access",
    target_user_id: "",
    target_user_name: "",
    target_role: "",
    target_department: "",
    review_date: new Date().toISOString().split("T")[0],
    next_review_date: "",
    findings: "",
    recommendations: "",
  })

  useEffect(() => {
    if (isOpen && formData.review_type === "user_access") {
      loadUsers()
    }
  }, [isOpen, formData.review_type])

  async function loadUsers() {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, full_name, email, role, department")
        .eq("is_active", true)
        .order("full_name")

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  const handleSubmit = () => {
    if (formData.review_date && formData.review_type) {
      const findings = formData.findings
        .split("\n")
        .map(f => f.trim())
        .filter(f => f.length > 0)

      onSubmit({
        ...formData,
        target_user_id: formData.target_user_id || undefined,
        target_user_name: formData.target_user_name || undefined,
        target_role: formData.target_role || undefined,
        target_department: formData.target_department || undefined,
        findings: findings.length > 0 ? findings : undefined,
        recommendations: formData.recommendations || undefined,
        next_review_date: formData.next_review_date || undefined,
        reviewer_id: user?.id || "",
        reviewer_name: user?.fullName || "Unknown",
      })
      setFormData({
        review_type: "user_access",
        target_user_id: "",
        target_user_name: "",
        target_role: "",
        target_department: "",
        review_date: new Date().toISOString().split("T")[0],
        next_review_date: "",
        findings: "",
        recommendations: "",
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

        <h2 className="text-2xl font-bold mb-6">Schedule Access Review</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Review Type *</Label>
              <Select value={formData.review_type} onValueChange={(value) => setFormData({ ...formData, review_type: value, target_user_id: "", target_user_name: "", target_role: "", target_department: "" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user_access">User Access</SelectItem>
                  <SelectItem value="role_permissions">Role Permissions</SelectItem>
                  <SelectItem value="department_access">Department Access</SelectItem>
                  <SelectItem value="system_access">System Access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Review Date *</Label>
              <Input
                type="date"
                value={formData.review_date}
                onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                required
              />
            </div>
          </div>

          {formData.review_type === "user_access" && (
            <div>
              <Label>Target User</Label>
              <Select value={formData.target_user_id} onValueChange={(value) => {
                const selectedUser = users.find(u => u.id === value)
                setFormData({ ...formData, target_user_id: value, target_user_name: selectedUser?.full_name || "" })
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name} ({u.email}) - {u.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.review_type === "role_permissions" && (
            <div>
              <Label>Target Role</Label>
              <Input
                value={formData.target_role}
                onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                placeholder="e.g., hr_manager, finance_officer..."
              />
            </div>
          )}

          {formData.review_type === "department_access" && (
            <div>
              <Label>Target Department</Label>
              <Input
                value={formData.target_department}
                onChange={(e) => setFormData({ ...formData, target_department: e.target.value })}
                placeholder="e.g., Human Resources, Finance..."
              />
            </div>
          )}

          <div>
            <Label>Next Review Date (Optional)</Label>
            <Input
              type="date"
              value={formData.next_review_date}
              onChange={(e) => setFormData({ ...formData, next_review_date: e.target.value })}
            />
          </div>

          <div>
            <Label>Findings (Optional)</Label>
            <Textarea
              value={formData.findings}
              onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
              placeholder="Enter findings, one per line..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">Enter one finding per line</p>
          </div>

          <div>
            <Label>Recommendations (Optional)</Label>
            <Textarea
              value={formData.recommendations}
              onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
              placeholder="Enter recommendations..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!formData.review_date}>
              Schedule Review
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

