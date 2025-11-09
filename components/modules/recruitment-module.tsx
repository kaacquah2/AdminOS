"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Plus, Eye, Mail, Calendar, Phone, FileText, CheckCircle, XCircle } from "lucide-react"
import { NewJobPostingModal } from "@/components/modals/new-job-posting-modal"
import {
  getJobPostings,
  createJobPosting,
  getCandidates,
  createCandidate,
  updateCandidate,
  type JobPosting,
  type Candidate,
} from "@/lib/database"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function RecruitmentModule() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewJobPostingModal, setShowNewJobPostingModal] = useState(false)
  const [selectedJobPosting, setSelectedJobPosting] = useState<JobPosting | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [jobs, cands] = await Promise.all([getJobPostings(), getCandidates()])
      setJobPostings(jobs || [])
      setCandidates(cands || [])
    } catch (error) {
      console.error("Error loading recruitment data:", error)
      toast({
        title: "Error",
        description: "Failed to load recruitment data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitNewJobPosting = async (data: any) => {
    try {
      await createJobPosting({
        title: data.title,
        department: data.department,
        description: data.description,
        posted_by: user?.id,
        closing_date: data.closingDate,
      })
      await loadData()
      setShowNewJobPostingModal(false)
      toast({
        title: "Success",
        description: "Job posting created successfully.",
      })
    } catch (error) {
      console.error("Error creating job posting:", error)
      toast({
        title: "Error",
        description: "Failed to create job posting. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewApplicants = (job: JobPosting) => {
    setSelectedJobPosting(job)
  }

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [showCandidateModal, setShowCandidateModal] = useState(false)

  const handleUpdateCandidateStatus = async (candidateId: string, newStatus: string) => {
    try {
      await updateCandidate(candidateId, { status: newStatus })
      await loadData()
      toast({
        title: "Success",
        description: "Candidate status updated successfully.",
      })
    } catch (error) {
      console.error("Error updating candidate:", error)
      toast({
        title: "Error",
        description: "Failed to update candidate status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setShowCandidateModal(true)
  }

  const handleScheduleInterview = async (candidateId: string, interviewDate: string) => {
    try {
      await updateCandidate(candidateId, { 
        status: "interview",
        interview_date: new Date(interviewDate).toISOString()
      })
      await loadData()
      setShowCandidateModal(false)
      toast({
        title: "Success",
        description: "Interview scheduled successfully.",
      })
    } catch (error) {
      console.error("Error scheduling interview:", error)
      toast({
        title: "Error",
        description: "Failed to schedule interview. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Calculate stats from actual data
  const openPositions = jobPostings.filter((j) => j.status === "open").length
  const totalApplicants = candidates.length
  const thisMonthApplicants = candidates.filter((c) => {
    const created = new Date(c.created_at)
    const now = new Date()
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  }).length
  const inInterview = candidates.filter((c) => c.status === "interview").length
  const hiredThisYear = candidates.filter((c) => {
    if (c.status !== "hired") return false
    const updated = new Date(c.updated_at)
    return updated.getFullYear() === new Date().getFullYear()
  }).length

  // Calculate pipeline
  const pipeline = [
    {
      stage: "Applied",
      count: candidates.filter((c) => c.status === "applied").length,
      percentage: candidates.length > 0 ? (candidates.filter((c) => c.status === "applied").length / candidates.length) * 100 : 0,
    },
    {
      stage: "Screening",
      count: candidates.filter((c) => c.status === "screening").length,
      percentage: candidates.length > 0 ? (candidates.filter((c) => c.status === "screening").length / candidates.length) * 100 : 0,
    },
    {
      stage: "Interview",
      count: candidates.filter((c) => c.status === "interview").length,
      percentage: candidates.length > 0 ? (candidates.filter((c) => c.status === "interview").length / candidates.length) * 100 : 0,
    },
    {
      stage: "Offer",
      count: candidates.filter((c) => c.status === "offer").length,
      percentage: candidates.length > 0 ? (candidates.filter((c) => c.status === "offer").length / candidates.length) * 100 : 0,
    },
    {
      stage: "Hired",
      count: candidates.filter((c) => c.status === "hired").length,
      percentage: candidates.length > 0 ? (candidates.filter((c) => c.status === "hired").length / candidates.length) * 100 : 0,
    },
  ]

  const stageColors: Record<string, string> = {
    applied: "bg-gray-100 text-gray-800",
    screening: "bg-blue-100 text-blue-800",
    interview: "bg-purple-100 text-purple-800",
    offer: "bg-orange-100 text-orange-800",
    hired: "bg-green-100 text-green-800",
  }

  // Get candidates for selected job posting
  const jobCandidates = selectedJobPosting
    ? candidates.filter((c) => c.job_posting_id === selectedJobPosting.id)
    : candidates

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading recruitment data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Recruitment</h1>
          <p className="text-muted-foreground">Manage job postings, candidates, and hiring pipeline.</p>
        </div>
        <Button className="gap-2" onClick={() => setShowNewJobPostingModal(true)}>
          <Plus className="w-4 h-4" />
          New Job Posting
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Open Positions</p>
          <p className="text-3xl font-bold">{openPositions}</p>
          <p className="text-xs text-blue-600 mt-2">Actively hiring</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Applicants</p>
          <p className="text-3xl font-bold">{totalApplicants}</p>
          <p className="text-xs text-orange-600 mt-2">This month: {thisMonthApplicants}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">In Interview</p>
          <p className="text-3xl font-bold">{inInterview}</p>
          <p className="text-xs text-purple-600 mt-2">Pending decision</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Hired This Year</p>
          <p className="text-3xl font-bold">{hiredThisYear}</p>
          <p className="text-xs text-green-600 mt-2">2024 hires</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Job Postings</h2>
          <div className="space-y-3">
            {jobPostings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No job postings found</p>
            ) : (
              jobPostings.map((job) => {
                const applicantsCount = candidates.filter((c) => c.job_posting_id === job.id).length
                return (
                  <div key={job.id} className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{job.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.department} • {job.closing_date ? new Date(job.closing_date).toLocaleDateString() : "No closing date"}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded font-semibold ${
                          job.status === "open" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{applicantsCount} applicants</p>
                    <Button variant="outline" size="sm" className="gap-1 bg-transparent" onClick={() => handleViewApplicants(job)}>
                      <Eye className="w-3 h-3" />
                      View Applicants
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recruitment Pipeline</h2>
          <div className="space-y-4">
            {pipeline.map((stage) => (
              <div key={stage.stage}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{stage.stage}</span>
                  <span className="text-sm text-muted-foreground">{stage.count}</span>
                </div>
                <div className="w-full bg-secondary-foreground/20 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: `${Math.min(stage.percentage, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {selectedJobPosting ? `Candidates for ${selectedJobPosting.title}` : "All Candidates"}
          </h2>
          {selectedJobPosting && (
            <Button variant="outline" size="sm" onClick={() => setSelectedJobPosting(null)}>
              Show All
            </Button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Name</th>
                <th className="text-left py-3 px-4 font-semibold">Email</th>
                <th className="text-left py-3 px-4 font-semibold">Position</th>
                <th className="text-left py-3 px-4 font-semibold">Stage</th>
                <th className="text-left py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobCandidates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No candidates found
                  </td>
                </tr>
              ) : (
                jobCandidates.map((cand) => {
                  const job = jobPostings.find((j) => j.id === cand.job_posting_id)
                  return (
                    <tr key={cand.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="py-4 px-4 font-medium">{cand.name}</td>
                      <td className="py-4 px-4">{cand.email}</td>
                      <td className="py-4 px-4">{job?.title || "Unknown"}</td>
                      <td className="py-4 px-4">
                        <select
                          value={cand.status}
                          onChange={(e) => handleUpdateCandidateStatus(cand.id, e.target.value)}
                          className={`px-2 py-1 rounded text-xs font-semibold border-0 ${stageColors[cand.status] || "bg-gray-100 text-gray-800"}`}
                        >
                          <option value="applied">Applied</option>
                          <option value="screening">Screening</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer</option>
                          <option value="hired">Hired</option>
                        </select>
                      </td>
                      <td className="py-4 px-4">
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => window.open(`mailto:${cand.email}`)}>
                          <Mail className="w-3 h-3" />
                          Email
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <NewJobPostingModal
        isOpen={showNewJobPostingModal}
        onClose={() => setShowNewJobPostingModal(false)}
        onSubmit={handleSubmitNewJobPosting}
      />

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <Dialog open={showCandidateModal} onOpenChange={setShowCandidateModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Candidate Details</DialogTitle>
              <DialogDescription>
                {selectedCandidate.name} - {jobPostings.find(j => j.id === selectedCandidate.job_posting_id)?.title || "Unknown Position"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Name</p>
                  <p className="text-sm">{selectedCandidate.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                  <p className="text-sm">{selectedCandidate.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Phone</p>
                  <p className="text-sm">{selectedCandidate.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                  <Badge className={stageColors[selectedCandidate.status] || "bg-gray-100 text-gray-800"}>
                    {selectedCandidate.status}
                  </Badge>
                </div>
                {selectedCandidate.interview_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Interview Date</p>
                    <p className="text-sm">{new Date(selectedCandidate.interview_date).toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Applied Date</p>
                  <p className="text-sm">{new Date(selectedCandidate.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              {selectedCandidate.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm p-3 bg-muted rounded">{selectedCandidate.notes}</p>
                </div>
              )}
              {selectedCandidate.resume_url && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Resume</p>
                  <Button variant="outline" size="sm" onClick={() => window.open(selectedCandidate.resume_url, "_blank")}>
                    <FileText className="w-4 h-4 mr-2" />
                    View Resume
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCandidateModal(false)}>
                Close
              </Button>
              <Button onClick={() => window.open(`mailto:${selectedCandidate.email}`)}>
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
