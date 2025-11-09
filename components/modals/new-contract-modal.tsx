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

interface NewContractModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function NewContractModal({ isOpen, onClose, onSubmit }: NewContractModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    contract_number: "",
    contract_name: "",
    contract_type: "vendor",
    party_name: "",
    party_type: "vendor",
    status: "draft",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    renewal_date: "",
    auto_renew: false,
    value: "",
    currency: "USD",
    department: "",
    description: "",
    document_url: "",
    notes: "",
    key_terms: "",
  })

  const handleSubmit = () => {
    if (formData.contract_number && formData.contract_name && formData.party_name && formData.start_date) {
      const keyTermsArray = formData.key_terms
        .split(",")
        .map(term => term.trim())
        .filter(term => term.length > 0)

      onSubmit({
        contract_number: formData.contract_number,
        contract_name: formData.contract_name,
        contract_type: formData.contract_type,
        party_name: formData.party_name,
        party_type: formData.party_type,
        status: formData.status,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        renewal_date: formData.renewal_date || undefined,
        auto_renew: formData.auto_renew,
        value: formData.value ? parseFloat(formData.value) : undefined,
        currency: formData.currency,
        department: formData.department || undefined,
        description: formData.description || undefined,
        document_url: formData.document_url || undefined,
        notes: formData.notes || undefined,
        key_terms: keyTermsArray.length > 0 ? keyTermsArray : undefined,
        owner_id: user?.id || undefined,
        owner_name: user?.fullName || undefined,
        created_by: user?.id || undefined,
      })
      
      // Reset form
      setFormData({
        contract_number: "",
        contract_name: "",
        contract_type: "vendor",
        party_name: "",
        party_type: "vendor",
        status: "draft",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        renewal_date: "",
        auto_renew: false,
        value: "",
        currency: "USD",
        department: "",
        description: "",
        document_url: "",
        notes: "",
        key_terms: "",
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

        <h2 className="text-2xl font-bold mb-6">Create New Contract</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Contract Number *</Label>
              <Input
                value={formData.contract_number}
                onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                placeholder="CNT-2024-001"
                required
              />
            </div>

            <div>
              <Label>Contract Name *</Label>
              <Input
                value={formData.contract_name}
                onChange={(e) => setFormData({ ...formData, contract_name: e.target.value })}
                placeholder="Enter contract name..."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Contract Type *</Label>
              <Select value={formData.contract_type} onValueChange={(value) => setFormData({ ...formData, contract_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="employment">Employment</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="lease">Lease</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="nda">NDA</SelectItem>
                  <SelectItem value="msa">MSA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                  <SelectItem value="pending_renewal">Pending Renewal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Party Name *</Label>
              <Input
                value={formData.party_name}
                onChange={(e) => setFormData({ ...formData, party_name: e.target.value })}
                placeholder="Other party to the contract"
                required
              />
            </div>

            <div>
              <Label>Party Type</Label>
              <Select value={formData.party_type} onValueChange={(value) => setFormData({ ...formData, party_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="landlord">Landlord</SelectItem>
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
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Renewal Date</Label>
              <Input
                type="date"
                value={formData.renewal_date}
                onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Contract Value</Label>
              <Input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <Label>Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Department</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Department responsible"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Contract description..."
              rows={3}
            />
          </div>

          <div>
            <Label>Key Terms (comma-separated)</Label>
            <Input
              value={formData.key_terms}
              onChange={(e) => setFormData({ ...formData, key_terms: e.target.value })}
              placeholder="Term 1, Term 2, Term 3..."
            />
          </div>

          <div>
            <Label>Document URL</Label>
            <Input
              value={formData.document_url}
              onChange={(e) => setFormData({ ...formData, document_url: e.target.value })}
              placeholder="Link to contract document"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto_renew"
              checked={formData.auto_renew}
              onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="auto_renew" className="cursor-pointer">Auto Renew</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Create Contract
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

