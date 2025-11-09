"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { X, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getRNDProjects, getRNDExperiments, getRNDLabBookings } from "@/lib/database"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface BookLabModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function BookLabModal({ isOpen, onClose, onSubmit }: BookLabModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [projects, setProjects] = useState<any[]>([])
  const [experiments, setExperiments] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [conflicts, setConflicts] = useState<any[]>([])
  const [checkingConflicts, setCheckingConflicts] = useState(false)
  
  const [formData, setFormData] = useState({
    lab_space: "",
    asset_id: "",
    equipment_name: "",
    rnd_project_id: "",
    experiment_id: "",
    booking_date: new Date().toISOString().split("T")[0],
    start_time: "09:00",
    end_time: "17:00",
    purpose: "",
    special_requirements: "",
  })

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  useEffect(() => {
    if (formData.booking_date && formData.start_time && formData.end_time && formData.lab_space) {
      checkConflicts()
    } else {
      setConflicts([])
    }
  }, [formData.booking_date, formData.start_time, formData.end_time, formData.lab_space, formData.asset_id])

  async function loadData() {
    try {
      const [projectsData, experimentsData, assetsData] = await Promise.all([
        getRNDProjects({ status: "active" }),
        getRNDExperiments(),
        supabase.from("assets")
          .select("id, name, category")
          .eq("department", "Research & Development")
          .in("category", ["Lab Equipment", "Research Tools", "Testing Equipment"])
      ])

      setProjects(projectsData || [])
      setExperiments(experimentsData || [])
      setAssets(assetsData.data || [])
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  async function checkConflicts() {
    if (!formData.booking_date || !formData.start_time || !formData.end_time || !formData.lab_space) {
      return
    }

    setCheckingConflicts(true)
    try {
      const { data: existingBookings, error } = await supabase
        .from("rnd_lab_bookings")
        .select("*")
        .eq("booking_date", formData.booking_date)
        .eq("lab_space", formData.lab_space)
        .in("status", ["scheduled", "in_use"])

      if (error) throw error

      const requestedStart = new Date(`${formData.booking_date}T${formData.start_time}`)
      const requestedEnd = new Date(`${formData.booking_date}T${formData.end_time}`)

      const conflictsFound = (existingBookings || []).filter((booking: any) => {
        const bookingStart = new Date(`${booking.booking_date}T${booking.start_time}`)
        const bookingEnd = new Date(`${booking.booking_date}T${booking.end_time}`)

        // Check for time overlap
        return (
          (requestedStart >= bookingStart && requestedStart < bookingEnd) ||
          (requestedEnd > bookingStart && requestedEnd <= bookingEnd) ||
          (requestedStart <= bookingStart && requestedEnd >= bookingEnd)
        )
      })

      setConflicts(conflictsFound)

      if (conflictsFound.length > 0) {
        toast({
          title: "Conflict Detected",
          description: `${conflictsFound.length} conflicting booking(s) found for this time slot.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking conflicts:", error)
    } finally {
      setCheckingConflicts(false)
    }
  }

  const handleSubmit = () => {
    if (!formData.lab_space || !formData.booking_date || !formData.start_time || !formData.end_time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (conflicts.length > 0) {
      toast({
        title: "Warning",
        description: "There are conflicting bookings. Please adjust your time slot.",
        variant: "destructive",
      })
      return
    }

    onSubmit({
      ...formData,
      asset_id: formData.asset_id || undefined,
      equipment_name: formData.equipment_name || undefined,
      rnd_project_id: formData.rnd_project_id || undefined,
      experiment_id: formData.experiment_id || undefined,
      purpose: formData.purpose || undefined,
      special_requirements: formData.special_requirements || undefined,
      booked_by: user?.id || "",
      booked_by_name: user?.fullName || "Unknown",
    })
    setFormData({
      lab_space: "",
      asset_id: "",
      equipment_name: "",
      rnd_project_id: "",
      experiment_id: "",
      booking_date: new Date().toISOString().split("T")[0],
      start_time: "09:00",
      end_time: "17:00",
      purpose: "",
      special_requirements: "",
    })
    setConflicts([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Book Lab Space</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Lab Space *</Label>
              <Select value={formData.lab_space} onValueChange={(value) => setFormData({ ...formData, lab_space: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lab space..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lab A">Lab A</SelectItem>
                  <SelectItem value="Lab B">Lab B</SelectItem>
                  <SelectItem value="Lab C">Lab C</SelectItem>
                  <SelectItem value="Clean Room">Clean Room</SelectItem>
                  <SelectItem value="Testing Lab">Testing Lab</SelectItem>
                  <SelectItem value="Prototype Lab">Prototype Lab</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Equipment (Optional)</Label>
              <Select value={formData.asset_id} onValueChange={(value) => {
                const asset = assets.find(a => a.id === value)
                setFormData({ ...formData, asset_id: value, equipment_name: asset?.name || "" })
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name} ({asset.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Booking Date *</Label>
              <Input
                type="date"
                value={formData.booking_date}
                onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Start Time *</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>End Time *</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          {conflicts.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900 mb-2">Booking Conflicts Detected</p>
                  <div className="space-y-2">
                    {conflicts.map((conflict: any) => (
                      <div key={conflict.id} className="text-xs bg-white p-2 rounded">
                        <p className="font-medium">{conflict.booking_number}</p>
                        <p className="text-muted-foreground">
                          {conflict.start_time} - {conflict.end_time} • Booked by {conflict.booked_by_name}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-red-700 mt-2">Please select a different time slot.</p>
                </div>
              </div>
            </div>
          )}

          {!checkingConflicts && conflicts.length === 0 && formData.booking_date && formData.start_time && formData.end_time && formData.lab_space && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-green-600" />
                <p className="text-xs text-green-700">No conflicts detected. Time slot is available.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Related Project (Optional)</Label>
              <Select value={formData.rnd_project_id} onValueChange={(value) => setFormData({ ...formData, rnd_project_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.project_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Related Experiment (Optional)</Label>
              <Select value={formData.experiment_id} onValueChange={(value) => setFormData({ ...formData, experiment_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select experiment..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {experiments.map((exp) => (
                    <SelectItem key={exp.id} value={exp.id}>
                      {exp.experiment_number} - {exp.experiment_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Purpose (Optional)</Label>
            <Textarea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="Describe the purpose of this booking..."
              rows={2}
            />
          </div>

          <div>
            <Label>Special Requirements (Optional)</Label>
            <Textarea
              value={formData.special_requirements}
              onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })}
              placeholder="Any special requirements or safety considerations..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleSubmit} 
              disabled={!formData.lab_space || !formData.booking_date || conflicts.length > 0}
            >
              Book Lab
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

