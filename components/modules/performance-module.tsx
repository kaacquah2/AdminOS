"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { Plus, Star, Calendar, User, CheckCircle, Clock, FileText } from "lucide-react"
import { getPerformanceReviews, getEmployees, createPerformanceReview, updatePerformanceReview } from "@/lib/database"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function PerformanceModule() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [reviews, setReviews] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewReviewModal, setShowNewReviewModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState<any>(null)
  const [formData, setFormData] = useState({
    employee_id: "",
    period: "",
    rating: "3",
    comments: "",
    goals: [] as string[],
    status: "draft",
  })
  const [newGoal, setNewGoal] = useState("")

  useEffect(() => {
    loadData()
  }, [user])

  async function loadData() {
    try {
      setLoading(true)
      const [reviewsData, employeesData] = await Promise.all([
        getPerformanceReviews(),
        getEmployees(),
      ])

      // Join reviews with employee data
      const reviewsWithEmployees = await Promise.all(
        (reviewsData || []).map(async (review: any) => {
          const { data: employeeData } = await supabase
            .from("employees")
            .select("name, department, position")
            .eq("id", review.employee_id)
            .single()

          return {
            ...review,
            employee: employeeData || { name: "Unknown", department: "N/A", position: "N/A" },
          }
        })
      )

      setReviews(reviewsWithEmployees)
      setEmployees(employeesData || [])
    } catch (error) {
      console.error("Error loading performance data:", error)
      toast({
        title: "Error",
        description: "Failed to load performance review data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReview = async () => {
    if (!formData.employee_id || !formData.period) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      await createPerformanceReview({
        employee_id: formData.employee_id,
        reviewer_id: user?.id || "",
        period: formData.period,
        rating: parseInt(formData.rating),
        comments: formData.comments,
        goals: formData.goals,
        status: formData.status,
      })
      await loadData()
      setShowNewReviewModal(false)
      resetForm()
      toast({
        title: "Success",
        description: "Performance review created successfully.",
      })
    } catch (error) {
      console.error("Error creating review:", error)
      toast({
        title: "Error",
        description: "Failed to create performance review. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateReviewStatus = async (reviewId: string, newStatus: string) => {
    try {
      await updatePerformanceReview(reviewId, { status: newStatus })
      await loadData()
      toast({
        title: "Success",
        description: "Review status updated successfully.",
      })
    } catch (error) {
      console.error("Error updating review:", error)
      toast({
        title: "Error",
        description: "Failed to update review status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      employee_id: "",
      period: "",
      rating: "3",
      comments: "",
      goals: [],
      status: "draft",
    })
    setNewGoal("")
  }

  const addGoal = () => {
    if (newGoal.trim()) {
      setFormData({
        ...formData,
        goals: [...formData.goals, newGoal.trim()],
      })
      setNewGoal("")
    }
  }

  const removeGoal = (index: number) => {
    setFormData({
      ...formData,
      goals: formData.goals.filter((_, i) => i !== index),
    })
  }

  // Calculate stats
  const draftReviews = reviews.filter((r) => r.status === "draft").length
  const submittedReviews = reviews.filter((r) => r.status === "submitted").length
  const completedReviews = reviews.filter((r) => r.status === "reviewed").length
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

  // Group by status
  const reviewsByStatus = {
    draft: reviews.filter((r) => r.status === "draft"),
    submitted: reviews.filter((r) => r.status === "submitted"),
    reviewed: reviews.filter((r) => r.status === "reviewed"),
  }

  const getRatingStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
        }`}
      />
    ))
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      draft: "outline",
      submitted: "secondary",
      reviewed: "default",
    }
    return (
      <Badge variant={variants[status] || "outline"}>{status.toUpperCase()}</Badge>
    )
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading performance review data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Performance Reviews</h1>
          <p className="text-muted-foreground">
            Manage employee performance reviews, ratings, and development goals.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowNewReviewModal(true)}>
          <Plus className="w-4 h-4" />
          New Review
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Draft Reviews</p>
          <p className="text-3xl font-bold">{draftReviews}</p>
          <p className="text-xs text-orange-600 mt-2">Pending completion</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Submitted</p>
          <p className="text-3xl font-bold">{submittedReviews}</p>
          <p className="text-xs text-blue-600 mt-2">Awaiting review</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Completed</p>
          <p className="text-3xl font-bold">{completedReviews}</p>
          <p className="text-xs text-green-600 mt-2">Finalized reviews</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Average Rating</p>
          <p className="text-3xl font-bold">{averageRating.toFixed(1)}</p>
          <p className="text-xs text-purple-600 mt-2">Out of 5.0</p>
        </Card>
      </div>

      {/* Reviews by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Draft Reviews */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Draft</h2>
            <Badge variant="outline">{reviewsByStatus.draft.length}</Badge>
          </div>
          <div className="space-y-3">
            {reviewsByStatus.draft.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No draft reviews</p>
            ) : (
              reviewsByStatus.draft.map((review: any) => (
                <div
                  key={review.id}
                  className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                  onClick={() => setSelectedReview(review)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{review.employee?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{review.period}</p>
                    </div>
                    {getStatusBadge(review.status)}
                  </div>
                  <div className="flex items-center gap-1 mb-2">{getRatingStars(review.rating)}</div>
                  <p className="text-xs text-muted-foreground">
                    {review.employee?.department || "N/A"} • {review.employee?.position || "N/A"}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUpdateReviewStatus(review.id, "submitted")
                      }}
                    >
                      Submit
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Submitted Reviews */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Submitted</h2>
            <Badge variant="secondary">{reviewsByStatus.submitted.length}</Badge>
          </div>
          <div className="space-y-3">
            {reviewsByStatus.submitted.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No submitted reviews</p>
            ) : (
              reviewsByStatus.submitted.map((review: any) => (
                <div
                  key={review.id}
                  className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                  onClick={() => setSelectedReview(review)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{review.employee?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{review.period}</p>
                    </div>
                    {getStatusBadge(review.status)}
                  </div>
                  <div className="flex items-center gap-1 mb-2">{getRatingStars(review.rating)}</div>
                  <p className="text-xs text-muted-foreground">
                    {review.employee?.department || "N/A"} • {review.employee?.position || "N/A"}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUpdateReviewStatus(review.id, "reviewed")
                      }}
                    >
                      Finalize
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Completed Reviews */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Completed</h2>
            <Badge>{reviewsByStatus.reviewed.length}</Badge>
          </div>
          <div className="space-y-3">
            {reviewsByStatus.reviewed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No completed reviews</p>
            ) : (
              reviewsByStatus.reviewed.map((review: any) => (
                <div
                  key={review.id}
                  className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                  onClick={() => setSelectedReview(review)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{review.employee?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{review.period}</p>
                    </div>
                    {getStatusBadge(review.status)}
                  </div>
                  <div className="flex items-center gap-1 mb-2">{getRatingStars(review.rating)}</div>
                  <p className="text-xs text-muted-foreground">
                    {review.employee?.department || "N/A"} • {review.employee?.position || "N/A"}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Performance Review Details</DialogTitle>
              <DialogDescription>
                Review for {selectedReview.employee?.name || "Unknown Employee"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee</Label>
                  <p className="text-sm font-medium">{selectedReview.employee?.name || "Unknown"}</p>
                </div>
                <div>
                  <Label>Period</Label>
                  <p className="text-sm font-medium">{selectedReview.period}</p>
                </div>
                <div>
                  <Label>Department</Label>
                  <p className="text-sm">{selectedReview.employee?.department || "N/A"}</p>
                </div>
                <div>
                  <Label>Position</Label>
                  <p className="text-sm">{selectedReview.employee?.position || "N/A"}</p>
                </div>
                <div>
                  <Label>Rating</Label>
                  <div className="flex items-center gap-1">{getRatingStars(selectedReview.rating)}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div>{getStatusBadge(selectedReview.status)}</div>
                </div>
              </div>
              <div>
                <Label>Comments</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded">{selectedReview.comments || "No comments"}</p>
              </div>
              <div>
                <Label>Goals</Label>
                {selectedReview.goals && selectedReview.goals.length > 0 ? (
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {selectedReview.goals.map((goal: string, index: number) => (
                      <li key={index} className="text-sm">
                        {goal}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">No goals set</p>
                )}
              </div>
              <div>
                <Label>Created</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedReview.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedReview(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* New Review Modal */}
      <Dialog open={showNewReviewModal} onOpenChange={setShowNewReviewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Performance Review</DialogTitle>
            <DialogDescription>Create a new performance review for an employee.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee *</Label>
              <Select value={formData.employee_id} onValueChange={(value) => setFormData({ ...formData, employee_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} - {emp.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Review Period *</Label>
              <Input
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                placeholder="e.g., Q4 2024, Annual 2024"
              />
            </div>
            <div>
              <Label>Rating *</Label>
              <Select value={formData.rating} onValueChange={(value) => setFormData({ ...formData, rating: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Star</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Comments</Label>
              <Textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                placeholder="Enter review comments..."
                rows={4}
              />
            </div>
            <div>
              <Label>Goals</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Enter a goal..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addGoal()
                    }
                  }}
                />
                <Button type="button" onClick={addGoal}>
                  Add
                </Button>
              </div>
              {formData.goals.length > 0 && (
                <div className="space-y-1">
                  {formData.goals.map((goal, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{goal}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGoal(index)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowNewReviewModal(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateReview}>Create Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

