"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { getApprovalRequests, updateApprovalRequest, type ApprovalRequest } from "@/lib/database"
import { getApprovalWorkflows, approveAtLevel, rejectAtLevel, type ApprovalWorkflow } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Clock, XCircle } from "lucide-react"

export function ApprovalsModule() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending")
  const [tab, setTab] = useState<"traditional" | "workflows">("workflows")

  useEffect(() => {
    loadApprovals()
  }, [user])

  async function loadApprovals() {
    if (!user) return

    try {
      setLoading(true)
      const [userApprovals, userWorkflows] = await Promise.all([
        getApprovalRequests(user.id),
        getApprovalWorkflows(user.id),
      ])
      setApprovals(userApprovals || [])
      setWorkflows(userWorkflows || [])
    } catch (error) {
      console.error("Error loading approvals:", error)
      toast({
        title: "Error",
        description: "Failed to load approvals. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(id: string) {
    if (!user) return

    try {
      const updated = await updateApprovalRequest(id, {
        status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      if (updated) {
        setApprovals(approvals.map((a) => (a.id === id ? updated : a)))
        toast({
          title: "Success",
          description: "Request approved successfully.",
        })
        await loadApprovals()
      }
    } catch (error) {
      console.error("Error approving request:", error)
      toast({
        title: "Error",
        description: "Failed to approve request. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function handleReject(id: string) {
    if (!user) return

    try {
      const updated = await updateApprovalRequest(id, {
        status: "rejected",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      if (updated) {
        setApprovals(approvals.map((a) => (a.id === id ? updated : a)))
        toast({
          title: "Success",
          description: "Request rejected.",
        })
        await loadApprovals()
      }
    } catch (error) {
      console.error("Error rejecting request:", error)
      toast({
        title: "Error",
        description: "Failed to reject request. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function handleApproveWorkflow(workflowId: string, comments?: string) {
    if (!user) return

    try {
      const updated = await approveAtLevel(workflowId, user.id, comments)
      if (updated) {
        setWorkflows(workflows.map((w) => (w.id === workflowId ? updated : w)))
        toast({
          title: "Success",
          description: "Workflow approved successfully.",
        })
        await loadApprovals()
      }
    } catch (error) {
      console.error("Error approving workflow:", error)
      toast({
        title: "Error",
        description: "Failed to approve workflow. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function handleRejectWorkflow(workflowId: string, reason: string) {
    if (!user) return

    try {
      const updated = await rejectAtLevel(workflowId, user.id, reason)
      if (updated) {
        setWorkflows(workflows.map((w) => (w.id === workflowId ? updated : w)))
        toast({
          title: "Success",
          description: "Workflow rejected.",
        })
        await loadApprovals()
      }
    } catch (error) {
      console.error("Error rejecting workflow:", error)
      toast({
        title: "Error",
        description: "Failed to reject workflow. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredApprovals = approvals.filter((a) => {
    if (filter === "all") return true
    return a.status === filter
  })

  const filteredWorkflows = workflows.filter((w) => {
    if (filter === "all") return true
    return w.overall_status === filter
  })

  const statusColors: Record<ApprovalRequest["status"], string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading approvals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Approval Requests</h1>
        <p className="text-muted-foreground">Review and approve pending requests</p>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "workflows" ? "default" : "outline"} onClick={() => setTab("workflows")}>
          Multi-Level Workflows
        </Button>
        <Button variant={tab === "traditional" ? "default" : "outline"} onClick={() => setTab("traditional")}>
          Traditional Approvals
        </Button>
      </div>

      {tab === "workflows" && (
        <>
          <div className="flex gap-2">
            {(["pending", "approved", "rejected", "all"] as const).map((f) => (
              <Button key={f} variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWorkflows.length === 0 ? (
              <Card className="md:col-span-2">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock size={48} className="text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No approval workflows</p>
                </CardContent>
              </Card>
            ) : (
              filteredWorkflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <CardTitle className="text-lg capitalize">{workflow.request_type}</CardTitle>
                        <CardDescription>
                          Level {workflow.current_approval_level + 1} of {workflow.approval_chain.length}
                        </CardDescription>
                      </div>
                      <Badge
                        className={
                          workflow.overall_status === "approved"
                            ? "bg-green-600"
                            : workflow.overall_status === "rejected"
                              ? "bg-red-600"
                              : "bg-yellow-600"
                        }
                      >
                        {workflow.overall_status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {workflow.amount && <p className="text-sm font-semibold">Amount: ${workflow.amount.toFixed(2)}</p>}
                    <p className="text-sm text-muted-foreground">{workflow.description}</p>
                    <div className="space-y-2">
                      {workflow.approval_chain.map((level, idx) => (
                        <div key={idx} className="text-xs p-2 bg-muted rounded">
                          <p className="font-semibold capitalize">
                            {level.role} - Level {idx + 1}
                          </p>
                          <p className="text-muted-foreground">{level.status}</p>
                        </div>
                      ))}
                    </div>
                    {workflow.current_approval_level < workflow.approval_chain.length &&
                      workflow.approval_chain[workflow.current_approval_level].approver_ids.includes(user!.id) && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleApproveWorkflow(workflow.id)}
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleRejectWorkflow(workflow.id, "Rejected at approval level")}
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {tab === "traditional" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApprovals.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock size={48} className="text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No approval requests</p>
              </CardContent>
            </Card>
          ) : (
            filteredApprovals.map((approval) => (
              <Card key={approval.id}>
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <CardTitle className="text-lg capitalize">{approval.request_type}</CardTitle>
                      <CardDescription>By {approval.requested_by}</CardDescription>
                    </div>
                    <Badge className={statusColors[approval.status]}>{approval.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{approval.description}</p>
                  </div>
                  {approval.amount && (
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-semibold text-lg">${approval.amount.toFixed(2)}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{new Date(approval.created_at).toLocaleString()}</p>

                  {approval.status === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleApprove(approval.id)}
                        size="sm"
                        className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(approval.id)}
                        size="sm"
                        variant="destructive"
                        className="flex-1 gap-2"
                      >
                        <XCircle size={16} />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
