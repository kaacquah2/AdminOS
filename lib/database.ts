// Database functions using Supabase
import { supabase } from "@/lib/supabase"

// Re-export interfaces for compatibility
export interface WorkflowTask {
  id: string
  title: string
  description: string
  assigned_to: string
  assigned_by: string
  department: string
  status: "pending" | "in_progress" | "completed" | "approved" | "rejected"
  priority: "low" | "medium" | "high" | "critical"
  due_date: string
  created_at: string
  completed_at?: string
  attachments: string[]
  comments?: Array<{
    id: string
    author: string
    text: string
    timestamp: string
  }>
}

export interface Message {
  id: string
  sender_id: string
  sender_name: string
  recipient_id?: string
  recipient_name?: string
  department_id?: string
  subject: string
  body: string
  type: "direct" | "department" | "broadcast"
  status: "unread" | "read"
  created_at: string
  attachments: string[]
}

export interface EmailLog {
  id: string
  to_email: string
  subject: string
  body: string
  status: "sent" | "pending" | "failed"
  created_at: string
  sent_at?: string
  type: "task_assignment" | "approval" | "notification" | "reminder"
}

export interface Announcement {
  id: string
  created_by: string
  title: string
  content: string
  priority: "low" | "medium" | "high"
  visibility: "all" | "department" | "role"
  target_department?: string
  target_role?: string
  created_at: string
  expires_at?: string
}

export interface ApprovalRequest {
  id: string
  request_type: "expense" | "leave" | "asset" | "project" | "budget"
  requested_by: string
  approved_by?: string
  status: "pending" | "approved" | "rejected"
  amount?: number
  description: string
  details: Record<string, unknown>
  created_at: string
  approved_at?: string
}

export interface PerformanceReview {
  id: string
  employee_id: string
  reviewer_id: string
  period: string
  rating: number
  comments: string
  goals: string[]
  status: "draft" | "submitted" | "reviewed"
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  user_name: string
  department: string
  action: string
  module: string
  created_at: string
  details: Record<string, unknown>
  severity: "low" | "medium" | "high" | "critical"
}

export interface AuditFinding {
  id: string
  audit_id: string
  audited_by: string
  finding_type: "compliance" | "control" | "efficiency" | "security" | "financial"
  severity: "low" | "medium" | "high" | "critical"
  description: string
  recommendation: string
  status: "open" | "in_progress" | "resolved" | "closed"
  due_date?: string
  resolved_date?: string
  resolution_notes?: string
  created_at: string
}

export interface AuditReport {
  id: string
  title: string
  period: string
  audited_area: string
  created_by: string
  approved_by?: string
  status: "draft" | "submitted" | "approved" | "published"
  findings: string[]
  observations: string
  conclusion: string
  created_at: string
  published_at?: string
}

export interface RiskAssessment {
  id: string
  risk_category: string
  description: string
  probability: "low" | "medium" | "high"
  impact: "low" | "medium" | "high" | "critical"
  mitigation: string
  owner_id: string
  owner_name: string
  status: "active" | "mitigated" | "closed"
  created_at: string
  last_review_date?: string
}

export interface ApprovalWorkflow {
  id: string
  request_type: "expense" | "leave" | "asset" | "project" | "budget"
  requested_by: string
  approval_chain: Array<{
    level: number
    role: string
    approver_ids: string[]
    status: "pending" | "approved" | "rejected"
    approved_by?: string
    approved_at?: string
    comments?: string
  }>
  current_approval_level: number
  overall_status: "pending" | "approved" | "rejected"
  amount?: number
  description: string
  details: Record<string, unknown>
  created_at: string
}

export const APPROVAL_WORKFLOWS = {
  budget: [
    { role: "executive", threshold: 0, label: "CEO (All budgets)" },
    { role: "finance_director", threshold: 50000, label: "Finance Director (50K+)" },
    { role: "dept_manager", threshold: 10000, label: "Department Manager (10K+)" },
  ],
  leave: [
    { role: "executive", threshold: 0, label: "CEO" },
    { role: "dept_manager", threshold: 0, label: "Department Manager" },
    { role: "hr_head", threshold: 0, label: "HR Head" },
  ],
  expense: [
    { role: "finance_director", threshold: 0, label: "Finance Director (All)" },
    { role: "dept_manager", threshold: 5000, label: "Dept Manager (5K+)" },
  ],
  project: [
    { role: "executive", threshold: 100000, label: "CEO (100K+)" },
    { role: "dept_manager", threshold: 0, label: "Department Manager (All)" },
  ],
  asset: [
    { role: "procurement_officer", threshold: 0, label: "Procurement Officer" },
    { role: "finance_director", threshold: 50000, label: "Finance Director (50K+)" },
  ],
}

// Initialize database - no longer needed with Supabase
export function initializeDatabase() {
  // Supabase handles initialization automatically
  return Promise.resolve()
}

