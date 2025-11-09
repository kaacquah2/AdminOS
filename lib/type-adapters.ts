// Type adapters to convert between camelCase (frontend) and snake_case (database)
// This helps maintain compatibility with existing components

import type {
  WorkflowTask as DBWorkflowTask,
  Message as DBMessage,
  Announcement as DBAnnouncement,
  ApprovalRequest as DBApprovalRequest,
  ApprovalWorkflow as DBApprovalWorkflow,
  AuditLog as DBAuditLog,
  AuditFinding as DBAuditFinding,
  AuditReport as DBAuditReport,
  RiskAssessment as DBRiskAssessment,
} from './database'

// Frontend-friendly interfaces (camelCase)
export interface WorkflowTask {
  id: string
  title: string
  description: string
  assignedTo: string
  assignedBy: string
  department: string
  status: "pending" | "in_progress" | "completed" | "approved" | "rejected"
  priority: "low" | "medium" | "high" | "critical"
  dueDate: string
  createdAt: string
  completedAt?: string
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
  senderId: string
  senderName: string
  recipientId?: string
  recipientName?: string
  departmentId?: string
  subject: string
  body: string
  type: "direct" | "department" | "broadcast"
  status: "unread" | "read"
  timestamp: string
  attachments: string[]
}

export interface Announcement {
  id: string
  createdBy: string
  title: string
  content: string
  priority: "low" | "medium" | "high"
  visibility: "all" | "department" | "role"
  targetDepartment?: string
  targetRole?: string
  createdAt: string
  expiresAt?: string
}

export interface ApprovalRequest {
  id: string
  requestType: "expense" | "leave" | "asset" | "project" | "budget"
  requestedBy: string
  approvedBy?: string
  status: "pending" | "approved" | "rejected"
  amount?: number
  description: string
  details: Record<string, unknown>
  createdAt: string
  approvedAt?: string
}

export interface ApprovalWorkflow {
  id: string
  requestType: "expense" | "leave" | "asset" | "project" | "budget"
  requestedBy: string
  approvalChain: Array<{
    level: number
    role: string
    approverIds: string[]
    status: "pending" | "approved" | "rejected"
    approvedBy?: string
    approvedAt?: string
    comments?: string
  }>
  currentApprovalLevel: number
  overallStatus: "pending" | "approved" | "rejected"
  amount?: number
  description: string
  details: Record<string, unknown>
  createdAt: string
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  department: string
  action: string
  module: string
  timestamp: string
  details: Record<string, unknown>
  severity: "low" | "medium" | "high" | "critical"
}

export interface AuditFinding {
  id: string
  auditId: string
  auditedBy: string
  findingType: "compliance" | "control" | "efficiency" | "security" | "financial"
  severity: "low" | "medium" | "high" | "critical"
  description: string
  recommendation: string
  status: "open" | "in_progress" | "resolved" | "closed"
  dueDate?: string
  resolvedDate?: string
  resolutionNotes?: string
  createdAt: string
}

export interface AuditReport {
  id: string
  title: string
  period: string
  auditedArea: string
  createdBy: string
  approvedBy?: string
  status: "draft" | "submitted" | "approved" | "published"
  findings: string[]
  observations: string
  conclusion: string
  createdAt: string
  publishedAt?: string
}

export interface RiskAssessment {
  id: string
  riskCategory: string
  description: string
  probability: "low" | "medium" | "high"
  impact: "low" | "medium" | "high" | "critical"
  mitigation: string
  owner: string
  ownerName: string
  status: "active" | "mitigated" | "closed"
  createdAt: string
  lastReviewDate?: string
}

// Converters: Database (snake_case) -> Frontend (camelCase)
export function dbToWorkflowTask(db: DBWorkflowTask): WorkflowTask {
  return {
    id: db.id,
    title: db.title,
    description: db.description,
    assignedTo: db.assigned_to,
    assignedBy: db.assigned_by,
    department: db.department,
    status: db.status,
    priority: db.priority,
    dueDate: db.due_date,
    createdAt: db.created_at,
    completedAt: db.completed_at,
    attachments: db.attachments || [],
    comments: db.comments,
  }
}

