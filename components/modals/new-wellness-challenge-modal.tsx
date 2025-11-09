"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createWellnessChallenge } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"

interface NewWellnessChallengeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function NewWellnessChallengeModal({ isOpen, onClose, onSuccess }: NewWellnessChallengeModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    challenge_name: "",
    challenge_type: "step_challenge",
    description: "",
    rules: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    participation_type: "individual",
    max_participants: "",
    reward_type: "",
    reward_description: "",
    tracking_method: "manual",
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)

      await createWellnessChallenge({
        challenge_name: formData.challenge_name,
        challenge_type: formData.challenge_type,
        description: formData.description,
        rules: formData.rules || undefined,
        start_date: formData.start_date,
        end_date: formData.end_date,
        participation_type: formData.participation_type,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined,
        reward_type: formData.reward_type || undefined,
        reward_description: formData.reward_description || undefined,
        tracking_method: formData.tracking_method || undefined,
        created_by: user.id,
        created_by_name: user.fullName,
      })

      toast({
        title: "Success",
        description: "Wellness challenge created successfully.",
      })

      // Reset form
      setFormData({
        challenge_name: "",
        challenge_type: "step_challenge",
        description: "",
        rules: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        participation_type: "individual",
        max_participants: "",
        reward_type: "",
        reward_description: "",
        tracking_method: "manual",
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Error creating wellness challenge:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create wellness challenge.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Create New Wellness Challenge</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="challenge_name">Challenge Name *</Label>
              <Input
                id="challenge_name"
                value={formData.challenge_name}
                onChange={(e) => setFormData({ ...formData, challenge_name: e.target.value })}
                required
                placeholder="e.g., 10K Steps Daily Challenge"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="challenge_type">Challenge Type *</Label>
              <Select
                value={formData.challenge_type}
                onValueChange={(value) => setFormData({ ...formData, challenge_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="step_challenge">Step Challenge</SelectItem>
                  <SelectItem value="weight_loss">Weight Loss</SelectItem>
                  <SelectItem value="meditation">Meditation</SelectItem>
                  <SelectItem value="hydration">Hydration</SelectItem>
                  <SelectItem value="sleep">Sleep</SelectItem>
                  <SelectItem value="nutrition">Nutrition</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="mindfulness">Mindfulness</SelectItem>
                  <SelectItem value="reading">Reading</SelectItem>
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
              placeholder="Describe the wellness challenge..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rules">Rules (Optional)</Label>
            <Textarea
              id="rules"
              value={formData.rules}
              onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
              placeholder="Challenge rules and guidelines..."
              rows={3}
            />
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
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
                min={formData.start_date}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="participation_type">Participation Type *</Label>
              <Select
                value={formData.participation_type}
                onValueChange={(value) => setFormData({ ...formData, participation_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="company_wide">Company Wide</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_participants">Max Participants (Optional)</Label>
              <Input
                id="max_participants"
                type="number"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tracking_method">Tracking Method *</Label>
              <Select
                value={formData.tracking_method}
                onValueChange={(value) => setFormData({ ...formData, tracking_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Entry</SelectItem>
                  <SelectItem value="wearable">Wearable Device</SelectItem>
                  <SelectItem value="app">Mobile App</SelectItem>
                  <SelectItem value="hybrid">Hybrid (Manual + Device)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reward_type">Reward Type (Optional)</Label>
              <Select
                value={formData.reward_type}
                onValueChange={(value) => setFormData({ ...formData, reward_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reward type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Points</SelectItem>
                  <SelectItem value="badge">Badge</SelectItem>
                  <SelectItem value="gift_card">Gift Card</SelectItem>
                  <SelectItem value="cash">Cash Prize</SelectItem>
                  <SelectItem value="time_off">Time Off</SelectItem>
                  <SelectItem value="recognition">Recognition</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reward_description">Reward Description (Optional)</Label>
            <Textarea
              id="reward_description"
              value={formData.reward_description}
              onChange={(e) => setFormData({ ...formData, reward_description: e.target.value })}
              placeholder="Describe the rewards for completing the challenge..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Challenge"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