// Workflow functions
export async function createWorkflowTask(task: Omit<WorkflowTask, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("workflow_tasks")
    .insert({
      title: task.title,
      description: task.description,
      assigned_to: task.assigned_to,
      assigned_by: task.assigned_by,
      department: task.department,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      completed_at: task.completed_at,
      attachments: task.attachments || [],
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getWorkflowTasks(userId?: string) {
  let query = supabase.from("workflow_tasks").select("*")

  if (userId) {
    query = query.or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateWorkflowTask(taskId: string, updates: Partial<WorkflowTask>) {
  const { data, error } = await supabase
    .from("workflow_tasks")
    .update(updates)
    .eq("id", taskId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Message functions
export async function createMessage(message: Omit<Message, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: message.sender_id,
      sender_name: message.sender_name,
      recipient_id: message.recipient_id,
      recipient_name: message.recipient_name,
      department_id: message.department_id,
      subject: message.subject,
      body: message.body,
      type: message.type,
      status: message.status,
      attachments: message.attachments || [],
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMessages(userId: string, filter?: "direct" | "department" | "broadcast") {
  let query = supabase.from("messages").select("*")

  if (filter) {
    query = query.eq("type", filter)
  }

  const { data, error } = await query
    .or(`recipient_id.eq.${userId},sender_id.eq.${userId},type.eq.broadcast`)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function markMessageAsRead(messageId: string) {
  const { data, error } = await supabase
    .from("messages")
    .update({ status: "read" })
    .eq("id", messageId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Email functions
export async function sendEmail(email: Omit<EmailLog, "id" | "created_at" | "status">) {
  const { data, error } = await supabase
    .from("email_logs")
    .insert({
      to_email: email.to_email,
      subject: email.subject,
      body: email.body,
      status: "sent",
      type: email.type,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getEmailLog() {
  const { data, error } = await supabase.from("email_logs").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

// Announcement functions
export async function createAnnouncement(announcement: Omit<Announcement, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      created_by: announcement.created_by,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      visibility: announcement.visibility,
      target_department: announcement.target_department,
      target_role: announcement.target_role,
      expires_at: announcement.expires_at,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAnnouncements(department?: string, role?: string) {
  let query = supabase.from("announcements").select("*")

  // RLS policies handle filtering based on visibility
  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

// Approval functions
export async function createApprovalRequest(request: Omit<ApprovalRequest, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("approval_requests")
    .insert({
      request_type: request.request_type,
      requested_by: request.requested_by,
      approved_by: request.approved_by,
      status: request.status,
      amount: request.amount,
      description: request.description,
      details: request.details || {},
      approved_at: request.approved_at,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getApprovalRequests(approverId?: string) {
  let query = supabase.from("approval_requests").select("*")

  if (approverId) {
    query = query.or(`approved_by.eq.${approverId},status.eq.pending`)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateApprovalRequest(requestId: string, updates: Partial<ApprovalRequest>) {
  const { data, error } = await supabase
    .from("approval_requests")
    .update(updates)
    .eq("id", requestId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Performance review functions
export async function createPerformanceReview(review: Omit<PerformanceReview, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("performance_reviews")
    .insert({
      employee_id: review.employee_id,
      reviewer_id: review.reviewer_id,
      period: review.period,
      rating: review.rating,
      comments: review.comments,
      goals: review.goals || [],
      status: review.status,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getPerformanceReviews(employeeId?: string) {
  let query = supabase.from("performance_reviews").select("*")

  if (employeeId) {
    query = query.eq("employee_id", employeeId)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function updatePerformanceReview(reviewId: string, updates: Partial<PerformanceReview>) {
  const { data, error } = await supabase
    .from("performance_reviews")
    .update(updates)
    .eq("id", reviewId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Audit functions
export async function logAuditAction(
  userId: string,
  userName: string,
  department: string,
  action: string,
  module: string,
  details: Record<string, unknown> = {},
  severity: "low" | "medium" | "high" | "critical" = "low",
) {
  const { data, error } = await supabase
    .from("audit_logs")
    .insert({
      user_id: userId,
      user_name: userName,
      department,
      action,
      module,
      details,
      severity,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAuditLogs(filter?: { userId?: string; module?: string; severity?: string }) {
  let query = supabase.from("audit_logs").select("*")

  if (filter?.userId) query = query.eq("user_id", filter.userId)
  if (filter?.module) query = query.eq("module", filter.module)
  if (filter?.severity) query = query.eq("severity", filter.severity)

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createAuditFinding(finding: Omit<AuditFinding, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("audit_findings")
    .insert({
      audit_id: finding.audit_id,
      audited_by: finding.audited_by,
      finding_type: finding.finding_type,
      severity: finding.severity,
      description: finding.description,
      recommendation: finding.recommendation,
      status: finding.status,
      due_date: finding.due_date,
      resolved_date: finding.resolved_date,
      resolution_notes: finding.resolution_notes,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAuditFindings(auditId?: string) {
  let query = supabase.from("audit_findings").select("*")

  if (auditId) {
    query = query.eq("audit_id", auditId)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateAuditFinding(findingId: string, updates: Partial<AuditFinding>) {
  const { data, error } = await supabase
    .from("audit_findings")
    .update(updates)
    .eq("id", findingId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createAuditReport(report: Omit<AuditReport, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("audit_reports")
    .insert({
      title: report.title,
      period: report.period,
      audited_area: report.audited_area,
      created_by: report.created_by,
      approved_by: report.approved_by,
      status: report.status,
      findings: report.findings || [],
      observations: report.observations,
      conclusion: report.conclusion,
      published_at: report.published_at,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAuditReports(status?: string) {
  let query = supabase.from("audit_reports").select("*")

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateAuditReport(reportId: string, updates: Partial<AuditReport>) {
  const { data, error } = await supabase
    .from("audit_reports")
    .update(updates)
    .eq("id", reportId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createRiskAssessment(assessment: Omit<RiskAssessment, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("risk_assessments")
    .insert({
      risk_category: assessment.risk_category,
      description: assessment.description,
      probability: assessment.probability,
      impact: assessment.impact,
      mitigation: assessment.mitigation,
      owner_id: assessment.owner_id,
      owner_name: assessment.owner_name,
      status: assessment.status,
      last_review_date: assessment.last_review_date,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getRiskAssessments(status?: string) {
  let query = supabase.from("risk_assessments").select("*")

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateRiskAssessment(assessmentId: string, updates: Partial<RiskAssessment>) {
  const { data, error } = await supabase
    .from("risk_assessments")
    .update(updates)
    .eq("id", assessmentId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Approval workflow functions
export async function createApprovalWorkflow(
  workflow: Omit<ApprovalWorkflow, "id" | "created_at" | "current_approval_level" | "overall_status">,
) {
  const { data, error } = await supabase
    .from("approval_workflows")
    .insert({
      request_type: workflow.request_type,
      requested_by: workflow.requested_by,
      approval_chain: workflow.approval_chain,
      current_approval_level: 0,
      overall_status: "pending",
      amount: workflow.amount,
      description: workflow.description,
      details: workflow.details || {},
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getApprovalWorkflows(userId?: string) {
  let query = supabase.from("approval_workflows").select("*")

  if (userId) {
    // Filter workflows where user is requester or approver
    query = query.or(`requested_by.eq.${userId}`)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateApprovalWorkflow(workflowId: string, updates: Partial<ApprovalWorkflow>) {
  const { data, error } = await supabase
    .from("approval_workflows")
    .update(updates)
    .eq("id", workflowId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function approveAtLevel(workflowId: string, approverId: string, comments?: string) {
  const { data: workflow, error: fetchError } = await supabase
    .from("approval_workflows")
    .select("*")
    .eq("id", workflowId)
    .single()

  if (fetchError || !workflow) throw fetchError

  const approvalChain = workflow.approval_chain || []
  const currentLevel = approvalChain[workflow.current_approval_level]

  if (!currentLevel || !currentLevel.approver_ids?.includes(approverId)) {
    throw new Error("Not authorized to approve at this level")
  }

  currentLevel.status = "approved"
  currentLevel.approved_by = approverId
  currentLevel.approved_at = new Date().toISOString()
  currentLevel.comments = comments

  const newCurrentLevel = workflow.current_approval_level + 1
  const newOverallStatus =
    newCurrentLevel >= approvalChain.length ? "approved" : workflow.overall_status

  const { data, error } = await supabase
    .from("approval_workflows")
    .update({
      approval_chain: approvalChain,
      current_approval_level: newCurrentLevel >= approvalChain.length ? workflow.current_approval_level : newCurrentLevel,
      overall_status: newOverallStatus,
    })
    .eq("id", workflowId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function rejectAtLevel(workflowId: string, approverId: string, reason: string) {
  const { data: workflow, error: fetchError } = await supabase
    .from("approval_workflows")
    .select("*")
    .eq("id", workflowId)
    .single()

  if (fetchError || !workflow) throw fetchError

  const approvalChain = workflow.approval_chain || []
  const currentLevel = approvalChain[workflow.current_approval_level]

  if (!currentLevel || !currentLevel.approver_ids?.includes(approverId)) {
    throw new Error("Not authorized to reject at this level")
  }

  currentLevel.status = "rejected"
  currentLevel.approved_by = approverId
  currentLevel.approved_at = new Date().toISOString()
  currentLevel.comments = reason

  const { data, error } = await supabase
    .from("approval_workflows")
    .update({
      approval_chain: approvalChain,
      overall_status: "rejected",
    })
    .eq("id", workflowId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Password reset functions
export async function requestPasswordReset(email: string) {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from("password_reset_tokens")
    .insert({
      email,
      token,
      expires_at: expiresAt,
      used: false,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function validateResetToken(email: string, token: string) {
  const { data, error } = await supabase
    .from("password_reset_tokens")
    .select("*")
    .eq("email", email)
    .eq("token", token)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .single()

  if (error || !data) return false
  return true
}

export async function completePasswordReset(email: string, token: string, newPassword: string) {
  const { error: updateError } = await supabase
    .from("password_reset_tokens")
    .update({ used: true })
    .eq("email", email)
    .eq("token", token)

  if (updateError) throw updateError

  // Update password via Supabase Auth
  const { error: passwordError } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (passwordError) throw passwordError

  return true
}

// Asset functions
export async function getAssets() {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createAsset(asset: {
  name: string
  category: string
  assignee_id?: string
  assignee_name?: string
  status: string
  value: number
  purchase_date: string
  condition: string
  location?: string
  serial_number?: string
  notes?: string
}) {
  const { data, error } = await supabase
    .from("assets")
    .insert(asset)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAsset(assetId: string, updates: Partial<{
  name?: string
  category?: string
  assignee_id?: string
  assignee_name?: string
  status?: string
  value?: number
  purchase_date?: string
  condition?: string
  location?: string
  serial_number?: string
  notes?: string
}>) {
  const { data, error } = await supabase
    .from("assets")
    .update(updates)
    .eq("id", assetId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Inventory functions
export async function getInventoryItems() {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .order("name", { ascending: true })

  if (error) throw error
  return data || []
}

export async function createInventoryItem(item: {
  name: string
  category?: string
  stock: number
  reorder_level: number
  unit?: string
  supplier?: string
}) {
  const { data, error } = await supabase
    .from("inventory_items")
    .insert(item)
    .select()
    .single()

  if (error) throw error
  return data
}

// Procurement functions
export async function getProcurementOrders() {
  const { data, error } = await supabase
    .from("procurement_orders")
    .select("*")
    .order("order_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createProcurementOrder(order: {
  order_number: string
  vendor: string
  items_count: number
  value: number
  status: string
  order_date: string
  delivery_date?: string
  created_by?: string
}) {
  const { data, error } = await supabase
    .from("procurement_orders")
    .insert(order)
    .select()
    .single()

  if (error) throw error
  return data
}

// Asset maintenance functions
export async function getAssetMaintenance(assetId?: string) {
  let query = supabase.from("asset_maintenance").select("*")

  if (assetId) {
    query = query.eq("asset_id", assetId)
  }

  const { data, error } = await query.order("scheduled_date", { ascending: true })

  if (error) throw error
  return data || []
}

// Expense functions
export async function getExpenses(employeeId?: string) {
  let query = supabase.from("expenses").select("*")

  if (employeeId) {
    query = query.eq("employee_id", employeeId)
  }

  const { data, error } = await query.order("date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createExpense(expense: {
  employee_id: string
  employee_name: string
  amount: number
  category: string
  date: string
  status: string
  description: string
  receipt_url?: string
}) {
  const { data, error } = await supabase
    .from("expenses")
    .insert(expense)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateExpense(expenseId: string, updates: Partial<{
  employee_id?: string
  employee_name?: string
  amount?: number
  category?: string
  date?: string
  status?: string
  description?: string
  receipt_url?: string
  approved_by?: string
  approved_at?: string
}>) {
  const { data, error } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", expenseId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Department budget functions
export async function getDepartmentBudgets() {
  const { data, error } = await supabase
    .from("department_budgets")
    .select("*")
    .order("department", { ascending: true })

  if (error) throw error
  return data || []
}

// Project functions
export async function getProjects(department?: string) {
  let query = supabase.from("projects").select("*")

  if (department) {
    query = query.eq("department", department)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createProject(project: {
  name: string
  department: string
  status: string
  progress: number
  due_date?: string
  owner_id?: string
  owner_name?: string
  description?: string
  budget?: number
}) {
  const { data, error } = await supabase
    .from("projects")
    .insert(project)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProject(projectId: string, updates: Partial<{
  name?: string
  department?: string
  status?: string
  progress?: number
  due_date?: string
  owner_id?: string
  owner_name?: string
  description?: string
  budget?: number
}>) {
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Training program functions
export async function getTrainingPrograms(status?: string) {
  let query = supabase.from("training_programs").select("*")

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createTrainingProgram(program: {
  title: string
  description?: string
  category?: string
  duration?: number
  instructor?: string
  capacity?: number
  enrolled_count?: number
  status: string
  start_date?: string
  end_date?: string
}) {
  const { data, error } = await supabase
    .from("training_programs")
    .insert(program)
    .select()
    .single()

  if (error) throw error
  return data
}

// Training enrollment functions
export async function getTrainingEnrollments(employeeId?: string, programId?: string) {
  let query = supabase.from("training_enrollments").select("*")

  if (employeeId) {
    query = query.eq("employee_id", employeeId)
  }
  if (programId) {
    query = query.eq("program_id", programId)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createTrainingEnrollment(enrollment: {
  program_id: string
  employee_id: string
  status: string
  completion_date?: string
  certificate_url?: string
}) {
  const { data, error } = await supabase
    .from("training_enrollments")
    .insert(enrollment)
    .select()
    .single()

  if (error) throw error
  return data
}

// Employee functions
export async function getEmployees(department?: string) {
  let query = supabase.from("employees").select("*").eq("status", "Active")

  if (department) {
    query = query.eq("department", department)
  }

  const { data, error } = await query.order("name", { ascending: true })

  if (error) throw error
  return data || []
}

// Leave request functions
export async function getLeaveRequests(employeeId?: string) {
  let query = supabase.from("leave_requests").select("*")

  if (employeeId) {
    query = query.eq("employee_id", employeeId)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function getLeaveBalances(employeeId?: string) {
  let query = supabase.from("leave_balances").select("*")

  if (employeeId) {
    query = query.eq("employee_id", employeeId)
  }

  const { data, error } = await query.order("year", { ascending: false })

  if (error) throw error
  return data || []
}

// ============================================
// PAYROLL FUNCTIONS
// ============================================

// Employee salary functions
export async function getEmployeeSalaries(employeeId?: string) {
  let query = supabase.from("employee_salaries").select("*").eq("is_active", true)

  if (employeeId) {
    query = query.eq("employee_id", employeeId)
  }

  const { data, error } = await query.order("effective_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createEmployeeSalary(salary: {
  employee_id: string
  base_salary: number
  currency?: string
  pay_frequency?: string
  tax_id?: string
  bank_account_number?: string
  bank_routing_number?: string
  bank_name?: string
  account_type?: string
  tax_withholding_percentage?: number
  state_tax_withholding_percentage?: number
  social_security_percentage?: number
  medicare_percentage?: number
  health_insurance_deduction?: number
  retirement_contribution_percentage?: number
  other_deductions?: Record<string, unknown>
  effective_date: string
}) {
  const { data, error } = await supabase
    .from("employee_salaries")
    .insert(salary)
    .select()
    .single()

  if (error) throw error
  return data
}

// Payroll run functions
export async function getPayrollRuns(status?: string) {
  let query = supabase.from("payroll_runs").select("*")

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query.order("pay_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createPayrollRun(run: {
  run_number: string
  pay_period_start: string
  pay_period_end: string
  pay_date: string
  status?: string
  processed_by?: string
  notes?: string
}) {
  const { data, error } = await supabase
    .from("payroll_runs")
    .insert(run)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePayrollRun(runId: string, updates: Partial<{
  status?: string
  total_employees?: number
  total_gross_pay?: number
  total_deductions?: number
  total_net_pay?: number
  processed_by?: string
  processed_at?: string
  notes?: string
}>) {
  const { data, error } = await supabase
    .from("payroll_runs")
    .update(updates)
    .eq("id", runId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Payslip functions
export async function getPayslips(employeeId?: string, payrollRunId?: string) {
  let query = supabase.from("payslips").select("*")

  if (employeeId) {
    query = query.eq("employee_id", employeeId)
  }
  if (payrollRunId) {
    query = query.eq("payroll_run_id", payrollRunId)
  }

  const { data, error } = await query.order("pay_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createPayslip(payslip: {
  payroll_run_id: string
  employee_id: string
  employee_name: string
  employee_email: string
  pay_period_start: string
  pay_period_end: string
  pay_date: string
  base_salary: number
  hours_worked?: number
  overtime_hours?: number
  overtime_rate?: number
  overtime_pay?: number
  bonus?: number
  commission?: number
  allowances?: number
  other_earnings?: number
  gross_pay: number
  federal_tax?: number
  state_tax?: number
  social_security?: number
  medicare?: number
  health_insurance?: number
  retirement_contribution?: number
  other_deductions?: number
  total_deductions?: number
  net_pay: number
  ytd_gross_pay?: number
  ytd_deductions?: number
  ytd_net_pay?: number
  payslip_pdf_url?: string
}) {
  const { data, error } = await supabase
    .from("payslips")
    .insert(payslip)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePayslip(payslipId: string, updates: Partial<{
  payslip_pdf_url?: string
  is_sent?: boolean
  sent_at?: string
}>) {
  const { data, error } = await supabase
    .from("payslips")
    .update(updates)
    .eq("id", payslipId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Bank export functions
export async function getBankExports(payrollRunId?: string) {
  let query = supabase.from("bank_exports").select("*")

  if (payrollRunId) {
    query = query.eq("payroll_run_id", payrollRunId)
  }

  const { data, error } = await query.order("export_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createBankExport(exportData: {
  payroll_run_id: string
  export_type?: string
  file_format?: string
  file_name: string
  file_url?: string
  total_amount: number
  total_transactions: number
  bank_name?: string
  export_date: string
  status?: string
  created_by?: string
}) {
  const { data, error } = await supabase
    .from("bank_exports")
    .insert(exportData)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// SUPPORT REQUESTS FUNCTIONS
// ============================================

export interface SupportRequest {
  id: string
  type: string
  title: string
  description: string
  requester_id: string
  requester_name: string
  assignee_id?: string
  assignee_name?: string
  priority: "Low" | "Medium" | "High"
  status: "Pending" | "In Progress" | "Resolved" | "Closed"
  created_at: string
  updated_at: string
  resolved_at?: string
  comments?: Array<{
    id: string
    author: string
    text: string
    timestamp: string
  }>
  // Enhanced fields
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  category?: string
  subcategory?: string
  tags?: string[]
  sla_target_hours?: number
  first_response_at?: string
  first_response_time_hours?: number
  escalation_level?: number
  escalated_at?: string
  escalated_by?: string
  escalated_to?: string
  source?: string
  satisfaction_rating?: number
  satisfaction_feedback?: string
  internal_notes?: string
  related_ticket_id?: string
  due_date?: string
  last_activity_at?: string
}

export async function getSupportRequests(userId?: string) {
  let query = supabase.from("support_requests").select("*")

  if (userId) {
    query = query.or(`requester_id.eq.${userId},assignee_id.eq.${userId}`)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createSupportRequest(request: {
  type: string
  title: string
  description: string
  requester_id: string
  requester_name: string
  priority?: string
}) {
  const { data, error } = await supabase
    .from("support_requests")
    .insert({
      type: request.type,
      title: request.title,
      description: request.description,
      requester_id: request.requester_id,
      requester_name: request.requester_name,
      priority: request.priority || "Medium",
      status: "Pending",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSupportRequest(
  requestId: string,
  updates: Partial<{
    assignee_id: string
    assignee_name: string
    status: string
    priority: string
    resolved_at: string
    comments: Array<{ id: string; author: string; text: string; timestamp: string }>
  }>
) {
  const { data, error } = await supabase
    .from("support_requests")
    .update(updates)
    .eq("id", requestId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function addCommentToSupportRequest(
  requestId: string,
  comment: { author: string; text: string; isInternal?: boolean }
) {
  const tickets = await getSupportRequests()
  const currentTicket = tickets.find((t) => t.id === requestId)
  if (!currentTicket) throw new Error("Ticket not found")

  const comments = currentTicket.comments || []
  const newComment = {
    id: crypto.randomUUID(),
    author: comment.author,
    text: comment.text,
    timestamp: new Date().toISOString(),
    isInternal: comment.isInternal || false,
  }

  const updatedComments = [...comments, newComment]

  return updateSupportRequest(requestId, { comments: updatedComments })
}

export async function escalateSupportRequest(
  requestId: string,
  escalation: {
    escalated_by: string
    escalated_to: string
    reason: string
    notes?: string
  }
) {
  const tickets = await getSupportRequests()
  const ticket = tickets.find((t) => t.id === requestId)
  if (!ticket) throw new Error("Ticket not found")

  const escalationLevel = (ticket.escalation_level || 0) + 1

  return updateSupportRequest(requestId, {
    escalation_level: escalationLevel,
    escalated_at: new Date().toISOString(),
    escalated_by: escalation.escalated_by,
    escalated_to: escalation.escalated_to,
    assignee_id: escalation.escalated_to,
    status: "In Progress",
  })
}

export async function getSupportTeamMembers() {
  const { data, error } = await supabase
    .from("support_team_members")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function getSupportQueue(filters?: {
  status?: string
  priority?: string
  assignee_id?: string
  category?: string
}) {
  let query = supabase.from("support_requests").select("*")

  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.priority) query = query.eq("priority", filters.priority)
  if (filters?.assignee_id) query = query.eq("assignee_id", filters.assignee_id)
  if (filters?.category) query = query.eq("category", filters.category)

  const { data, error } = await query
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })

  if (error) throw error
  return data || []
}

// ============================================
// HSE (Health, Safety & Environment) FUNCTIONS
// ============================================

export interface SafetyIncident {
  id: string
  incident_number: string
  incident_type: string
  severity: string
  status: string
  location: string
  department: string
  reported_by?: string
  reported_by_name: string
  reported_at?: string
  incident_date: string
  description: string
  immediate_cause?: string
  root_cause?: string
  corrective_actions?: string[]
  investigation_notes?: string
  investigation_completed_at?: string
  closed_at?: string
  created_at: string
  updated_at: string
}

export interface SafetyInspection {
  id: string
  inspection_number: string
  inspection_type: string
  location: string
  department: string
  inspector_id?: string
  inspector_name: string
  scheduled_date: string
  completed_date?: string
  status: string
  findings?: string[]
  non_conformances?: number
  corrective_actions_required?: number
  notes?: string
  next_inspection_date?: string
  created_at: string
  updated_at: string
}

export interface SafetyTrainingRecord {
  id: string
  employee_id: string
  employee_name: string
  training_type: string
  training_name: string
  provider?: string
  completed_date?: string
  expiry_date?: string
  status: string
  certification_number?: string
  score?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface EnvironmentalMetric {
  id: string
  metric_type: string
  category: string
  measurement_date: string
  value: number
  unit: string
  location?: string
  department?: string
  recorded_by?: string
  recorded_by_name: string
  notes?: string
  compliance_status: string
  created_at: string
  updated_at: string
}

export interface CorrectiveAction {
  id: string
  action_number: string
  source_type: string
  source_id: string
  description: string
  assigned_to?: string
  assigned_to_name: string
  priority: string
  due_date: string
  completed_date?: string
  status: string
  completion_notes?: string
  verified_by?: string
  verified_at?: string
  created_at: string
  updated_at: string
}

export interface SafetyObservation {
  id: string
  observation_number: string
  observation_type: string
  location: string
  department: string
  observed_by?: string
  observed_by_name: string
  observation_date: string
  description: string
  risk_level: string
  immediate_action_taken?: string
  status: string
  action_required: boolean
  created_at: string
  updated_at: string
}

export async function createSafetyIncident(incident: {
  incident_type: string
  severity: string
  location: string
  department: string
  reported_by: string
  reported_by_name: string
  incident_date: string
  description: string
  immediate_cause?: string
}) {
  // Generate incident number
  const incidentNumber = `INC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("safety_incidents")
    .insert({
      incident_number: incidentNumber,
      incident_type: incident.incident_type,
      severity: incident.severity,
      location: incident.location,
      department: incident.department,
      reported_by: incident.reported_by,
      reported_by_name: incident.reported_by_name,
      incident_date: incident.incident_date,
      description: incident.description,
      immediate_cause: incident.immediate_cause,
      status: "reported",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSafetyIncidents(filters?: {
  department?: string
  status?: string
  incident_type?: string
  severity?: string
}) {
  let query = supabase.from("safety_incidents").select("*")

  if (filters?.department) query = query.eq("department", filters.department)
  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.incident_type) query = query.eq("incident_type", filters.incident_type)
  if (filters?.severity) query = query.eq("severity", filters.severity)

  const { data, error } = await query.order("incident_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateSafetyIncident(incidentId: string, updates: Partial<SafetyIncident>) {
  const { data, error } = await supabase
    .from("safety_incidents")
    .update(updates)
    .eq("id", incidentId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createSafetyObservation(observation: {
  observation_type: string
  location: string
  department: string
  observed_by: string
  observed_by_name: string
  description: string
  risk_level: string
  immediate_action_taken?: string
  action_required?: boolean
}) {
  const observationNumber = `OBS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("safety_observations")
    .insert({
      observation_number: observationNumber,
      observation_type: observation.observation_type,
      location: observation.location,
      department: observation.department,
      observed_by: observation.observed_by,
      observed_by_name: observation.observed_by_name,
      description: observation.description,
      risk_level: observation.risk_level,
      immediate_action_taken: observation.immediate_action_taken,
      action_required: observation.action_required || false,
      status: observation.action_required ? "action_required" : "open",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSafetyObservations(filters?: {
  department?: string
  status?: string
  observation_type?: string
}) {
  let query = supabase.from("safety_observations").select("*")

  if (filters?.department) query = query.eq("department", filters.department)
  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.observation_type) query = query.eq("observation_type", filters.observation_type)

  const { data, error } = await query.order("observation_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createSafetyInspection(inspection: {
  inspection_type: string
  location: string
  department: string
  inspector_id: string
  inspector_name: string
  scheduled_date: string
  notes?: string
}) {
  const inspectionNumber = `INS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("safety_inspections")
    .insert({
      inspection_number: inspectionNumber,
      inspection_type: inspection.inspection_type,
      location: inspection.location,
      department: inspection.department,
      inspector_id: inspection.inspector_id,
      inspector_name: inspection.inspector_name,
      scheduled_date: inspection.scheduled_date,
      notes: inspection.notes,
      status: "scheduled",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSafetyInspection(inspectionId: string, updates: Partial<SafetyInspection>) {
  const { data, error } = await supabase
    .from("safety_inspections")
    .update(updates)
    .eq("id", inspectionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSafetyInspections(filters?: {
  department?: string
  status?: string
  inspector_id?: string
}) {
  let query = supabase.from("safety_inspections").select("*")

  if (filters?.department) query = query.eq("department", filters.department)
  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.inspector_id) query = query.eq("inspector_id", filters.inspector_id)

  const { data, error } = await query.order("scheduled_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createSafetyTrainingRecord(training: {
  employee_id: string
  employee_name: string
  training_type: string
  training_name: string
  provider?: string
  completed_date?: string
  expiry_date?: string
  certification_number?: string
  score?: number
  notes?: string
}) {
  const { data, error } = await supabase
    .from("safety_training_records")
    .insert({
      employee_id: training.employee_id,
      employee_name: training.employee_name,
      training_type: training.training_type,
      training_name: training.training_name,
      provider: training.provider,
      completed_date: training.completed_date,
      expiry_date: training.expiry_date,
      certification_number: training.certification_number,
      score: training.score,
      notes: training.notes,
      status: training.completed_date ? "completed" : "scheduled",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSafetyTrainingRecords(filters?: {
  employee_id?: string
  status?: string
  training_type?: string
}) {
  let query = supabase.from("safety_training_records").select("*")

  if (filters?.employee_id) query = query.eq("employee_id", filters.employee_id)
  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.training_type) query = query.eq("training_type", filters.training_type)

  const { data, error } = await query.order("expiry_date", { ascending: true })

  if (error) throw error
  return data || []
}

export async function createEnvironmentalMetric(metric: {
  metric_type: string
  category: string
  measurement_date: string
  value: number
  unit: string
  location?: string
  department?: string
  recorded_by: string
  recorded_by_name: string
  notes?: string
}) {
  const { data, error } = await supabase
    .from("environmental_metrics")
    .insert({
      metric_type: metric.metric_type,
      category: metric.category,
      measurement_date: metric.measurement_date,
      value: metric.value,
      unit: metric.unit,
      location: metric.location,
      department: metric.department,
      recorded_by: metric.recorded_by,
      recorded_by_name: metric.recorded_by_name,
      notes: metric.notes,
      compliance_status: "compliant",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getEnvironmentalMetrics(filters?: {
  metric_type?: string
  category?: string
  department?: string
}) {
  let query = supabase.from("environmental_metrics").select("*")

  if (filters?.metric_type) query = query.eq("metric_type", filters.metric_type)
  if (filters?.category) query = query.eq("category", filters.category)
  if (filters?.department) query = query.eq("department", filters.department)

  const { data, error } = await query.order("measurement_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createCorrectiveAction(action: {
  source_type: string
  source_id: string
  description: string
  assigned_to: string
  assigned_to_name: string
  priority: string
  due_date: string
}) {
  const actionNumber = `CA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("corrective_actions")
    .insert({
      action_number: actionNumber,
      source_type: action.source_type,
      source_id: action.source_id,
      description: action.description,
      assigned_to: action.assigned_to,
      assigned_to_name: action.assigned_to_name,
      priority: action.priority,
      due_date: action.due_date,
      status: "open",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCorrectiveAction(actionId: string, updates: Partial<CorrectiveAction>) {
  const { data, error } = await supabase
    .from("corrective_actions")
    .update(updates)
    .eq("id", actionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getCorrectiveActions(filters?: {
  assigned_to?: string
  status?: string
  priority?: string
  source_type?: string
}) {
  let query = supabase.from("corrective_actions").select("*")

  if (filters?.assigned_to) query = query.eq("assigned_to", filters.assigned_to)
  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.priority) query = query.eq("priority", filters.priority)
  if (filters?.source_type) query = query.eq("source_type", filters.source_type)

  const { data, error } = await query.order("due_date", { ascending: true })

  if (error) throw error
  return data || []
}

// ============================================
// CSR (Corporate Social Responsibility) FUNCTIONS
// ============================================

export interface CSRProject {
  id: string
  project_number: string
  project_name: string
  project_type: string
  description: string
  location?: string
  start_date: string
  end_date?: string
  status: string
  budget_amount?: number
  spent_amount?: number
  beneficiaries_count?: number
  impact_description?: string
  partner_organizations?: string[]
  created_by?: string
  created_by_name: string
  department: string
  created_at: string
  updated_at: string
}

export interface VolunteerActivity {
  id: string
  activity_number: string
  activity_name: string
  activity_type: string
  description: string
  location?: string
  activity_date: string
  duration_hours: number
  total_volunteers: number
  total_hours: number
  csr_project_id?: string
  organizer_id?: string
  organizer_name: string
  status: string
  impact_notes?: string
  created_at: string
  updated_at: string
}

export interface VolunteerParticipation {
  id: string
  activity_id: string
  employee_id: string
  employee_name: string
  department?: string
  hours_contributed: number
  participation_date: string
  role?: string
  feedback?: string
  created_at: string
}

export interface CSRSustainabilityMetric {
  id: string
  metric_number: string
  metric_type: string
  category: string
  measurement_date: string
  value: number
  unit: string
  baseline_value?: number
  target_value?: number
  location?: string
  department?: string
  recorded_by?: string
  recorded_by_name: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CommunityImpact {
  id: string
  impact_number: string
  impact_type: string
  description: string
  quantity: number
  unit: string
  location?: string
  beneficiary_group?: string
  csr_project_id?: string
  impact_date: string
  recorded_by?: string
  recorded_by_name: string
  verification_status: string
  verification_notes?: string
  created_at: string
  updated_at: string
}

export async function createCSRProject(project: {
  project_name: string
  project_type: string
  description: string
  location?: string
  start_date: string
  end_date?: string
  budget_amount?: number
  partner_organizations?: string[]
  created_by: string
  created_by_name: string
}) {
  const projectNumber = `CSR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("csr_projects")
    .insert({
      project_number: projectNumber,
      project_name: project.project_name,
      project_type: project.project_type,
      description: project.description,
      location: project.location,
      start_date: project.start_date,
      end_date: project.end_date,
      budget_amount: project.budget_amount,
      partner_organizations: project.partner_organizations,
      created_by: project.created_by,
      created_by_name: project.created_by_name,
      status: "planning",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getCSRProjects(filters?: {
  status?: string
  project_type?: string
}) {
  let query = supabase.from("csr_projects").select("*")

  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.project_type) query = query.eq("project_type", filters.project_type)

  const { data, error } = await query.order("start_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateCSRProject(projectId: string, updates: Partial<CSRProject>) {
  const { data, error } = await supabase
    .from("csr_projects")
    .update(updates)
    .eq("id", projectId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createVolunteerActivity(activity: {
  activity_name: string
  activity_type: string
  description: string
  location?: string
  activity_date: string
  duration_hours: number
  csr_project_id?: string
  organizer_id: string
  organizer_name: string
}) {
  const activityNumber = `VOL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("volunteer_activities")
    .insert({
      activity_number: activityNumber,
      activity_name: activity.activity_name,
      activity_type: activity.activity_type,
      description: activity.description,
      location: activity.location,
      activity_date: activity.activity_date,
      duration_hours: activity.duration_hours,
      csr_project_id: activity.csr_project_id,
      organizer_id: activity.organizer_id,
      organizer_name: activity.organizer_name,
      status: "scheduled",
      total_volunteers: 0,
      total_hours: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getVolunteerActivities(filters?: {
  status?: string
  activity_type?: string
  csr_project_id?: string
}) {
  let query = supabase.from("volunteer_activities").select("*")

  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.activity_type) query = query.eq("activity_type", filters.activity_type)
  if (filters?.csr_project_id) query = query.eq("csr_project_id", filters.csr_project_id)

  const { data, error } = await query.order("activity_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createVolunteerParticipation(participation: {
  activity_id: string
  employee_id: string
  employee_name: string
  department?: string
  hours_contributed: number
  participation_date: string
  role?: string
  feedback?: string
}) {
  const { data, error } = await supabase
    .from("volunteer_participation")
    .insert(participation)
    .select()
    .single()

  if (error) throw error

  // Update activity totals
  const { data: activity } = await supabase
    .from("volunteer_activities")
    .select("total_volunteers, total_hours")
    .eq("id", participation.activity_id)
    .single()

  if (activity) {
    await supabase
      .from("volunteer_activities")
      .update({
        total_volunteers: (activity.total_volunteers || 0) + 1,
        total_hours: (parseFloat(activity.total_hours || 0) + participation.hours_contributed).toString(),
      })
      .eq("id", participation.activity_id)
  }

  return data
}

export async function getVolunteerParticipation(filters?: {
  employee_id?: string
  activity_id?: string
}) {
  let query = supabase.from("volunteer_participation").select("*")

  if (filters?.employee_id) query = query.eq("employee_id", filters.employee_id)
  if (filters?.activity_id) query = query.eq("activity_id", filters.activity_id)

  const { data, error } = await query.order("participation_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createCSRSustainabilityMetric(metric: {
  metric_type: string
  category: string
  measurement_date: string
  value: number
  unit: string
  baseline_value?: number
  target_value?: number
  location?: string
  department?: string
  recorded_by: string
  recorded_by_name: string
  notes?: string
}) {
  const metricNumber = `CSR-MET-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("csr_sustainability_metrics")
    .insert({
      metric_number: metricNumber,
      metric_type: metric.metric_type,
      category: metric.category,
      measurement_date: metric.measurement_date,
      value: metric.value,
      unit: metric.unit,
      baseline_value: metric.baseline_value,
      target_value: metric.target_value,
      location: metric.location,
      department: metric.department,
      recorded_by: metric.recorded_by,
      recorded_by_name: metric.recorded_by_name,
      notes: metric.notes,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getCSRSustainabilityMetrics(filters?: {
  metric_type?: string
  category?: string
  department?: string
}) {
  let query = supabase.from("csr_sustainability_metrics").select("*")

  if (filters?.metric_type) query = query.eq("metric_type", filters.metric_type)
  if (filters?.category) query = query.eq("category", filters.category)
  if (filters?.department) query = query.eq("department", filters.department)

  const { data, error } = await query.order("measurement_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createCommunityImpact(impact: {
  impact_type: string
  description: string
  quantity: number
  unit: string
  location?: string
  beneficiary_group?: string
  csr_project_id?: string
  impact_date: string
  recorded_by: string
  recorded_by_name: string
}) {
  const impactNumber = `IMP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("community_impact")
    .insert({
      impact_number: impactNumber,
      impact_type: impact.impact_type,
      description: impact.description,
      quantity: impact.quantity,
      unit: impact.unit,
      location: impact.location,
      beneficiary_group: impact.beneficiary_group,
      csr_project_id: impact.csr_project_id,
      impact_date: impact.impact_date,
      recorded_by: impact.recorded_by,
      recorded_by_name: impact.recorded_by_name,
      verification_status: "pending",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getCommunityImpact(filters?: {
  impact_type?: string
  beneficiary_group?: string
  csr_project_id?: string
}) {
  let query = supabase.from("community_impact").select("*")

  if (filters?.impact_type) query = query.eq("impact_type", filters.impact_type)
  if (filters?.beneficiary_group) query = query.eq("beneficiary_group", filters.beneficiary_group)
  if (filters?.csr_project_id) query = query.eq("csr_project_id", filters.csr_project_id)

  const { data, error } = await query.order("impact_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateCommunityImpact(impactId: string, updates: Partial<CommunityImpact>) {
  const { data, error } = await supabase
    .from("community_impact")
    .update(updates)
    .eq("id", impactId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// SECURITY & ACCESS CONTROL FUNCTIONS
// ============================================

export interface AccessLog {
  id: string
  log_number: string
  user_id?: string
  user_name: string
  action_type: string
  resource_type?: string
  resource_id?: string
  resource_name?: string
  ip_address?: string
  user_agent?: string
  status: string
  details?: string
  severity: string
  created_at: string
}

export interface SecurityIncident {
  id: string
  incident_number: string
  incident_type: string
  severity: string
  status: string
  title: string
  description: string
  affected_users?: number
  affected_systems?: string[]
  detected_by?: string
  detected_by_name: string
  detected_at: string
  resolved_at?: string
  resolution_notes?: string
  assigned_to?: string
  assigned_to_name?: string
  created_at: string
  updated_at: string
}

export interface AccessRequest {
  id: string
  request_number: string
  requester_id: string
  requester_name: string
  request_type: string
  requested_resource?: string
  requested_permission?: string
  requested_role?: string
  justification: string
  status: string
  requested_at: string
  reviewed_by?: string
  reviewed_by_name?: string
  reviewed_at?: string
  review_notes?: string
  expiry_date?: string
  created_at: string
  updated_at: string
}

export interface AccessReview {
  id: string
  review_number: string
  review_type: string
  target_user_id?: string
  target_user_name?: string
  target_role?: string
  target_department?: string
  reviewer_id?: string
  reviewer_name: string
  review_date: string
  status: string
  findings?: string[]
  recommendations?: string
  next_review_date?: string
  created_at: string
  updated_at: string
}

export interface SecurityAlert {
  id: string
  alert_number: string
  alert_type: string
  severity: string
  status: string
  title: string
  description: string
  affected_user_id?: string
  affected_user_name?: string
  source_ip?: string
  detected_at: string
  resolved_at?: string
  resolved_by?: string
  resolved_by_name?: string
  resolution_notes?: string
  created_at: string
  updated_at: string
}

export async function getAccessLogs(filters?: {
  user_id?: string
  action_type?: string
  status?: string
  severity?: string
  start_date?: string
  end_date?: string
}) {
  let query = supabase.from("access_logs").select("*")

  if (filters?.user_id) query = query.eq("user_id", filters.user_id)
  if (filters?.action_type) query = query.eq("action_type", filters.action_type)
  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.severity) query = query.eq("severity", filters.severity)
  if (filters?.start_date) query = query.gte("created_at", filters.start_date)
  if (filters?.end_date) query = query.lte("created_at", filters.end_date)

  const { data, error } = await query.order("created_at", { ascending: false }).limit(1000)

  if (error) throw error
  return data || []
}

export async function createSecurityIncident(incident: {
  incident_type: string
  severity: string
  title: string
  description: string
  affected_users?: number
  affected_systems?: string[]
  detected_by: string
  detected_by_name: string
}) {
  const incidentNumber = `SEC-INC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("security_incidents")
    .insert({
      incident_number: incidentNumber,
      incident_type: incident.incident_type,
      severity: incident.severity,
      title: incident.title,
      description: incident.description,
      affected_users: incident.affected_users,
      affected_systems: incident.affected_systems,
      detected_by: incident.detected_by,
      detected_by_name: incident.detected_by_name,
      status: "reported",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSecurityIncidents(filters?: {
  status?: string
  severity?: string
  incident_type?: string
}) {
  let query = supabase.from("security_incidents").select("*")

  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.severity) query = query.eq("severity", filters.severity)
  if (filters?.incident_type) query = query.eq("incident_type", filters.incident_type)

  const { data, error } = await query.order("detected_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateSecurityIncident(incidentId: string, updates: Partial<SecurityIncident>) {
  const { data, error } = await supabase
    .from("security_incidents")
    .update(updates)
    .eq("id", incidentId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createAccessRequest(request: {
  requester_id: string
  requester_name: string
  request_type: string
  requested_resource?: string
  requested_permission?: string
  requested_role?: string
  justification: string
  expiry_date?: string
}) {
  const requestNumber = `ACC-REQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("access_requests")
    .insert({
      request_number: requestNumber,
      requester_id: request.requester_id,
      requester_name: request.requester_name,
      request_type: request.request_type,
      requested_resource: request.requested_resource,
      requested_permission: request.requested_permission,
      requested_role: request.requested_role,
      justification: request.justification,
      expiry_date: request.expiry_date,
      status: "pending",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAccessRequests(filters?: {
  requester_id?: string
  status?: string
  request_type?: string
}) {
  let query = supabase.from("access_requests").select("*")

  if (filters?.requester_id) query = query.eq("requester_id", filters.requester_id)
  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.request_type) query = query.eq("request_type", filters.request_type)

  const { data, error } = await query.order("requested_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateAccessRequest(requestId: string, updates: Partial<AccessRequest>) {
  const { data, error } = await supabase
    .from("access_requests")
    .update(updates)
    .eq("id", requestId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createAccessReview(review: {
  review_type: string
  target_user_id?: string
  target_user_name?: string
  target_role?: string
  target_department?: string
  reviewer_id: string
  reviewer_name: string
  review_date: string
  findings?: string[]
  recommendations?: string
  next_review_date?: string
}) {
  const reviewNumber = `ACC-REV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("access_reviews")
    .insert({
      review_number: reviewNumber,
      review_type: review.review_type,
      target_user_id: review.target_user_id,
      target_user_name: review.target_user_name,
      target_role: review.target_role,
      target_department: review.target_department,
      reviewer_id: review.reviewer_id,
      reviewer_name: review.reviewer_name,
      review_date: review.review_date,
      findings: review.findings,
      recommendations: review.recommendations,
      next_review_date: review.next_review_date,
      status: "pending",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAccessReviews(filters?: {
  target_user_id?: string
  status?: string
  review_type?: string
}) {
  let query = supabase.from("access_reviews").select("*")

  if (filters?.target_user_id) query = query.eq("target_user_id", filters.target_user_id)
  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.review_type) query = query.eq("review_type", filters.review_type)

  const { data, error } = await query.order("review_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateAccessReview(reviewId: string, updates: Partial<AccessReview>) {
  const { data, error } = await supabase
    .from("access_reviews")
    .update(updates)
    .eq("id", reviewId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSecurityAlerts(filters?: {
  status?: string
  severity?: string
  alert_type?: string
}) {
  let query = supabase.from("security_alerts").select("*")

  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.severity) query = query.eq("severity", filters.severity)
  if (filters?.alert_type) query = query.eq("alert_type", filters.alert_type)

  const { data, error } = await query.order("detected_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateSecurityAlert(alertId: string, updates: Partial<SecurityAlert>) {
  const { data, error } = await supabase
    .from("security_alerts")
    .update(updates)
    .eq("id", alertId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getPermissionChangesAudit(filters?: {
  user_id?: string
  change_type?: string
}) {
  let query = supabase.from("permission_changes_audit").select("*")

  if (filters?.user_id) query = query.eq("user_id", filters.user_id)
  if (filters?.change_type) query = query.eq("change_type", filters.change_type)

  const { data, error } = await query.order("change_date", { ascending: false })

  if (error) throw error
  return data || []
}

// ============================================
// R&D FUNCTIONS
// ============================================

export interface RNDProject {
  id: string
  project_id?: string
  project_number: string
  project_type: string
  research_phase: string
  research_objective: string
  hypothesis?: string
  methodology?: string
  expected_outcomes?: string
  success_criteria?: string
  risk_level: string
  innovation_potential: string
  commercialization_readiness: number
  start_date: string
  target_completion_date?: string
  actual_completion_date?: string
  status: string
  budget_allocated: number
  budget_utilized: number
  team_lead_id?: string
  team_lead_name?: string
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface RNDExperiment {
  id: string
  experiment_number: string
  rnd_project_id: string
  experiment_name: string
  experiment_type?: string
  hypothesis: string
  objective: string
  methodology?: string
  protocol?: string
  equipment_used?: string[]
  materials_used?: string[]
  conducted_by: string
  conducted_by_name: string
  experiment_date: string
  status: string
  results?: string
  findings?: string
  conclusions?: string
  success?: boolean
  data_files?: string[]
  notes?: string
  created_at: string
  updated_at: string
}

export interface RNDPatent {
  id: string
  patent_number: string
  patent_title: string
  patent_type: string
  rnd_project_id?: string
  technology_area?: string
  inventors?: string[]
  filing_date?: string
  priority_date?: string
  publication_date?: string
  grant_date?: string
  expiry_date?: string
  status: string
  patent_office?: string
  application_number?: string
  patent_number_official?: string
  maintenance_fees_due?: string
  next_maintenance_date?: string
  estimated_value?: number
  licensing_status?: string
  related_patents?: string[]
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface RNDLabBooking {
  id: string
  booking_number: string
  lab_space: string
  asset_id?: string
  equipment_name?: string
  rnd_project_id?: string
  experiment_id?: string
  booked_by: string
  booked_by_name: string
  booking_date: string
  start_time: string
  end_time: string
  duration_hours?: number
  status: string
  purpose?: string
  special_requirements?: string
  created_at: string
  updated_at: string
}

export interface RNDResearchData {
  id: string
  data_number: string
  rnd_project_id: string
  experiment_id?: string
  data_name: string
  data_type?: string
  data_category?: string
  description?: string
  file_paths?: string[]
  file_size_mb?: number
  data_format?: string
  version: string
  collected_by: string
  collected_by_name: string
  collection_date: string
  analysis_status: string
  confidentiality_level: string
  access_level: string
  tags?: string[]
  metadata?: any
  created_at: string
  updated_at: string
}

export interface RNDCollaboration {
  id: string
  collaboration_number: string
  collaboration_name: string
  collaboration_type: string
  rnd_project_id?: string
  partner_name: string
  partner_type?: string
  contact_person?: string
  contact_email?: string
  start_date: string
  end_date?: string
  status: string
  collaboration_scope?: string
  deliverables?: string[]
  budget_allocated: number
  budget_utilized: number
  intellectual_property_terms?: string
  publication_rights?: string
  lead_contact_id?: string
  lead_contact_name?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface RNDMilestone {
  id: string
  milestone_number: string
  rnd_project_id: string
  milestone_name: string
  milestone_type?: string
  description?: string
  target_date: string
  actual_date?: string
  status: string
  completion_percentage: number
  dependencies?: string[]
  assigned_to?: string
  assigned_to_name?: string
  notes?: string
  created_at: string
  updated_at: string
}

export async function getRNDProjects(filters?: {
  status?: string
  research_phase?: string
  project_type?: string
}) {
  let query = supabase.from("rnd_projects").select("*")

  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.research_phase) query = query.eq("research_phase", filters.research_phase)
  if (filters?.project_type) query = query.eq("project_type", filters.project_type)

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createRNDProject(project: {
  project_type: string
  research_phase: string
  research_objective: string
  hypothesis?: string
  methodology?: string
  expected_outcomes?: string
  success_criteria?: string
  risk_level?: string
  innovation_potential?: string
  commercialization_readiness?: number
  start_date: string
  target_completion_date?: string
  budget_allocated?: number
  team_lead_id?: string
  team_lead_name?: string
  created_by: string
  created_by_name: string
}) {
  const projectNumber = `RND-PROJ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("rnd_projects")
    .insert({
      project_number: projectNumber,
      project_type: project.project_type,
      research_phase: project.research_phase,
      research_objective: project.research_objective,
      hypothesis: project.hypothesis,
      methodology: project.methodology,
      expected_outcomes: project.expected_outcomes,
      success_criteria: project.success_criteria,
      risk_level: project.risk_level || "medium",
      innovation_potential: project.innovation_potential || "medium",
      commercialization_readiness: project.commercialization_readiness || 0,
      start_date: project.start_date,
      target_completion_date: project.target_completion_date,
      budget_allocated: project.budget_allocated || 0,
      team_lead_id: project.team_lead_id,
      team_lead_name: project.team_lead_name,
      created_by: project.created_by,
      created_by_name: project.created_by_name,
      status: "planning",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateRNDProject(projectId: string, updates: Partial<RNDProject>) {
  const { data, error } = await supabase
    .from("rnd_projects")
    .update(updates)
    .eq("id", projectId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getRNDExperiments(filters?: {
  rnd_project_id?: string
  status?: string
}) {
  let query = supabase.from("rnd_experiments").select("*")

  if (filters?.rnd_project_id) query = query.eq("rnd_project_id", filters.rnd_project_id)
  if (filters?.status) query = query.eq("status", filters.status)

  const { data, error } = await query.order("experiment_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createRNDExperiment(experiment: {
  rnd_project_id: string
  experiment_name: string
  hypothesis: string
  objective: string
  methodology?: string
  protocol?: string
  equipment_used?: string[]
  materials_used?: string[]
  experiment_date: string
  conducted_by: string
  conducted_by_name: string
}) {
  const experimentNumber = `RND-EXP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("rnd_experiments")
    .insert({
      experiment_number: experimentNumber,
      rnd_project_id: experiment.rnd_project_id,
      experiment_name: experiment.experiment_name,
      hypothesis: experiment.hypothesis,
      objective: experiment.objective,
      methodology: experiment.methodology,
      protocol: experiment.protocol,
      equipment_used: experiment.equipment_used,
      materials_used: experiment.materials_used,
      experiment_date: experiment.experiment_date,
      conducted_by: experiment.conducted_by,
      conducted_by_name: experiment.conducted_by_name,
      status: "planned",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateRNDExperiment(experimentId: string, updates: Partial<RNDExperiment>) {
  const { data, error } = await supabase
    .from("rnd_experiments")
    .update(updates)
    .eq("id", experimentId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getRNDPatents(filters?: {
  status?: string
  patent_type?: string
}) {
  let query = supabase.from("rnd_patents").select("*")

  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.patent_type) query = query.eq("patent_type", filters.patent_type)

  const { data, error } = await query.order("filing_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createRNDPatent(patent: {
  patent_title: string
  patent_type: string
  rnd_project_id?: string
  technology_area?: string
  inventors?: string[]
  filing_date?: string
  patent_office?: string
  created_by: string
  created_by_name: string
}) {
  const patentNumber = `RND-PAT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("rnd_patents")
    .insert({
      patent_number: patentNumber,
      patent_title: patent.patent_title,
      patent_type: patent.patent_type,
      rnd_project_id: patent.rnd_project_id,
      technology_area: patent.technology_area,
      inventors: patent.inventors,
      filing_date: patent.filing_date,
      patent_office: patent.patent_office,
      created_by: patent.created_by,
      created_by_name: patent.created_by_name,
      status: "draft",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateRNDPatent(patentId: string, updates: Partial<RNDPatent>) {
  const { data, error } = await supabase
    .from("rnd_patents")
    .update(updates)
    .eq("id", patentId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getRNDLabBookings(filters?: {
  booking_date?: string
  status?: string
  lab_space?: string
}) {
  let query = supabase.from("rnd_lab_bookings").select("*")

  if (filters?.booking_date) query = query.eq("booking_date", filters.booking_date)
  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.lab_space) query = query.eq("lab_space", filters.lab_space)

  const { data, error } = await query.order("booking_date", { ascending: true }).order("start_time", { ascending: true })

  if (error) throw error
  return data || []
}

export async function createRNDLabBooking(booking: {
  lab_space: string
  asset_id?: string
  equipment_name?: string
  rnd_project_id?: string
  experiment_id?: string
  booking_date: string
  start_time: string
  end_time: string
  purpose?: string
  special_requirements?: string
  booked_by: string
  booked_by_name: string
}) {
  // Check for conflicts before creating booking
  const { data: existingBookings, error: checkError } = await supabase
    .from("rnd_lab_bookings")
    .select("*")
    .eq("booking_date", booking.booking_date)
    .eq("lab_space", booking.lab_space)
    .in("status", ["scheduled", "in_use"])

  if (checkError) throw checkError

  const requestedStart = new Date(`${booking.booking_date}T${booking.start_time}`)
  const requestedEnd = new Date(`${booking.booking_date}T${booking.end_time}`)

  const conflicts = (existingBookings || []).filter((existing: any) => {
    const existingStart = new Date(`${existing.booking_date}T${existing.start_time}`)
    const existingEnd = new Date(`${existing.booking_date}T${existing.end_time}`)

    return (
      (requestedStart >= existingStart && requestedStart < existingEnd) ||
      (requestedEnd > existingStart && requestedEnd <= existingEnd) ||
      (requestedStart <= existingStart && requestedEnd >= existingEnd)
    )
  })

  if (conflicts.length > 0) {
    throw new Error(`Booking conflict detected. ${conflicts.length} existing booking(s) overlap with this time slot.`)
  }

  const bookingNumber = `RND-BOOK-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const start = new Date(`${booking.booking_date}T${booking.start_time}`)
  const end = new Date(`${booking.booking_date}T${booking.end_time}`)
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  
  const { data, error } = await supabase
    .from("rnd_lab_bookings")
    .insert({
      booking_number: bookingNumber,
      lab_space: booking.lab_space,
      asset_id: booking.asset_id,
      equipment_name: booking.equipment_name,
      rnd_project_id: booking.rnd_project_id,
      experiment_id: booking.experiment_id,
      booking_date: booking.booking_date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      duration_hours: durationHours,
      purpose: booking.purpose,
      special_requirements: booking.special_requirements,
      booked_by: booking.booked_by,
      booked_by_name: booking.booked_by_name,
      status: "scheduled",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function checkLabBookingConflicts(booking: {
  lab_space: string
  booking_date: string
  start_time: string
  end_time: string
  exclude_booking_id?: string
}) {
  let query = supabase
    .from("rnd_lab_bookings")
    .select("*")
    .eq("booking_date", booking.booking_date)
    .eq("lab_space", booking.lab_space)
    .in("status", ["scheduled", "in_use"])

  if (booking.exclude_booking_id) {
    query = query.neq("id", booking.exclude_booking_id)
  }

  const { data: existingBookings, error } = await query

  if (error) throw error

  const requestedStart = new Date(`${booking.booking_date}T${booking.start_time}`)
  const requestedEnd = new Date(`${booking.booking_date}T${booking.end_time}`)

  const conflicts = (existingBookings || []).filter((existing: any) => {
    const existingStart = new Date(`${existing.booking_date}T${existing.start_time}`)
    const existingEnd = new Date(`${existing.booking_date}T${existing.end_time}`)

    return (
      (requestedStart >= existingStart && requestedStart < existingEnd) ||
      (requestedEnd > existingStart && requestedEnd <= existingEnd) ||
      (requestedStart <= existingStart && requestedEnd >= existingEnd)
    )
  })

  return conflicts
}

export async function getRNDCollaborations(filters?: {
  status?: string
  collaboration_type?: string
}) {
  let query = supabase.from("rnd_collaborations").select("*")

  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.collaboration_type) query = query.eq("collaboration_type", filters.collaboration_type)

  const { data, error } = await query.order("start_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function getRNDMilestones(filters?: {
  rnd_project_id?: string
  status?: string
}) {
  let query = supabase.from("rnd_milestones").select("*")

  if (filters?.rnd_project_id) query = query.eq("rnd_project_id", filters.rnd_project_id)
  if (filters?.status) query = query.eq("status", filters.status)

  const { data, error } = await query.order("target_date", { ascending: true })

  if (error) throw error
  return data || []
}

// ============================================
// WELLNESS & ENGAGEMENT FUNCTIONS
// ============================================

export interface WellnessProgram {
  id: string
  program_number: string
  program_name: string
  program_type: string
  description: string
  objectives?: string[]
  start_date: string
  end_date?: string
  status: string
  target_audience?: string
  participation_limit?: number
  current_participants: number
  budget_allocated: number
  budget_utilized: number
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface WellnessChallenge {
  id: string
  challenge_number: string
  challenge_name: string
  challenge_type: string
  description: string
  rules?: string
  start_date: string
  end_date: string
  status: string
  participation_type: string
  max_participants?: number
  current_participants: number
  reward_type?: string
  reward_description?: string
  tracking_method?: string
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface WellnessEvent {
  id: string
  event_number: string
  event_name: string
  event_type: string
  description: string
  event_date: string
  start_time: string
  end_time: string
  location?: string
  virtual_link?: string
  event_format: string
  max_attendees?: number
  current_attendees: number
  status: string
  facilitator_id?: string
  facilitator_name?: string
  cost_per_person: number
  total_cost: number
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface WellnessSurvey {
  id: string
  survey_number: string
  survey_name: string
  survey_type: string
  description?: string
  questions: any
  start_date: string
  end_date: string
  status: string
  target_audience?: string
  anonymity_level: string
  response_count: number
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface WellnessResource {
  id: string
  resource_number: string
  resource_name: string
  resource_type: string
  category?: string
  description?: string
  content_url?: string
  file_path?: string
  tags?: string[]
  view_count: number
  rating_average: number
  rating_count: number
  is_featured: boolean
  is_premium: boolean
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface WellnessMetric {
  id: string
  metric_number: string
  metric_type: string
  metric_value: number
  metric_unit?: string
  measurement_date: string
  employee_id: string
  department?: string
  source?: string
  notes?: string
  created_at: string
  updated_at: string
}

export async function getWellnessPrograms(filters?: {
  status?: string
  program_type?: string
}) {
  let query = supabase.from("wellness_programs").select("*")

  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.program_type) query = query.eq("program_type", filters.program_type)

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createWellnessProgram(program: {
  program_name: string
  program_type: string
  description: string
  objectives?: string[]
  start_date: string
  end_date?: string
  target_audience?: string
  participation_limit?: number
  budget_allocated?: number
  created_by: string
  created_by_name: string
}) {
  const programNumber = `WELL-PROG-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("wellness_programs")
    .insert({
      program_number: programNumber,
      program_name: program.program_name,
      program_type: program.program_type,
      description: program.description,
      objectives: program.objectives,
      start_date: program.start_date,
      end_date: program.end_date,
      target_audience: program.target_audience,
      participation_limit: program.participation_limit,
      budget_allocated: program.budget_allocated || 0,
      created_by: program.created_by,
      created_by_name: program.created_by_name,
      status: "planned",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getWellnessChallenges(filters?: {
  status?: string
  challenge_type?: string
}) {
  let query = supabase.from("wellness_challenges").select("*")

  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.challenge_type) query = query.eq("challenge_type", filters.challenge_type)

  const { data, error } = await query.order("start_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createWellnessChallenge(challenge: {
  challenge_name: string
  challenge_type: string
  description: string
  rules?: string
  start_date: string
  end_date: string
  participation_type?: string
  max_participants?: number
  reward_type?: string
  reward_description?: string
  tracking_method?: string
  created_by: string
  created_by_name: string
}) {
  const challengeNumber = `WELL-CHAL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("wellness_challenges")
    .insert({
      challenge_number: challengeNumber,
      challenge_name: challenge.challenge_name,
      challenge_type: challenge.challenge_type,
      description: challenge.description,
      rules: challenge.rules,
      start_date: challenge.start_date,
      end_date: challenge.end_date,
      participation_type: challenge.participation_type || "individual",
      max_participants: challenge.max_participants,
      reward_type: challenge.reward_type,
      reward_description: challenge.reward_description,
      tracking_method: challenge.tracking_method,
      created_by: challenge.created_by,
      created_by_name: challenge.created_by_name,
      status: "upcoming",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getWellnessEvents(filters?: {
  event_date?: string
  status?: string
  event_type?: string
}) {
  let query = supabase.from("wellness_events").select("*")

  if (filters?.event_date) query = query.eq("event_date", filters.event_date)
  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.event_type) query = query.eq("event_type", filters.event_type)

  const { data, error } = await query.order("event_date", { ascending: true }).order("start_time", { ascending: true })

  if (error) throw error
  return data || []
}

export async function createWellnessEvent(event: {
  event_name: string
  event_type: string
  description: string
  event_date: string
  start_time: string
  end_time: string
  location?: string
  virtual_link?: string
  event_format?: string
  max_attendees?: number
  facilitator_id?: string
  facilitator_name?: string
  cost_per_person?: number
  created_by: string
  created_by_name: string
}) {
  const eventNumber = `WELL-EVT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const totalCost = (event.cost_per_person || 0) * (event.max_attendees || 0)
  
  const { data, error } = await supabase
    .from("wellness_events")
    .insert({
      event_number: eventNumber,
      event_name: event.event_name,
      event_type: event.event_type,
      description: event.description,
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location,
      virtual_link: event.virtual_link,
      event_format: event.event_format || "in_person",
      max_attendees: event.max_attendees,
      facilitator_id: event.facilitator_id,
      facilitator_name: event.facilitator_name,
      cost_per_person: event.cost_per_person || 0,
      total_cost: totalCost,
      created_by: event.created_by,
      created_by_name: event.created_by_name,
      status: "scheduled",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getWellnessSurveys(filters?: {
  status?: string
  survey_type?: string
}) {
  let query = supabase.from("wellness_surveys").select("*")

  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.survey_type) query = query.eq("survey_type", filters.survey_type)

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function getWellnessResources(filters?: {
  category?: string
  resource_type?: string
  is_featured?: boolean
}) {
  let query = supabase.from("wellness_resources").select("*")

  if (filters?.category) query = query.eq("category", filters.category)
  if (filters?.resource_type) query = query.eq("resource_type", filters.resource_type)
  if (filters?.is_featured !== undefined) query = query.eq("is_featured", filters.is_featured)

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function getEmployeeWellnessPoints(employeeId: string) {
  const { data, error } = await supabase
    .from("wellness_points")
    .select("*")
    .eq("employee_id", employeeId)
    .order("earned_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function getEmployeeWellnessBadges(employeeId: string) {
  const { data, error } = await supabase
    .from("wellness_badge_awards")
    .select(`
      *,
      wellness_badges (*)
    `)
    .eq("employee_id", employeeId)
    .order("awarded_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function getWellnessLeaderboard(challengeId?: string, limit: number = 10) {
  let query = supabase
    .from("wellness_points")
    .select("employee_id, employee_name, SUM(points_earned) as total_points")
    .group("employee_id, employee_name")
    .order("total_points", { ascending: false })
    .limit(limit)

  if (challengeId) {
    query = query.eq("related_challenge_id", challengeId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

// ============================================
// RECRUITMENT FUNCTIONS
// ============================================

export interface JobPosting {
  id: string
  title: string
  department: string
  description: string
  requirements: string[]
  status: string
  posted_by?: string
  posted_at?: string
  closing_date?: string
  created_at: string
  updated_at: string
}

export interface Candidate {
  id: string
  job_posting_id: string
  name: string
  email: string
  phone?: string
  resume_url?: string
  status: string
  interview_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export async function getJobPostings(status?: string) {
  let query = supabase.from("job_postings").select("*")

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createJobPosting(posting: {
  title: string
  department: string
  description: string
  requirements?: string[]
  status?: string
  posted_by?: string
  closing_date?: string
}) {
  const { data, error } = await supabase
    .from("job_postings")
    .insert({
      title: posting.title,
      department: posting.department,
      description: posting.description,
      requirements: posting.requirements || [],
      status: posting.status || "open",
      posted_by: posting.posted_by,
      closing_date: posting.closing_date,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateJobPosting(postingId: string, updates: Partial<JobPosting>) {
  const { data, error } = await supabase
    .from("job_postings")
    .update(updates)
    .eq("id", postingId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getCandidates(jobPostingId?: string) {
  let query = supabase.from("candidates").select("*")

  if (jobPostingId) {
    query = query.eq("job_posting_id", jobPostingId)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createCandidate(candidate: {
  job_posting_id: string
  name: string
  email: string
  phone?: string
  resume_url?: string
  status?: string
  interview_date?: string
  notes?: string
}) {
  const { data, error } = await supabase
    .from("candidates")
    .insert({
      job_posting_id: candidate.job_posting_id,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      resume_url: candidate.resume_url,
      status: candidate.status || "applied",
      interview_date: candidate.interview_date,
      notes: candidate.notes,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCandidate(candidateId: string, updates: Partial<Candidate>) {
  const { data, error } = await supabase
    .from("candidates")
    .update(updates)
    .eq("id", candidateId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// LEAVE REQUEST FUNCTIONS (Additional)
// ============================================

export async function createLeaveRequest(request: {
  employee_id: string
  employee_name: string
  type: string
  from_date: string
  to_date: string
  days: number
  reason?: string
}) {
  const { data, error } = await supabase
    .from("leave_requests")
    .insert({
      employee_id: request.employee_id,
      employee_name: request.employee_name,
      type: request.type,
      from_date: request.from_date,
      to_date: request.to_date,
      days: request.days,
      reason: request.reason,
      status: "Pending",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateLeaveRequest(requestId: string, updates: Partial<{
  status: string
  approved_by?: string
  approved_at?: string
}>) {
  const { data, error } = await supabase
    .from("leave_requests")
    .update(updates)
    .eq("id", requestId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// EMPLOYEE FUNCTIONS (Additional)
// ============================================

export interface Employee {
  id: string
  user_id?: string
  name: string
  email: string
  department: string
  role: string
  status: string
  join_date: string
  phone?: string
  address?: string
  emergency_contact?: string
  
  // Personal Information
  employee_number?: string
  first_name?: string
  last_name?: string
  middle_name?: string
  date_of_birth?: string
  gender?: string
  marital_status?: string
  nationality?: string
  photo_url?: string
  
  // Contact Information (Enhanced)
  mobile_phone?: string
  work_phone?: string
  personal_email?: string
  city?: string
  state_province?: string
  postal_code?: string
  country?: string
  
  // Emergency Contact (Enhanced)
  emergency_contact_name?: string
  emergency_contact_relationship?: string
  emergency_contact_phone?: string
  emergency_contact_email?: string
  
  // Employment Information (Enhanced)
  position?: string
  manager_id?: string
  manager_name?: string
  employment_type?: string
  work_location?: string
  office_location?: string
  termination_date?: string
  termination_reason?: string
  probation_end_date?: string
  notice_period_days?: number
  
  // Compensation & Benefits
  base_salary?: number
  salary_currency?: string
  pay_frequency?: string
  benefits_enrolled?: boolean
  health_insurance_provider?: string
  retirement_plan?: string
  
  // Documents & Compliance
  social_security_number?: string
  tax_id?: string
  passport_number?: string
  passport_expiry_date?: string
  work_permit_number?: string
  work_permit_expiry_date?: string
  visa_type?: string
  visa_expiry_date?: string
  contract_document_url?: string
  
  // Additional Information
  bio?: string
  skills?: string[]
  certifications?: any[]
  education?: any[]
  previous_experience?: any[]
  languages?: string[]
  timezone?: string
  
  // System & Tracking
  last_review_date?: string
  next_review_date?: string
  performance_rating?: string
  notes?: string
  is_confidential?: boolean
  created_by?: string
  updated_by?: string
  
  created_at: string
  updated_at: string
}

export async function createEmployee(employee: {
  user_id?: string
  name: string
  email: string
  department: string
  role: string
  status?: string
  join_date: string
  phone?: string
  address?: string
  emergency_contact?: string
  // Enhanced fields
  employee_number?: string
  first_name?: string
  last_name?: string
  middle_name?: string
  date_of_birth?: string
  gender?: string
  marital_status?: string
  nationality?: string
  photo_url?: string
  mobile_phone?: string
  work_phone?: string
  personal_email?: string
  city?: string
  state_province?: string
  postal_code?: string
  country?: string
  emergency_contact_name?: string
  emergency_contact_relationship?: string
  emergency_contact_phone?: string
  emergency_contact_email?: string
  position?: string
  manager_id?: string
  manager_name?: string
  employment_type?: string
  work_location?: string
  office_location?: string
  termination_date?: string
  termination_reason?: string
  probation_end_date?: string
  notice_period_days?: number
  base_salary?: number
  salary_currency?: string
  pay_frequency?: string
  benefits_enrolled?: boolean
  health_insurance_provider?: string
  retirement_plan?: string
  social_security_number?: string
  tax_id?: string
  passport_number?: string
  passport_expiry_date?: string
  work_permit_number?: string
  work_permit_expiry_date?: string
  visa_type?: string
  visa_expiry_date?: string
  contract_document_url?: string
  bio?: string
  skills?: string[]
  certifications?: any[]
  education?: any[]
  previous_experience?: any[]
  languages?: string[]
  timezone?: string
  last_review_date?: string
  next_review_date?: string
  performance_rating?: string
  notes?: string
  is_confidential?: boolean
  created_by?: string
  updated_by?: string
}) {
  const { data, error } = await supabase
    .from("employees")
    .insert({
      user_id: employee.user_id,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      role: employee.role,
      status: employee.status || "Active",
      join_date: employee.join_date,
      phone: employee.phone,
      address: employee.address,
      emergency_contact: employee.emergency_contact,
      // Enhanced fields
      employee_number: employee.employee_number,
      first_name: employee.first_name,
      last_name: employee.last_name,
      middle_name: employee.middle_name,
      date_of_birth: employee.date_of_birth,
      gender: employee.gender,
      marital_status: employee.marital_status,
      nationality: employee.nationality,
      photo_url: employee.photo_url,
      mobile_phone: employee.mobile_phone,
      work_phone: employee.work_phone,
      personal_email: employee.personal_email,
      city: employee.city,
      state_province: employee.state_province,
      postal_code: employee.postal_code,
      country: employee.country,
      emergency_contact_name: employee.emergency_contact_name,
      emergency_contact_relationship: employee.emergency_contact_relationship,
      emergency_contact_phone: employee.emergency_contact_phone,
      emergency_contact_email: employee.emergency_contact_email,
      position: employee.position,
      manager_id: employee.manager_id,
      manager_name: employee.manager_name,
      employment_type: employee.employment_type,
      work_location: employee.work_location,
      office_location: employee.office_location,
      termination_date: employee.termination_date,
      termination_reason: employee.termination_reason,
      probation_end_date: employee.probation_end_date,
      notice_period_days: employee.notice_period_days,
      base_salary: employee.base_salary,
      salary_currency: employee.salary_currency,
      pay_frequency: employee.pay_frequency,
      benefits_enrolled: employee.benefits_enrolled,
      health_insurance_provider: employee.health_insurance_provider,
      retirement_plan: employee.retirement_plan,
      social_security_number: employee.social_security_number,
      tax_id: employee.tax_id,
      passport_number: employee.passport_number,
      passport_expiry_date: employee.passport_expiry_date,
      work_permit_number: employee.work_permit_number,
      work_permit_expiry_date: employee.work_permit_expiry_date,
      visa_type: employee.visa_type,
      visa_expiry_date: employee.visa_expiry_date,
      contract_document_url: employee.contract_document_url,
      bio: employee.bio,
      skills: employee.skills,
      certifications: employee.certifications,
      education: employee.education,
      previous_experience: employee.previous_experience,
      languages: employee.languages,
      timezone: employee.timezone,
      last_review_date: employee.last_review_date,
      next_review_date: employee.next_review_date,
      performance_rating: employee.performance_rating,
      notes: employee.notes,
      is_confidential: employee.is_confidential,
      created_by: employee.created_by,
      updated_by: employee.updated_by,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateEmployee(employeeId: string, updates: Partial<{
  name: string
  email: string
  department: string
  role: string
  status: string
  phone: string
  address: string
  emergency_contact: string
  // Enhanced fields
  employee_number: string
  first_name: string
  last_name: string
  middle_name: string
  date_of_birth: string
  gender: string
  marital_status: string
  nationality: string
  photo_url: string
  mobile_phone: string
  work_phone: string
  personal_email: string
  city: string
  state_province: string
  postal_code: string
  country: string
  emergency_contact_name: string
  emergency_contact_relationship: string
  emergency_contact_phone: string
  emergency_contact_email: string
  position: string
  manager_id: string
  manager_name: string
  employment_type: string
  work_location: string
  office_location: string
  termination_date: string
  termination_reason: string
  probation_end_date: string
  notice_period_days: number
  base_salary: number
  salary_currency: string
  pay_frequency: string
  benefits_enrolled: boolean
  health_insurance_provider: string
  retirement_plan: string
  social_security_number: string
  tax_id: string
  passport_number: string
  passport_expiry_date: string
  work_permit_number: string
  work_permit_expiry_date: string
  visa_type: string
  visa_expiry_date: string
  contract_document_url: string
  bio: string
  skills: string[]
  certifications: any[]
  education: any[]
  previous_experience: any[]
  languages: string[]
  timezone: string
  last_review_date: string
  next_review_date: string
  performance_rating: string
  notes: string
  is_confidential: boolean
  updated_by: string
}>) {
  const { data, error } = await supabase
    .from("employees")
    .update(updates)
    .eq("id", employeeId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteEmployee(employeeId: string) {
  const { error } = await supabase.from("employees").delete().eq("id", employeeId)

  if (error) throw error
}

// ============================================
// MARKETING & COMMUNICATIONS FUNCTIONS
// ============================================

export interface MarketingCampaign {
  id: string
  campaign_number: string
  campaign_name: string
  campaign_type: string
  description: string
  objective: string
  target_audience?: string
  start_date: string
  end_date?: string
  status: string
  budget_allocated: number
  budget_spent: number
  expected_roi?: number
  actual_roi?: number
  impressions: number
  clicks: number
  conversions: number
  engagement_rate?: number
  cost_per_click?: number
  cost_per_conversion?: number
  revenue_generated: number
  campaign_manager_id?: string
  campaign_manager_name?: string
  created_by?: string
  created_by_name: string
  department: string
  channels?: string[]
  tags?: string[]
  notes?: string
  created_at: string
  updated_at: string
}

export interface ContentCalendar {
  id: string
  content_number: string
  title: string
  content_type: string
  description?: string
  content_text?: string
  scheduled_date: string
  scheduled_time?: string
  publish_date?: string
  publish_time?: string
  status: string
  priority: string
  assigned_to?: string
  assigned_to_name?: string
  campaign_id?: string
  channels?: string[]
  target_audience?: string
  keywords?: string[]
  seo_meta_title?: string
  seo_meta_description?: string
  content_url?: string
  thumbnail_url?: string
  approval_status: string
  approved_by?: string
  approved_by_name?: string
  approval_date?: string
  performance_metrics?: any
  created_by?: string
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface SocialMediaPost {
  id: string
  post_number: string
  platform: string
  account_name: string
  post_type: string
  content_text: string
  media_urls?: string[]
  scheduled_date?: string
  scheduled_time?: string
  published_date?: string
  published_time?: string
  status: string
  campaign_id?: string
  content_calendar_id?: string
  hashtags?: string[]
  mentions?: string[]
  link_url?: string
  performance_metrics?: any
  engagement_rate?: number
  created_by?: string
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface MarketingEvent {
  id: string
  event_number: string
  event_name: string
  event_type: string
  description: string
  location?: string
  venue_name?: string
  venue_address?: string
  start_date: string
  start_time?: string
  end_date?: string
  end_time?: string
  timezone: string
  status: string
  registration_required: boolean
  registration_url?: string
  max_attendees?: number
  registered_attendees: number
  actual_attendees: number
  budget_allocated: number
  budget_spent: number
  campaign_id?: string
  event_manager_id?: string
  event_manager_name?: string
  speakers?: string[]
  sponsors?: string[]
  partners?: string[]
  marketing_channels?: string[]
  event_website_url?: string
  event_recording_url?: string
  feedback_score?: number
  leads_generated: number
  created_by?: string
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface BrandAsset {
  id: string
  asset_number: string
  asset_name: string
  asset_type: string
  category?: string
  description?: string
  file_url: string
  thumbnail_url?: string
  file_size?: number
  file_format?: string
  tags?: string[]
  usage_rights: string
  version: string
  is_active: boolean
  is_approved: boolean
  approved_by?: string
  approved_by_name?: string
  approval_date?: string
  brand_guideline_compliant: boolean
  download_count: number
  last_used_date?: string
  campaign_id?: string
  content_calendar_id?: string
  created_by?: string
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface CampaignPerformance {
  id: string
  campaign_id: string
  snapshot_date: string
  impressions: number
  clicks: number
  conversions: number
  engagement: number
  revenue: number
  spend: number
  ctr?: number
  conversion_rate?: number
  cpc?: number
  cpa?: number
  roas?: number
  roi?: number
  notes?: string
  created_at: string
}

// Campaign Functions
export async function createMarketingCampaign(campaign: {
  campaign_name: string
  campaign_type: string
  description: string
  objective: string
  target_audience?: string
  start_date: string
  end_date?: string
  budget_allocated?: number
  expected_roi?: number
  campaign_manager_id?: string
  campaign_manager_name?: string
  created_by: string
  created_by_name: string
  channels?: string[]
  tags?: string[]
}) {
  const campaignNumber = `MKT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("marketing_campaigns")
    .insert({
      campaign_number: campaignNumber,
      campaign_name: campaign.campaign_name,
      campaign_type: campaign.campaign_type,
      description: campaign.description,
      objective: campaign.objective,
      target_audience: campaign.target_audience,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      budget_allocated: campaign.budget_allocated || 0,
      expected_roi: campaign.expected_roi,
      campaign_manager_id: campaign.campaign_manager_id,
      campaign_manager_name: campaign.campaign_manager_name,
      created_by: campaign.created_by,
      created_by_name: campaign.created_by_name,
      channels: campaign.channels,
      tags: campaign.tags,
      status: "planning",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMarketingCampaigns(filters?: {
  status?: string
  campaign_type?: string
}) {
  let query = supabase.from("marketing_campaigns").select("*")

  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.campaign_type) query = query.eq("campaign_type", filters.campaign_type)

  const { data, error } = await query.order("start_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateMarketingCampaign(campaignId: string, updates: Partial<MarketingCampaign>) {
  const { data, error } = await supabase
    .from("marketing_campaigns")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", campaignId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Content Calendar Functions
export async function createContentCalendarItem(content: {
  title: string
  content_type: string
  description?: string
  content_text?: string
  scheduled_date: string
  scheduled_time?: string
  priority?: string
  assigned_to?: string
  assigned_to_name?: string
  campaign_id?: string
  channels?: string[]
  target_audience?: string
  keywords?: string[]
  created_by: string
  created_by_name: string
}) {
  const contentNumber = `CNT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("content_calendar")
    .insert({
      content_number: contentNumber,
      title: content.title,
      content_type: content.content_type,
      description: content.description,
      content_text: content.content_text,
      scheduled_date: content.scheduled_date,
      scheduled_time: content.scheduled_time,
      priority: content.priority || "medium",
      assigned_to: content.assigned_to,
      assigned_to_name: content.assigned_to_name,
      campaign_id: content.campaign_id,
      channels: content.channels,
      target_audience: content.target_audience,
      keywords: content.keywords,
      created_by: content.created_by,
      created_by_name: content.created_by_name,
      status: "draft",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getContentCalendar(filters?: {
  status?: string
  content_type?: string
  start_date?: string
  end_date?: string
}) {
  let query = supabase.from("content_calendar").select("*")

  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.content_type) query = query.eq("content_type", filters.content_type)
  if (filters?.start_date) query = query.gte("scheduled_date", filters.start_date)
  if (filters?.end_date) query = query.lte("scheduled_date", filters.end_date)

  const { data, error } = await query.order("scheduled_date", { ascending: true })

  if (error) throw error
  return data || []
}

// Social Media Functions
export async function createSocialMediaPost(post: {
  platform: string
  account_name: string
  post_type: string
  content_text: string
  media_urls?: string[]
  scheduled_date?: string
  scheduled_time?: string
  campaign_id?: string
  content_calendar_id?: string
  hashtags?: string[]
  mentions?: string[]
  link_url?: string
  created_by: string
  created_by_name: string
}) {
  const postNumber = `SOC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("social_media_posts")
    .insert({
      post_number: postNumber,
      platform: post.platform,
      account_name: post.account_name,
      post_type: post.post_type,
      content_text: post.content_text,
      media_urls: post.media_urls,
      scheduled_date: post.scheduled_date,
      scheduled_time: post.scheduled_time,
      campaign_id: post.campaign_id,
      content_calendar_id: post.content_calendar_id,
      hashtags: post.hashtags,
      mentions: post.mentions,
      link_url: post.link_url,
      created_by: post.created_by,
      created_by_name: post.created_by_name,
      status: post.scheduled_date ? "scheduled" : "draft",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSocialMediaPosts(filters?: {
  platform?: string
  status?: string
  campaign_id?: string
}) {
  let query = supabase.from("social_media_posts").select("*")

  if (filters?.platform) query = query.eq("platform", filters.platform)
  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.campaign_id) query = query.eq("campaign_id", filters.campaign_id)

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

// Event Functions
export async function createMarketingEvent(event: {
  event_name: string
  event_type: string
  description: string
  location?: string
  venue_name?: string
  venue_address?: string
  start_date: string
  start_time?: string
  end_date?: string
  end_time?: string
  registration_required?: boolean
  registration_url?: string
  max_attendees?: number
  budget_allocated?: number
  campaign_id?: string
  event_manager_id?: string
  event_manager_name?: string
  speakers?: string[]
  created_by: string
  created_by_name: string
}) {
  const eventNumber = `EVT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("marketing_events")
    .insert({
      event_number: eventNumber,
      event_name: event.event_name,
      event_type: event.event_type,
      description: event.description,
      location: event.location,
      venue_name: event.venue_name,
      venue_address: event.venue_address,
      start_date: event.start_date,
      start_time: event.start_time,
      end_date: event.end_date,
      end_time: event.end_time,
      registration_required: event.registration_required || false,
      registration_url: event.registration_url,
      max_attendees: event.max_attendees,
      budget_allocated: event.budget_allocated || 0,
      campaign_id: event.campaign_id,
      event_manager_id: event.event_manager_id,
      event_manager_name: event.event_manager_name,
      speakers: event.speakers,
      created_by: event.created_by,
      created_by_name: event.created_by_name,
      status: "planning",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMarketingEvents(filters?: {
  status?: string
  event_type?: string
  start_date?: string
  end_date?: string
}) {
  let query = supabase.from("marketing_events").select("*")

  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.event_type) query = query.eq("event_type", filters.event_type)
  if (filters?.start_date) query = query.gte("start_date", filters.start_date)
  if (filters?.end_date) query = query.lte("start_date", filters.end_date)

  const { data, error } = await query.order("start_date", { ascending: true })

  if (error) throw error
  return data || []
}

// Brand Asset Functions
export async function createBrandAsset(asset: {
  asset_name: string
  asset_type: string
  category?: string
  description?: string
  file_url: string
  thumbnail_url?: string
  file_size?: number
  file_format?: string
  tags?: string[]
  usage_rights: string
  campaign_id?: string
  content_calendar_id?: string
  created_by: string
  created_by_name: string
}) {
  const assetNumber = `AST-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("brand_assets")
    .insert({
      asset_number: assetNumber,
      asset_name: asset.asset_name,
      asset_type: asset.asset_type,
      category: asset.category,
      description: asset.description,
      file_url: asset.file_url,
      thumbnail_url: asset.thumbnail_url,
      file_size: asset.file_size,
      file_format: asset.file_format,
      tags: asset.tags,
      usage_rights: asset.usage_rights,
      campaign_id: asset.campaign_id,
      content_calendar_id: asset.content_calendar_id,
      created_by: asset.created_by,
      created_by_name: asset.created_by_name,
      version: "1.0",
      is_active: true,
      is_approved: false,
      brand_guideline_compliant: true,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getBrandAssets(filters?: {
  asset_type?: string
  category?: string
  is_active?: boolean
}) {
  let query = supabase.from("brand_assets").select("*")

  if (filters?.asset_type) query = query.eq("asset_type", filters.asset_type)
  if (filters?.category) query = query.eq("category", filters.category)
  if (filters?.is_active !== undefined) query = query.eq("is_active", filters.is_active)

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

// Campaign Performance Functions
export async function getCampaignPerformance(campaignId: string, startDate?: string, endDate?: string) {
  let query = supabase.from("campaign_performance").select("*").eq("campaign_id", campaignId)

  if (startDate) query = query.gte("snapshot_date", startDate)
  if (endDate) query = query.lte("snapshot_date", endDate)

  const { data, error } = await query.order("snapshot_date", { ascending: true })

  if (error) throw error
  return data || []
}

export async function recordCampaignPerformance(performance: {
  campaign_id: string
  snapshot_date: string
  impressions?: number
  clicks?: number
  conversions?: number
  engagement?: number
  revenue?: number
  spend?: number
  notes?: string
}) {
  const { data, error } = await supabase
    .from("campaign_performance")
    .upsert({
      campaign_id: performance.campaign_id,
      snapshot_date: performance.snapshot_date,
      impressions: performance.impressions || 0,
      clicks: performance.clicks || 0,
      conversions: performance.conversions || 0,
      engagement: performance.engagement || 0,
      revenue: performance.revenue || 0,
      spend: performance.spend || 0,
      notes: performance.notes,
    }, {
      onConflict: "campaign_id,snapshot_date"
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// PMO (Project Management Office) Functions
// ============================================

export interface PMOProject {
  id: string
  project_id: string | null
  project_number: string
  project_type: string
  priority: string
  health_indicator: string
  complexity: string
  strategic_alignment: string[]
  start_date: string
  planned_end_date: string | null
  actual_end_date: string | null
  planned_duration_days: number | null
  actual_duration_days: number | null
  timeline_variance_days: number
  budget_allocated: number
  budget_spent: number
  budget_remaining: number
  budget_variance: number
  forecasted_cost: number | null
  project_manager_id: string | null
  project_manager_name: string | null
  sponsor_id: string | null
  sponsor_name: string | null
  business_case: string | null
  success_criteria: string | null
  created_by: string | null
  created_by_name: string | null
  created_at: string
  updated_at: string
}

export interface PMOMilestone {
  id: string
  milestone_number: string
  pmo_project_id: string
  milestone_name: string
  milestone_type: string | null
  description: string | null
  planned_date: string
  actual_date: string | null
  status: string
  completion_percentage: number
  dependencies: string[]
  assigned_to: string | null
  assigned_to_name: string | null
  is_critical: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PMOProjectResource {
  id: string
  pmo_project_id: string
  employee_id: string
  employee_name: string
  role_in_project: string
  allocation_percentage: number
  planned_hours: number
  actual_hours: number
  hourly_rate: number | null
  start_date: string | null
  end_date: string | null
  status: string
  skills_required: string[]
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PMOProjectRisk {
  id: string
  risk_number: string
  pmo_project_id: string
  risk_title: string
  risk_description: string
  risk_category: string | null
  probability: string
  impact: string
  risk_level: string
  status: string
  mitigation_strategy: string | null
  mitigation_owner_id: string | null
  mitigation_owner_name: string | null
  mitigation_due_date: string | null
  residual_risk_level: string | null
  identified_by: string | null
  identified_by_name: string | null
  identified_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PMOProjectIssue {
  id: string
  issue_number: string
  pmo_project_id: string
  issue_title: string
  issue_description: string
  issue_category: string | null
  priority: string
  status: string
  impact_description: string | null
  resolution_plan: string | null
  assigned_to: string | null
  assigned_to_name: string | null
  due_date: string | null
  resolved_date: string | null
  resolved_by: string | null
  resolved_by_name: string | null
  reported_by: string | null
  reported_by_name: string | null
  reported_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PMOProjectStakeholder {
  id: string
  pmo_project_id: string
  stakeholder_id: string | null
  stakeholder_name: string
  stakeholder_email: string | null
  stakeholder_role: string | null
  interest_level: string
  influence_level: string
  engagement_strategy: string | null
  communication_frequency: string | null
  communication_preference: string | null
  satisfaction_rating: number | null
  last_contact_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PMOStatusReport {
  id: string
  report_number: string
  pmo_project_id: string
  report_period_start: string
  report_period_end: string
  report_type: string
  status_summary: string
  accomplishments: string[]
  challenges: string[]
  next_steps: string[]
  budget_status: string | null
  timeline_status: string | null
  risk_summary: string | null
  issue_summary: string | null
  overall_health: string
  reported_by: string | null
  reported_by_name: string | null
  report_date: string
  created_at: string
  updated_at: string
}

// PMO Project Functions
export async function getPMOProjects(filters?: {
  project_type?: string
  priority?: string
  health_indicator?: string
  project_manager_id?: string
}) {
  try {
    let query = supabase.from("pmo_projects").select("*")

    if (filters?.project_type) query = query.eq("project_type", filters.project_type)
    if (filters?.priority) query = query.eq("priority", filters.priority)
    if (filters?.health_indicator) query = query.eq("health_indicator", filters.health_indicator)
    if (filters?.project_manager_id) query = query.eq("project_manager_id", filters.project_manager_id)

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      // Better error logging
      const errorDetails = {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      }
      console.error("Error fetching PMO projects:", JSON.stringify(errorDetails, null, 2))
      
      // Check for RLS/permission errors
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy') || error.message?.includes('recursion')) {
        console.warn("Permission/RLS error detected. User may not have access to PMO projects. Returning empty array.")
        return []
      }
      
      throw new Error(`Failed to fetch PMO projects: ${error.message || JSON.stringify(error)}`)
    }
    return data || []
  } catch (error: any) {
    console.error("Error in getPMOProjects:", error)
    // If table doesn't exist, return empty array instead of crashing
    if (error?.message?.includes("relation") || error?.message?.includes("does not exist")) {
      console.warn("PMO projects table may not exist yet. Returning empty array.")
      return []
    }
    // If it's a permission/RLS error, return empty array instead of throwing
    if (error?.code === '42501' || error?.message?.includes('permission') || error?.message?.includes('policy') || error?.message?.includes('recursion')) {
      console.warn("Permission/RLS error. Returning empty array.")
      return []
    }
    throw error
  }
}

export async function createPMOProject(project: {
  project_id?: string
  project_type: string
  priority?: string
  complexity?: string
  strategic_alignment?: string[]
  start_date: string
  planned_end_date?: string
  budget_allocated?: number
  project_manager_id?: string
  project_manager_name?: string
  sponsor_id?: string
  sponsor_name?: string
  business_case?: string
  success_criteria?: string
  created_by: string
  created_by_name: string
}) {
  const projectNumber = `PRJ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("pmo_projects")
    .insert({
      project_number: projectNumber,
      project_id: project.project_id,
      project_type: project.project_type,
      priority: project.priority || "medium",
      health_indicator: "green",
      complexity: project.complexity || "medium",
      strategic_alignment: project.strategic_alignment || [],
      start_date: project.start_date,
      planned_end_date: project.planned_end_date,
      budget_allocated: project.budget_allocated || 0,
      budget_spent: 0,
      budget_remaining: project.budget_allocated || 0,
      budget_variance: 0,
      project_manager_id: project.project_manager_id,
      project_manager_name: project.project_manager_name,
      sponsor_id: project.sponsor_id,
      sponsor_name: project.sponsor_name,
      business_case: project.business_case,
      success_criteria: project.success_criteria,
      created_by: project.created_by,
      created_by_name: project.created_by_name,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePMOProject(projectId: string, updates: Partial<PMOProject>) {
  const { data, error } = await supabase
    .from("pmo_projects")
    .update(updates)
    .eq("id", projectId)
    .select()
    .single()

  if (error) throw error
  return data
}

// PMO Milestone Functions
export async function getPMOMilestones(pmoProjectId?: string) {
  try {
    let query = supabase.from("pmo_milestones").select("*")

    if (pmoProjectId) query = query.eq("pmo_project_id", pmoProjectId)

    const { data, error } = await query.order("planned_date", { ascending: true })

    if (error) {
      // Better error logging
      const errorDetails = {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      }
      console.error("Error fetching PMO milestones:", JSON.stringify(errorDetails, null, 2))
      
      // Check for RLS/permission errors
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
        console.warn("Permission denied. User may not have access to PMO milestones. Returning empty array.")
        return []
      }
      
      throw new Error(`Failed to fetch PMO milestones: ${error.message || JSON.stringify(error)}`)
    }
    return data || []
  } catch (error: any) {
    console.error("Error in getPMOMilestones:", error)
    if (error?.message?.includes("relation") || error?.message?.includes("does not exist")) {
      console.warn("PMO milestones table may not exist yet. Returning empty array.")
      return []
    }
    // If it's a permission error, return empty array instead of throwing
    if (error?.code === '42501' || error?.message?.includes('permission') || error?.message?.includes('policy')) {
      console.warn("Permission denied. Returning empty array.")
      return []
    }
    throw error
  }
}

export async function createPMOMilestone(milestone: {
  pmo_project_id: string
  milestone_name: string
  milestone_type?: string
  description?: string
  planned_date: string
  assigned_to?: string
  assigned_to_name?: string
  is_critical?: boolean
}) {
  const milestoneNumber = `MS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("pmo_milestones")
    .insert({
      milestone_number: milestoneNumber,
      pmo_project_id: milestone.pmo_project_id,
      milestone_name: milestone.milestone_name,
      milestone_type: milestone.milestone_type,
      description: milestone.description,
      planned_date: milestone.planned_date,
      assigned_to: milestone.assigned_to,
      assigned_to_name: milestone.assigned_to_name,
      is_critical: milestone.is_critical || false,
      status: "pending",
      completion_percentage: 0,
      dependencies: [],
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// PMO Resource Functions
export async function getPMOProjectResources(pmoProjectId?: string) {
  try {
    let query = supabase.from("pmo_project_resources").select("*")

    if (pmoProjectId) query = query.eq("pmo_project_id", pmoProjectId)

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching PMO resources:", error)
      throw new Error(`Failed to fetch PMO resources: ${error.message || JSON.stringify(error)}`)
    }
    return data || []
  } catch (error: any) {
    console.error("Error in getPMOProjectResources:", error)
    if (error?.message?.includes("relation") || error?.message?.includes("does not exist")) {
      console.warn("PMO resources table may not exist yet. Returning empty array.")
      return []
    }
    throw error
  }
}

export async function createPMOProjectResource(resource: {
  pmo_project_id: string
  employee_id: string
  employee_name: string
  role_in_project: string
  allocation_percentage?: number
  planned_hours?: number
  start_date?: string
  end_date?: string
}) {
  const { data, error } = await supabase
    .from("pmo_project_resources")
    .insert({
      pmo_project_id: resource.pmo_project_id,
      employee_id: resource.employee_id,
      employee_name: resource.employee_name,
      role_in_project: resource.role_in_project,
      allocation_percentage: resource.allocation_percentage || 100,
      planned_hours: resource.planned_hours || 0,
      actual_hours: 0,
      start_date: resource.start_date,
      end_date: resource.end_date,
      status: "active",
      skills_required: [],
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// PMO Risk Functions
export async function getPMOProjectRisks(pmoProjectId?: string) {
  try {
    let query = supabase.from("pmo_project_risks").select("*")

    if (pmoProjectId) query = query.eq("pmo_project_id", pmoProjectId)

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching PMO risks:", error)
      throw new Error(`Failed to fetch PMO risks: ${error.message || JSON.stringify(error)}`)
    }
    return data || []
  } catch (error: any) {
    console.error("Error in getPMOProjectRisks:", error)
    if (error?.message?.includes("relation") || error?.message?.includes("does not exist")) {
      console.warn("PMO risks table may not exist yet. Returning empty array.")
      return []
    }
    throw error
  }
}

export async function createPMOProjectRisk(risk: {
  pmo_project_id: string
  risk_title: string
  risk_description: string
  risk_category?: string
  probability?: string
  impact?: string
  mitigation_strategy?: string
  identified_by?: string
  identified_by_name?: string
}) {
  const riskNumber = `RISK-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("pmo_project_risks")
    .insert({
      risk_number: riskNumber,
      pmo_project_id: risk.pmo_project_id,
      risk_title: risk.risk_title,
      risk_description: risk.risk_description,
      risk_category: risk.risk_category,
      probability: risk.probability || "medium",
      impact: risk.impact || "medium",
      status: "open",
      identified_by: risk.identified_by,
      identified_by_name: risk.identified_by_name,
      identified_date: new Date().toISOString().split('T')[0],
      mitigation_strategy: risk.mitigation_strategy,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// PMO Issue Functions
export async function getPMOProjectIssues(pmoProjectId?: string) {
  try {
    let query = supabase.from("pmo_project_issues").select("*")

    if (pmoProjectId) query = query.eq("pmo_project_id", pmoProjectId)

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching PMO issues:", error)
      throw new Error(`Failed to fetch PMO issues: ${error.message || JSON.stringify(error)}`)
    }
    return data || []
  } catch (error: any) {
    console.error("Error in getPMOProjectIssues:", error)
    if (error?.message?.includes("relation") || error?.message?.includes("does not exist")) {
      console.warn("PMO issues table may not exist yet. Returning empty array.")
      return []
    }
    throw error
  }
}

export async function createPMOProjectIssue(issue: {
  pmo_project_id: string
  issue_title: string
  issue_description: string
  issue_category?: string
  priority?: string
  reported_by?: string
  reported_by_name?: string
}) {
  const issueNumber = `ISS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("pmo_project_issues")
    .insert({
      issue_number: issueNumber,
      pmo_project_id: issue.pmo_project_id,
      issue_title: issue.issue_title,
      issue_description: issue.issue_description,
      issue_category: issue.issue_category,
      priority: issue.priority || "medium",
      status: "open",
      reported_by: issue.reported_by,
      reported_by_name: issue.reported_by_name,
      reported_date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// PMO Stakeholder Functions
export async function getPMOProjectStakeholders(pmoProjectId?: string) {
  let query = supabase.from("pmo_project_stakeholders").select("*")

  if (pmoProjectId) query = query.eq("pmo_project_id", pmoProjectId)

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createPMOProjectStakeholder(stakeholder: {
  pmo_project_id: string
  stakeholder_id?: string
  stakeholder_name: string
  stakeholder_email?: string
  stakeholder_role?: string
  interest_level?: string
  influence_level?: string
}) {
  const { data, error } = await supabase
    .from("pmo_project_stakeholders")
    .insert({
      pmo_project_id: stakeholder.pmo_project_id,
      stakeholder_id: stakeholder.stakeholder_id,
      stakeholder_name: stakeholder.stakeholder_name,
      stakeholder_email: stakeholder.stakeholder_email,
      stakeholder_role: stakeholder.stakeholder_role,
      interest_level: stakeholder.interest_level || "medium",
      influence_level: stakeholder.influence_level || "medium",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// PMO Status Report Functions
export async function getPMOStatusReports(pmoProjectId?: string) {
  try {
    let query = supabase.from("pmo_status_reports").select("*")

    if (pmoProjectId) query = query.eq("pmo_project_id", pmoProjectId)

    const { data, error } = await query.order("report_date", { ascending: false })

    if (error) {
      console.error("Error fetching PMO status reports:", error)
      throw new Error(`Failed to fetch PMO status reports: ${error.message || JSON.stringify(error)}`)
    }
    return data || []
  } catch (error: any) {
    console.error("Error in getPMOStatusReports:", error)
    if (error?.message?.includes("relation") || error?.message?.includes("does not exist")) {
      console.warn("PMO status reports table may not exist yet. Returning empty array.")
      return []
    }
    throw error
  }
}

export async function createPMOStatusReport(report: {
  pmo_project_id: string
  report_period_start: string
  report_period_end: string
  report_type?: string
  status_summary: string
  accomplishments?: string[]
  challenges?: string[]
  next_steps?: string[]
  overall_health: string
  reported_by?: string
  reported_by_name?: string
}) {
  const reportNumber = `RPT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  
  const { data, error } = await supabase
    .from("pmo_status_reports")
    .insert({
      report_number: reportNumber,
      pmo_project_id: report.pmo_project_id,
      report_period_start: report.report_period_start,
      report_period_end: report.report_period_end,
      report_type: report.report_type || "weekly",
      status_summary: report.status_summary,
      accomplishments: report.accomplishments || [],
      challenges: report.challenges || [],
      next_steps: report.next_steps || [],
      overall_health: report.overall_health,
      reported_by: report.reported_by,
      reported_by_name: report.reported_by_name,
      report_date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// LEGAL & COMPLIANCE INTERFACES
// ============================================

export interface Contract {
  id: string
  contract_number: string
  contract_name: string
  contract_type: string
  party_name: string
  party_type?: string
  status: string
  start_date: string
  end_date?: string
  renewal_date?: string
  auto_renew: boolean
  value?: number
  currency?: string
  department?: string
  owner_id?: string
  owner_name?: string
  description?: string
  key_terms?: string[]
  document_url?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface RegulatoryDeadline {
  id: string
  deadline_number: string
  title: string
  description?: string
  regulatory_body: string
  regulation_type: string
  deadline_date: string
  reminder_date?: string
  status: string
  department?: string
  assigned_to?: string
  assigned_to_name?: string
  related_project_id?: string
  related_contract_id?: string
  filing_reference?: string
  submission_date?: string
  approval_date?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface CertificationLicense {
  id: string
  cert_number: string
  name: string
  cert_type: string
  issuing_body: string
  issue_date: string
  expiry_date: string
  renewal_date?: string
  status: string
  department?: string
  holder_id?: string
  holder_name?: string
  holder_type?: string
  document_url?: string
  requirements?: string[]
  notes?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface LegalDocument {
  id: string
  document_number: string
  title: string
  document_type: string
  category?: string
  version: string
  status: string
  effective_date?: string
  expiry_date?: string
  review_date?: string
  department?: string
  owner_id?: string
  owner_name?: string
  document_url: string
  summary?: string
  related_contract_id?: string
  related_deadline_id?: string
  approval_status?: string
  approved_by?: string
  approved_at?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by?: string
}

// ============================================
// CONTRACTS CRUD FUNCTIONS
// ============================================

export async function getContracts(filters?: {
  status?: string
  contract_type?: string
  department?: string
  owner_id?: string
}) {
  try {
    let query = supabase.from("contracts").select("*")
    
    if (filters?.status) query = query.eq("status", filters.status)
    if (filters?.contract_type) query = query.eq("contract_type", filters.contract_type)
    if (filters?.department) query = query.eq("department", filters.department)
    if (filters?.owner_id) query = query.eq("owner_id", filters.owner_id)
    
    const { data, error } = await query.order("created_at", { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error: any) {
    console.error("Error fetching contracts:", error)
    return []
  }
}

export async function getContract(contractId: string) {
  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", contractId)
    .single()

  if (error) throw error
  return data
}

export async function createContract(contract: Omit<Contract, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("contracts")
    .insert({
      contract_number: contract.contract_number,
      contract_name: contract.contract_name,
      contract_type: contract.contract_type,
      party_name: contract.party_name,
      party_type: contract.party_type,
      status: contract.status,
      start_date: contract.start_date,
      end_date: contract.end_date,
      renewal_date: contract.renewal_date,
      auto_renew: contract.auto_renew,
      value: contract.value,
      currency: contract.currency,
      department: contract.department,
      owner_id: contract.owner_id,
      owner_name: contract.owner_name,
      description: contract.description,
      key_terms: contract.key_terms,
      document_url: contract.document_url,
      notes: contract.notes,
      created_by: contract.created_by,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateContract(contractId: string, updates: Partial<Contract>) {
  const { data, error } = await supabase
    .from("contracts")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteContract(contractId: string) {
  const { error } = await supabase
    .from("contracts")
    .delete()
    .eq("id", contractId)

  if (error) throw error
}

// ============================================
// REGULATORY DEADLINES CRUD FUNCTIONS
// ============================================

export async function getRegulatoryDeadlines(filters?: {
  status?: string
  regulation_type?: string
  department?: string
  assigned_to?: string
  deadline_date_from?: string
  deadline_date_to?: string
}) {
  try {
    let query = supabase.from("regulatory_deadlines").select("*")
    
    if (filters?.status) query = query.eq("status", filters.status)
    if (filters?.regulation_type) query = query.eq("regulation_type", filters.regulation_type)
    if (filters?.department) query = query.eq("department", filters.department)
    if (filters?.assigned_to) query = query.eq("assigned_to", filters.assigned_to)
    if (filters?.deadline_date_from) query = query.gte("deadline_date", filters.deadline_date_from)
    if (filters?.deadline_date_to) query = query.lte("deadline_date", filters.deadline_date_to)
    
    const { data, error } = await query.order("deadline_date", { ascending: true })
    
    if (error) throw error
    return data || []
  } catch (error: any) {
    console.error("Error fetching regulatory deadlines:", error)
    return []
  }
}

export async function getRegulatoryDeadline(deadlineId: string) {
  const { data, error } = await supabase
    .from("regulatory_deadlines")
    .select("*")
    .eq("id", deadlineId)
    .single()

  if (error) throw error
  return data
}

export async function createRegulatoryDeadline(deadline: Omit<RegulatoryDeadline, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("regulatory_deadlines")
    .insert({
      deadline_number: deadline.deadline_number,
      title: deadline.title,
      description: deadline.description,
      regulatory_body: deadline.regulatory_body,
      regulation_type: deadline.regulation_type,
      deadline_date: deadline.deadline_date,
      reminder_date: deadline.reminder_date,
      status: deadline.status,
      department: deadline.department,
      assigned_to: deadline.assigned_to,
      assigned_to_name: deadline.assigned_to_name,
      related_project_id: deadline.related_project_id,
      related_contract_id: deadline.related_contract_id,
      filing_reference: deadline.filing_reference,
      submission_date: deadline.submission_date,
      approval_date: deadline.approval_date,
      notes: deadline.notes,
      created_by: deadline.created_by,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateRegulatoryDeadline(deadlineId: string, updates: Partial<RegulatoryDeadline>) {
  const { data, error } = await supabase
    .from("regulatory_deadlines")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deadlineId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteRegulatoryDeadline(deadlineId: string) {
  const { error } = await supabase
    .from("regulatory_deadlines")
    .delete()
    .eq("id", deadlineId)

  if (error) throw error
}

// ============================================
// CERTIFICATIONS & LICENSES CRUD FUNCTIONS
// ============================================

export async function getCertifications(filters?: {
  status?: string
  cert_type?: string
  department?: string
  holder_id?: string
  expiry_date_from?: string
  expiry_date_to?: string
}) {
  try {
    let query = supabase.from("certifications_licenses").select("*")
    
    if (filters?.status) query = query.eq("status", filters.status)
    if (filters?.cert_type) query = query.eq("cert_type", filters.cert_type)
    if (filters?.department) query = query.eq("department", filters.department)
    if (filters?.holder_id) query = query.eq("holder_id", filters.holder_id)
    if (filters?.expiry_date_from) query = query.gte("expiry_date", filters.expiry_date_from)
    if (filters?.expiry_date_to) query = query.lte("expiry_date", filters.expiry_date_to)
    
    const { data, error } = await query.order("expiry_date", { ascending: true })
    
    if (error) throw error
    return data || []
  } catch (error: any) {
    console.error("Error fetching certifications:", error)
    return []
  }
}

export async function getCertification(certId: string) {
  const { data, error } = await supabase
    .from("certifications_licenses")
    .select("*")
    .eq("id", certId)
    .single()

  if (error) throw error
  return data
}

export async function createCertification(cert: Omit<CertificationLicense, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("certifications_licenses")
    .insert({
      cert_number: cert.cert_number,
      name: cert.name,
      cert_type: cert.cert_type,
      issuing_body: cert.issuing_body,
      issue_date: cert.issue_date,
      expiry_date: cert.expiry_date,
      renewal_date: cert.renewal_date,
      status: cert.status,
      department: cert.department,
      holder_id: cert.holder_id,
      holder_name: cert.holder_name,
      holder_type: cert.holder_type,
      document_url: cert.document_url,
      requirements: cert.requirements,
      notes: cert.notes,
      created_by: cert.created_by,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCertification(certId: string, updates: Partial<CertificationLicense>) {
  const { data, error } = await supabase
    .from("certifications_licenses")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", certId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCertification(certId: string) {
  const { error } = await supabase
    .from("certifications_licenses")
    .delete()
    .eq("id", certId)

  if (error) throw error
}

// ============================================
// LEGAL DOCUMENTS CRUD FUNCTIONS
// ============================================

export async function getLegalDocuments(filters?: {
  status?: string
  document_type?: string
  category?: string
  department?: string
  owner_id?: string
}) {
  try {
    let query = supabase.from("legal_documents").select("*")
    
    if (filters?.status) query = query.eq("status", filters.status)
    if (filters?.document_type) query = query.eq("document_type", filters.document_type)
    if (filters?.category) query = query.eq("category", filters.category)
    if (filters?.department) query = query.eq("department", filters.department)
    if (filters?.owner_id) query = query.eq("owner_id", filters.owner_id)
    
    const { data, error } = await query.order("created_at", { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error: any) {
    console.error("Error fetching legal documents:", error)
    return []
  }
}

export async function getLegalDocument(docId: string) {
  const { data, error } = await supabase
    .from("legal_documents")
    .select("*")
    .eq("id", docId)
    .single()

  if (error) throw error
  return data
}

export async function createLegalDocument(doc: Omit<LegalDocument, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("legal_documents")
    .insert({
      document_number: doc.document_number,
      title: doc.title,
      document_type: doc.document_type,
      category: doc.category,
      version: doc.version,
      status: doc.status,
      effective_date: doc.effective_date,
      expiry_date: doc.expiry_date,
      review_date: doc.review_date,
      department: doc.department,
      owner_id: doc.owner_id,
      owner_name: doc.owner_name,
      document_url: doc.document_url,
      summary: doc.summary,
      related_contract_id: doc.related_contract_id,
      related_deadline_id: doc.related_deadline_id,
      approval_status: doc.approval_status,
      approved_by: doc.approved_by,
      approved_at: doc.approved_at,
      notes: doc.notes,
      created_by: doc.created_by,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateLegalDocument(docId: string, updates: Partial<LegalDocument>) {
  const { data, error } = await supabase
    .from("legal_documents")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", docId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteLegalDocument(docId: string) {
  const { error } = await supabase
    .from("legal_documents")
    .delete()
    .eq("id", docId)

  if (error) throw error
}

// General database function - no longer needed but kept for compatibility
export async function getDatabase() {
  return {} // Return empty object for compatibility
}
