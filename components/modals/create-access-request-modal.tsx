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

interface CreateAccessRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function CreateAccessRequestModal({ isOpen, onClose, onSubmit }: CreateAccessRequestModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    request_type: "role_change",
    requested_role: "",
    requested_permission: "",
    requested_resource: "",
    justification: "",
    expiry_date: "",
  })

  const handleSubmit = () => {
    if (formData.justification && (formData.requested_role || formData.requested_permission || formData.requested_resource)) {
      onSubmit({
        ...formData,
        requested_role: formData.requested_role || undefined,
        requested_permission: formData.requested_permission || undefined,
        requested_resource: formData.requested_resource || undefined,
        expiry_date: formData.expiry_date || undefined,
        requester_id: user?.id || "",
        requester_name: user?.fullName || "Unknown",
      })
      setFormData({
        request_type: "role_change",
        requested_role: "",
        requested_permission: "",
        requested_resource: "",
        justification: "",
        expiry_date: "",
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

        <h2 className="text-2xl font-bold mb-6">Request Access</h2>

        <div className="space-y-4">
          <div>
            <Label>Request Type *</Label>
            <Select value={formData.request_type} onValueChange={(value) => setFormData({ ...formData, request_type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="role_change">Role Change</SelectItem>
                <SelectItem value="permission_add">Add Permission</SelectItem>
                <SelectItem value="permission_remove">Remove Permission</SelectItem>
                <SelectItem value="breakglass_access">Breakglass Access</SelectItem>
                <SelectItem value="data_access">Data Access</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.request_type === "role_change" && (
            <div>
              <Label>Requested Role *</Label>
              <Input
                value={formData.requested_role}
                onChange={(e) => setFormData({ ...formData, requested_role: e.target.value })}
                placeholder="e.g., hr_manager, finance_officer..."
                required
              />
            </div>
          )}

          {formData.request_type === "permission_add" || formData.request_type === "permission_remove" ? (
            <div>
              <Label>Permission Key *</Label>
              <Input
                value={formData.requested_permission}
                onChange={(e) => setFormData({ ...formData, requested_permission: e.target.value })}
                placeholder="e.g., view_confidential, manage_users..."
                required
              />
            </div>
          ) : null}

          {formData.request_type === "data_access" && (
            <div>
              <Label>Requested Resource *</Label>
              <Input
                value={formData.requested_resource}
                onChange={(e) => setFormData({ ...formData, requested_resource: e.target.value })}
                placeholder="e.g., employee_salaries, financial_reports..."
                required
              />
            </div>
          )}

          {formData.request_type === "breakglass_access" && (
            <div>
              <Label>Resource/System *</Label>
              <Input
                value={formData.requested_resource}
                onChange={(e) => setFormData({ ...formData, requested_resource: e.target.value })}
                placeholder="System or resource requiring emergency access..."
                required
              />
            </div>
          )}

          <div>
            <Label>Justification *</Label>
            <Textarea
              value={formData.justification}
              onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
              placeholder="Explain why you need this access..."
              rows={5}
              required
            />
          </div>

          <div>
            <Label>Expiry Date (Optional)</Label>
            <Input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">Leave empty for permanent access</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleSubmit} 
              disabled={!formData.justification || (!formData.requested_role && !formData.requested_permission && !formData.requested_resource)}
            >
              Submit Request
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

