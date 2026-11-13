export type UserRole = 'employee' | 'agent' | 'manager' | 'admin';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';
export type ImpactLevel = 'high' | 'medium' | 'low';
export type UrgencyLevel = 'high' | 'medium' | 'low';
export type IncidentCategory = 'Network' | 'Hardware' | 'Software' | 'Access' | 'General';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_available: boolean;
  department_name?: string;
}

export interface Incident {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: IncidentCategory;
  subcategory?: string;
  impact: ImpactLevel;
  urgency: UrgencyLevel;
  priority: PriorityLevel;
  status: TicketStatus;
  reporter_id: string;
  assigned_team_id?: string;
  assigned_agent_id?: string;
  assigned_agent_name?: string;
  location?: string;
  resolution_notes?: string;
  resolved_at?: string;
  resolved_by_id?: string;
  closed_at?: string;
  confirmed_by_id?: string;
  reopen_reason?: string;
  reopened_at?: string;
  response_deadline?: string;
  resolution_deadline?: string;
  sla_response_breached?: boolean;
  sla_resolution_breached?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  status: 'investigating' | 'identified' | 'workaround_found' | 'resolved' | 'closed';
  root_cause?: string;
  workaround?: string;
  permanent_solution?: string;
  linked_incidents_count?: number;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'assignment' | 'status_update' | 'sla_warning' | 'sla_breach' | 'major_alert' | 'info';
  is_read: boolean;
  related_incident_id?: string;
  created_at: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: IncidentCategory;
  author_id: string;
  is_published: boolean;
  created_at: string;
}

// Module 1: Service Requests & Approval Management
export interface ServiceCatalogField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date';
  options?: string[];
  required: boolean;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  estimated_delivery_hours: number;
  requires_approval: boolean;
  required_fields: ServiceCatalogField[];
  is_active: boolean;
}

export interface ServiceApproval {
  id: string;
  approver_id: string;
  approver_name?: string;
  decision: 'pending' | 'approved' | 'rejected' | 'info_requested';
  comments?: string;
  decision_at?: string;
}

export interface ServiceRequest {
  id: string;
  request_number: string;
  requester_id: string;
  requester_name?: string;
  requester_email?: string;
  catalog_item_id?: string;
  catalog_name?: string;
  title: string;
  category: string;
  business_justification: string;
  required_date?: string;
  additional_notes?: string;
  form_data: Record<string, any>;
  status: 'pending_approval' | 'approved' | 'rejected' | 'in_progress' | 'fulfilled' | 'cancelled';
  assigned_agent_id?: string;
  assigned_agent_name?: string;
  rejection_reason?: string;
  fulfillment_notes?: string;
  fulfilled_at?: string;
  approvals: ServiceApproval[];
  created_at: string;
  updated_at: string;
}

// Module 2: IT Change Management
export type ChangeType = 'standard' | 'normal' | 'emergency';
export type ChangeRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ChangeStatus = 'draft' | 'pending_cab' | 'approved' | 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'rolled_back' | 'rejected';

export interface ChangeApproval {
  id: string;
  approver_id: string;
  approver_name?: string;
  role_type: string;
  decision: 'pending' | 'approved' | 'rejected';
  comments?: string;
  decision_at?: string;
}

export interface ChangeRequest {
  id: string;
  change_number: string;
  title: string;
  description: string;
  change_type: ChangeType;
  category: string;
  reason: string;
  affected_service: string;
  affected_departments?: string;
  business_impact: string;
  risk_level: ChangeRiskLevel;
  risk_score: number;
  status: ChangeStatus;
  requester_id: string;
  requester_name?: string;
  assigned_owner_id?: string;
  owner_name?: string;
  proposed_start: string;
  proposed_end: string;
  implementation_plan: string;
  testing_plan: string;
  rollback_plan: string;
  expected_downtime_minutes: number;
  actual_start?: string;
  actual_end?: string;
  execution_notes?: string;
  testing_results?: string;
  rollback_status?: string;
  review_notes?: string;
  rejection_reason?: string;
  approvals?: ChangeApproval[];
  created_at: string;
  updated_at: string;
}

// Module 3: Generative AI Assistant
export interface AIMessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AIConversationItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

