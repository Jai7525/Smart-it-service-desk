import { Incident, Problem, NotificationItem, KnowledgeArticle } from '../types';

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

/**
 * Enterprise API client wrapper with standardized error handling and Supabase JWT injection.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('supabase_auth_token');
  const savedUser = localStorage.getItem('smartticket_current_user');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      if (parsed?.email) {
        headers['Authorization'] = `Bearer dev-user:${parsed.email}`;
      }
    } catch (e) {
      // ignore
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // ==========================================
  // Auth & Profile (SRS 7.1)
  // ==========================================
  auth: {
    getMe: () => apiFetch<any>('/auth/me'),
  },

  // ==========================================
  // Incidents (SRS 7.2)
  // ==========================================
  incidents: {
    list: () => apiFetch<Incident[]>('/incidents/'),
    get: (id: string) => apiFetch<Incident>(`/incidents/${id}`),
    create: (data: {
      subject: string;
      description: string;
      impact: string;
      urgency: string;
      location?: string;
    }) =>
      apiFetch<Incident>('/incidents/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: string, resolution_notes?: string, reason?: string) =>
      apiFetch<Incident>(`/incidents/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, resolution_notes, reason }),
      }),
    confirmResolution: (id: string) =>
      apiFetch<Incident>(`/incidents/${id}/confirm-resolution`, {
        method: 'POST',
      }),
    rejectResolution: (id: string, reason: string) =>
      apiFetch<Incident>(`/incidents/${id}/reject-resolution`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    getActivityLogs: (id: string) =>
      apiFetch<any[]>(`/incidents/${id}/activity-logs`),
    getComments: (id: string) => apiFetch<any[]>(`/incidents/${id}/comments`),
    addComment: (id: string, comment: string, is_internal = false) =>
      apiFetch<any>(`/incidents/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment, is_internal }),
      }),
    assign: (id: string, data: { team_id?: string; agent_id?: string; reason?: string }) =>
      apiFetch<Incident>(`/incidents/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ==========================================
  // Problems (SRS 7.5)
  // ==========================================
  problems: {
    list: () => apiFetch<Problem[]>('/problems/'),
    create: (data: {
      title: string;
      description: string;
      category: string;
      root_cause?: string;
      workaround?: string;
      permanent_solution?: string;
    }) =>
      apiFetch<Problem>('/problems/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    linkIncident: (problemId: string, incidentId: string) =>
      apiFetch<any>(`/problems/${problemId}/incidents/${incidentId}`, {
        method: 'POST',
      }),
  },

  // ==========================================
  // Workflow Automation (SRS 7.6)
  // ==========================================
  automation: {
    listRules: () => apiFetch<any[]>('/automation/rules'),
    createRule: (rule: any) =>
      apiFetch<any>('/automation/rules', {
        method: 'POST',
        body: JSON.stringify(rule),
      }),
    listLogs: () => apiFetch<any[]>('/automation/logs'),
  },

  // ==========================================
  // Analytics & Dashboard (SRS FR-15)
  // ==========================================
  analytics: {
    getOverview: () => apiFetch<any>('/analytics/overview'),
  },

  // ==========================================
  // Notifications (SRS FR-16)
  // ==========================================
  notifications: {
    list: (unreadOnly = false) =>
      apiFetch<NotificationItem[]>(`/notifications/?unread_only=${unreadOnly}`),
    markAsRead: (id: string) =>
      apiFetch<any>(`/notifications/${id}/read`, {
        method: 'PATCH',
      }),
    markAllAsRead: () =>
      apiFetch<any>('/notifications/mark-all-read', {
        method: 'PATCH',
      }),
  },

  // ==========================================
  // Knowledge Base (SRS FR-17)
  // ==========================================
  knowledgeBase: {
    search: (query?: string, category?: string) => {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (category && category !== 'all') params.append('category', category);
      return apiFetch<KnowledgeArticle[]>(`/knowledge-base/?${params.toString()}`);
    },
    create: (data: { title: string; content: string; category: string }) =>
      apiFetch<KnowledgeArticle>('/knowledge-base/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ==========================================
  // Admin & Governance (SRS FR-02 & Section 6)
  // ==========================================
  admin: {
    listUsers: () => apiFetch<any[]>('/admin/users'),
    createUser: (data: { full_name: string; email: string; role: string; department_name?: string }) =>
      apiFetch<any>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    toggleUserActive: (userId: string) =>
      apiFetch<any>(`/admin/users/${userId}/toggle-active`, {
        method: 'PATCH',
      }),
    listTeams: () => apiFetch<any[]>('/admin/teams'),
    createTeam: (data: { name: string; category: string; description?: string }) =>
      apiFetch<any>('/admin/teams', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    listSlaPolicies: () => apiFetch<any[]>('/admin/sla-policies'),
    updateSlaPolicy: (data: { priority: string; response_time_hours: number; resolution_time_hours: number }) =>
      apiFetch<any>('/admin/sla-policies', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // ==========================================
  // Module 1: Service Requests & Catalog
  // ==========================================
  serviceCatalog: {
    list: (category?: string) => {
      const params = new URLSearchParams();
      if (category && category !== 'all') params.append('category', category);
      return apiFetch<any[]>(`/service-catalog/?${params.toString()}`);
    },
    get: (id: string) => apiFetch<any>(`/service-catalog/${id}`),
  },

  serviceRequests: {
    list: (status?: string) => {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      return apiFetch<any[]>(`/service-requests/?${params.toString()}`);
    },
    get: (id: string) => apiFetch<any>(`/service-requests/${id}`),
    create: (data: {
      catalog_item_id?: string;
      title: string;
      category: string;
      business_justification: string;
      required_date?: string;
      additional_notes?: string;
      form_data?: Record<string, any>;
    }) =>
      apiFetch<any>('/service-requests/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    approve: (id: string, comments?: string) =>
      apiFetch<any>(`/service-requests/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ decision: 'approved', comments }),
      }),
    reject: (id: string, reason: string) =>
      apiFetch<any>(`/service-requests/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ decision: 'rejected', comments: reason }),
      }),
    updateStatus: (id: string, data: { status: string; fulfillment_notes?: string; assigned_agent_id?: string }) =>
      apiFetch<any>(`/service-requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // ==========================================
  // Module 2: IT Change Management
  // ==========================================
  changes: {
    list: (status?: string, changeType?: string) => {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      if (changeType && changeType !== 'all') params.append('change_type', changeType);
      return apiFetch<any[]>(`/changes/?${params.toString()}`);
    },
    get: (id: string) => apiFetch<any>(`/changes/${id}`),
    getCalendar: () => apiFetch<any[]>('/changes/calendar'),
    create: (data: any) =>
      apiFetch<any>('/changes/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    approve: (id: string, comments?: string) =>
      apiFetch<any>(`/changes/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ decision: 'approved', comments }),
      }),
    reject: (id: string, reason: string) =>
      apiFetch<any>(`/changes/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ decision: 'rejected', comments: reason }),
      }),
    updateStatus: (id: string, data: any) =>
      apiFetch<any>(`/changes/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // ==========================================
  // Module 3: Generative AI Assistant
  // ==========================================
  ai: {
    chat: (message: string, conversation_id?: string) =>
      apiFetch<{ conversation_id: string; message: any }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, conversation_id }),
      }),
    listConversations: () => apiFetch<any[]>('/ai/conversations'),
    getMessages: (conversationId: string) =>
      apiFetch<any[]>(`/ai/conversations/${conversationId}/messages`),
    getTicketSummary: (incidentId: string) =>
      apiFetch<{ incident_id: string; ticket_number: string; summary: string }>('/ai/ticket-summary', {
        method: 'POST',
        body: JSON.stringify({ incident_id: incidentId }),
      }),
    getTroubleshooting: (query: string, category?: string) =>
      apiFetch<{ query: string; steps: string }>('/ai/troubleshooting', {
        method: 'POST',
        body: JSON.stringify({ query, category }),
      }),
  },
};