export function dbToMessage(db: DBMessage): Message {
  return {
    id: db.id,
    senderId: db.sender_id,
    senderName: db.sender_name,
    recipientId: db.recipient_id,
    recipientName: db.recipient_name,
    departmentId: db.department_id,
    subject: db.subject,
    body: db.body,
    type: db.type,
    status: db.status,
    timestamp: db.created_at,
    attachments: db.attachments || [],
  }
}

export function dbToAnnouncement(db: DBAnnouncement): Announcement {
  return {
    id: db.id,
    createdBy: db.created_by,
    title: db.title,
    content: db.content,
    priority: db.priority,
    visibility: db.visibility,
    targetDepartment: db.target_department,
    targetRole: db.target_role,
    createdAt: db.created_at,
    expiresAt: db.expires_at,
  }
}

export function dbToApprovalRequest(db: DBApprovalRequest): ApprovalRequest {
  return {
    id: db.id,
    requestType: db.request_type,
    requestedBy: db.requested_by,
    approvedBy: db.approved_by,
    status: db.status,
    amount: db.amount,
    description: db.description,
    details: db.details || {},
    createdAt: db.created_at,
    approvedAt: db.approved_at,
  }
}

export function dbToApprovalWorkflow(db: DBApprovalWorkflow): ApprovalWorkflow {
  return {
    id: db.id,
    requestType: db.request_type,
    requestedBy: db.requested_by,
    approvalChain: db.approval_chain.map((chain) => ({
      level: chain.level,
      role: chain.role,
      approverIds: chain.approver_ids || [],
      status: chain.status,
      approvedBy: chain.approved_by,
      approvedAt: chain.approved_at,
      comments: chain.comments,
    })),
    currentApprovalLevel: db.current_approval_level,
    overallStatus: db.overall_status,
    amount: db.amount,
    description: db.description,
    details: db.details || {},
    createdAt: db.created_at,
  }
}

export function dbToAuditLog(db: DBAuditLog): AuditLog {
  return {
    id: db.id,
    userId: db.user_id || '',
    userName: db.user_name,
    department: db.department,
    action: db.action,
    module: db.module,
    timestamp: db.created_at,
    details: db.details || {},
    severity: db.severity,
  }
}

export function dbToAuditFinding(db: DBAuditFinding): AuditFinding {
  return {
    id: db.id,
    auditId: db.audit_id,
    auditedBy: db.audited_by,
    findingType: db.finding_type,
    severity: db.severity,
    description: db.description,
    recommendation: db.recommendation,
    status: db.status,
    dueDate: db.due_date,
    resolvedDate: db.resolved_date,
    resolutionNotes: db.resolution_notes,
    createdAt: db.created_at,
  }
}

export function dbToAuditReport(db: DBAuditReport): AuditReport {
  return {
    id: db.id,
    title: db.title,
    period: db.period,
    auditedArea: db.audited_area,
    createdBy: db.created_by,
    approvedBy: db.approved_by,
    status: db.status,
    findings: db.findings || [],
    observations: db.observations,
    conclusion: db.conclusion,
    createdAt: db.created_at,
    publishedAt: db.published_at,
  }
}

export function dbToRiskAssessment(db: DBRiskAssessment): RiskAssessment {
  return {
    id: db.id,
    riskCategory: db.risk_category,
    description: db.description,
    probability: db.probability,
    impact: db.impact,
    mitigation: db.mitigation,
    owner: db.owner_id,
    ownerName: db.owner_name,
    status: db.status,
    createdAt: db.created_at,
    lastReviewDate: db.last_review_date,
  }
}

// Converters: Frontend (camelCase) -> Database (snake_case)
export function workflowTaskToDb(frontend: Omit<WorkflowTask, 'id' | 'createdAt'>): Omit<DBWorkflowTask, 'id' | 'created_at'> {
  return {
    title: frontend.title,
    description: frontend.description,
    assigned_to: frontend.assignedTo,
    assigned_by: frontend.assignedBy,
    department: frontend.department,
    status: frontend.status,
    priority: frontend.priority,
    due_date: frontend.dueDate,
    completed_at: frontend.completedAt,
    attachments: frontend.attachments || [],
    comments: frontend.comments?.map(c => ({
      id: c.id,
      author: c.author,
      text: c.text,
      timestamp: c.timestamp,
    })),
  }
}

