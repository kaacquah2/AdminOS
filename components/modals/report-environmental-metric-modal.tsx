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

interface ReportEnvironmentalMetricModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function ReportEnvironmentalMetricModal({ isOpen, onClose, onSubmit }: ReportEnvironmentalMetricModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    metric_type: "waste",
    category: "non_hazardous_waste",
    measurement_date: new Date().toISOString().split("T")[0],
    value: "",
    unit: "kg",
    location: "",
    department: user?.department || "",
    notes: "",
  })

  const handleSubmit = () => {
    if (formData.value && formData.category && formData.department) {
      onSubmit({
        ...formData,
        value: parseFloat(formData.value),
        recorded_by: user?.id || "",
        recorded_by_name: user?.fullName || "Unknown",
      })
      setFormData({
        metric_type: "waste",
        category: "non_hazardous_waste",
        measurement_date: new Date().toISOString().split("T")[0],
        value: "",
        unit: "kg",
        location: "",
        department: user?.department || "",
        notes: "",
      })
      onClose()
    }
  }

  const getCategories = () => {
    switch (formData.metric_type) {
      case "waste":
        return [
          { value: "hazardous_waste", label: "Hazardous Waste" },
          { value: "non_hazardous_waste", label: "Non-Hazardous Waste" },
          { value: "recyclable", label: "Recyclable" },
        ]
      case "emissions":
        return [
          { value: "co2_emissions", label: "CO2 Emissions" },
          { value: "other_greenhouse_gases", label: "Other Greenhouse Gases" },
        ]
      case "water":
        return [
          { value: "water_consumption", label: "Water Consumption" },
          { value: "water_discharge", label: "Water Discharge" },
        ]
      case "energy":
        return [
          { value: "energy_consumption", label: "Energy Consumption" },
          { value: "renewable_energy", label: "Renewable Energy" },
        ]
      default:
        return []
    }
  }

  const getUnits = () => {
    switch (formData.metric_type) {
      case "waste":
        return ["kg", "tons", "lbs"]
      case "emissions":
        return ["kg CO2e", "tons CO2e", "metric tons"]
      case "water":
        return ["m3", "liters", "gallons"]
      case "energy":
        return ["kWh", "MWh", "GJ"]
      default:
        return ["units"]
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Record Environmental Metric</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Metric Type</Label>
              <Select value={formData.metric_type} onValueChange={(value) => setFormData({ ...formData, metric_type: value, category: "" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="waste">Waste</SelectItem>
                  <SelectItem value="emissions">Emissions</SelectItem>
                  <SelectItem value="water">Water</SelectItem>
                  <SelectItem value="energy">Energy</SelectItem>
                  <SelectItem value="recycling">Recycling</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getCategories().map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Value *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="0.00"
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
              <Label>Measurement Date</Label>
              <Input
                type="date"
                value={formData.measurement_date}
                onChange={(e) => setFormData({ ...formData, measurement_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Location (Optional)</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Building, area..."
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
            <Label>Notes (Optional)</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this measurement..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!formData.value || !formData.category}>
              Submit Metric
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