export function messageToDb(frontend: Omit<Message, 'id' | 'timestamp'>): Omit<DBMessage, 'id' | 'created_at'> {
  return {
    sender_id: frontend.senderId,
    sender_name: frontend.senderName,
    recipient_id: frontend.recipientId,
    recipient_name: frontend.recipientName,
    department_id: frontend.departmentId,
    subject: frontend.subject,
    body: frontend.body,
    type: frontend.type,
    status: frontend.status,
    attachments: frontend.attachments || [],
  }
}

export function announcementToDb(frontend: Omit<Announcement, 'id' | 'createdAt'>): Omit<DBAnnouncement, 'id' | 'created_at'> {
  return {
    created_by: frontend.createdBy,
    title: frontend.title,
    content: frontend.content,
    priority: frontend.priority,
    visibility: frontend.visibility,
    target_department: frontend.targetDepartment,
    target_role: frontend.targetRole,
    expires_at: frontend.expiresAt,
  }
}

export function approvalRequestToDb(frontend: Omit<ApprovalRequest, 'id' | 'createdAt'>): Omit<DBApprovalRequest, 'id' | 'created_at'> {
  return {
    request_type: frontend.requestType,
    requested_by: frontend.requestedBy,
    approved_by: frontend.approvedBy,
    status: frontend.status,
    amount: frontend.amount,
    description: frontend.description,
    details: frontend.details || {},
    approved_at: frontend.approvedAt,
  }
}

export function approvalWorkflowToDb(frontend: Omit<ApprovalWorkflow, 'id' | 'createdAt' | 'currentApprovalLevel' | 'overallStatus'>): Omit<DBApprovalWorkflow, 'id' | 'created_at' | 'current_approval_level' | 'overall_status'> {
  return {
    request_type: frontend.requestType,
    requested_by: frontend.requestedBy,
    approval_chain: frontend.approvalChain.map(chain => ({
      level: chain.level,
      role: chain.role,
      approver_ids: chain.approverIds,
      status: chain.status,
      approved_by: chain.approvedBy,
      approved_at: chain.approvedAt,
      comments: chain.comments,
    })),
    amount: frontend.amount,
    description: frontend.description,
    details: frontend.details || {},
  }
}

export function auditFindingToDb(frontend: Omit<AuditFinding, 'id' | 'createdAt'>): Omit<DBAuditFinding, 'id' | 'created_at'> {
  return {
    audit_id: frontend.auditId,
    audited_by: frontend.auditedBy,
    finding_type: frontend.findingType,
    severity: frontend.severity,
    description: frontend.description,
    recommendation: frontend.recommendation,
    status: frontend.status,
    due_date: frontend.dueDate,
    resolved_date: frontend.resolvedDate,
    resolution_notes: frontend.resolutionNotes,
  }
}

export function auditReportToDb(frontend: Omit<AuditReport, 'id' | 'createdAt'>): Omit<DBAuditReport, 'id' | 'created_at'> {
  return {
    title: frontend.title,
    period: frontend.period,
    audited_area: frontend.auditedArea,
    created_by: frontend.createdBy,
    approved_by: frontend.approvedBy,
    status: frontend.status,
    findings: frontend.findings || [],
    observations: frontend.observations,
    conclusion: frontend.conclusion,
    published_at: frontend.publishedAt,
  }
}

export function riskAssessmentToDb(frontend: Omit<RiskAssessment, 'id' | 'createdAt'>): Omit<DBRiskAssessment, 'id' | 'created_at'> {
  return {
    risk_category: frontend.riskCategory,
    description: frontend.description,
    probability: frontend.probability,
    impact: frontend.impact,
    mitigation: frontend.mitigation,
    owner_id: frontend.owner,
    owner_name: frontend.ownerName,
    status: frontend.status,
    last_review_date: frontend.lastReviewDate,
  }
}



