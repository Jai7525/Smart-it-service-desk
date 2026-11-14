import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  FolderGit2,
  GitBranch,
  TrendingUp,
  Clock,
  CheckCircle,
  Plus,
  Play,
  Check,
  AlertTriangle,
  ArrowRight,
  Filter,
  Layers,
  FileText,
  UserCheck,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { Problem, IncidentCategory } from '../types';
import { api } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const ManagerDashboard: React.FC = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<
    'overview' | 'unassigned' | 'correlation' | 'problems' | 'automation'
  >('overview');

  // Overview API metrics & workload stats
  const [overviewData, setOverviewData] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [reassigningId, setReassigningId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [ov, incList, usersList, teamsList] = await Promise.allSettled([
        api.analytics.getOverview(),
        api.incidents.list(),
        api.admin.listUsers(),
        api.admin.listTeams(),
      ]);

      if (ov.status === 'fulfilled') setOverviewData(ov.value);
      if (incList.status === 'fulfilled' && Array.isArray(incList.value)) setIncidents(incList.value);
      if (usersList.status === 'fulfilled' && Array.isArray(usersList.value)) {
        setAgents(usersList.value.filter((u) => u.role === 'agent'));
      }
      if (teamsList.status === 'fulfilled' && Array.isArray(teamsList.value)) setTeams(teamsList.value);
    } catch (err) {
      console.warn('Dashboard data fetch warning:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleManualAssign = async (ticketId: string, agentId: string) => {
    try {
      await api.incidents.assign(ticketId, {
        agent_id: agentId,
        reason: 'Manager authorized manual assignment from Unassigned Queue',
      });
      await fetchDashboardData();
      setReassigningId(null);
    } catch (e: any) {
      alert(`Assignment failed: ${e.message}`);
    }
  };

  useEffect(() => {
    if (location.pathname === '/correlation') {
      setActiveSection('correlation');
    } else if (location.pathname === '/problems') {
      setActiveSection('problems');
    } else if (location.pathname === '/automation') {
      setActiveSection('automation');
    } else if (location.pathname === '/unassigned') {
      setActiveSection('unassigned');
    } else if (location.pathname === '/') {
      setActiveSection('overview');
    }
  }, [location.pathname]);

  // Problems state
  const [problems, setProblems] = useState<Problem[]>([]);
  const [showNewProblemModal, setShowNewProblemModal] = useState(false);
  const [probTitle, setProbTitle] = useState('');
  const [probDesc, setProbDesc] = useState('');
  const [probCat, setProbCat] = useState<IncidentCategory>('Network');
  const [probRca, setProbRca] = useState('');
  const [probWorkaround, setProbWorkaround] = useState('');
  const [probSolution, setProbSolution] = useState('');

  const fetchProblems = async () => {
    try {
      const data = await api.problems.list();
      if (Array.isArray(data)) {
        setProblems(data);
      }
    } catch (e) {
      console.warn('Could not fetch problems:', e);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  // Automation Rules state (PRD 5.6 & SRS FR-13)
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleTrigger, setNewRuleTrigger] = useState('ticket_created');
  const [newRuleCondition, setNewRuleCondition] = useState('Priority == Critical');
  const [newRuleAction, setNewRuleAction] = useState('Notify all IT Managers & Escalate');
  const [automationRules, setAutomationRules] = useState([
    {
      id: 'rule-1',
      name: 'Auto-Alert on Critical Incidents',
      trigger: 'ticket_created',
      condition: 'Priority == Critical',
      action: 'Notify all IT Managers & Escalate',
      isActive: true,
      lastExecuted: '12m ago',
      result: 'success',
    },
    {
      id: 'rule-2',
      name: 'SLA Breach Manager Escalation',
      trigger: 'sla_breached',
      condition: 'Response or Resolution Overdue',
      action: 'Flag ticket & Email Team Lead',
      isActive: true,
      lastExecuted: '48m ago',
      result: 'success',
    },
    {
      id: 'rule-3',
      name: 'Network Major Incident Detection',
      trigger: 'similar_incidents_detected',
      condition: 'Threshold >= 5 in 10m window',
      action: 'Generate Potential Major Incident Alert',
      isActive: true,
      lastExecuted: '1h ago',
      result: 'success',
    },
    {
      id: 'rule-4',
      name: 'Auto-Close on Employee Confirmation',
      trigger: 'ticket_confirmed',
      condition: 'Employee accepts resolution note',
      action: 'Transition status: Resolved -> Closed',
      isActive: true,
      lastExecuted: '3h ago',
      result: 'success',
    },
  ]);

  // Chart data
  const categoryData = [
    { name: 'Network', count: 18, fill: '#2563EB' },
    { name: 'Hardware', count: 12, fill: '#0EA5E9' },
    { name: 'Software', count: 9, fill: '#64748B' },
    { name: 'Access', count: 15, fill: '#F59E0B' },
    { name: 'General', count: 4, fill: '#94A3B8' },
  ];

  const priorityData = [
    { name: 'Critical', value: 3, color: '#E11D48' },
    { name: 'High', value: 8, color: '#F59E0B' },
    { name: 'Medium', value: 24, color: '#3B82F6' },
    { name: 'Low', value: 12, color: '#64748B' },
  ];

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!probTitle.trim()) return;

    try {
      await api.problems.create({
        title: probTitle,
        description: probDesc,
        category: probCat,
        root_cause: probRca,
        workaround: probWorkaround,
        permanent_solution: probSolution,
      });
      await fetchProblems();
    } catch (err) {
      console.warn('Backend problem creation error, applying locally:', err);
      const newProb: Problem = {
        id: `prob-${problems.length + 1}`,
        title: probTitle,
        description: probDesc,
        category: probCat,
        status: 'investigating',
        root_cause: probRca || 'Under investigation',
        workaround: probWorkaround || 'Under investigation',
        permanent_solution: probSolution || 'Pending vendor patch/hardware swap',
        linked_incidents_count: 3,
        created_at: new Date().toISOString(),
      };
      setProblems([newProb, ...problems]);
    }

    setShowNewProblemModal(false);
    setProbTitle('');
    setProbDesc('');
    setProbRca('');
    setProbWorkaround('');
    setProbSolution('');
  };

  const toggleRule = (ruleId: string) => {
    setAutomationRules(
      automationRules.map((r) =>
        r.id === ruleId ? { ...r, isActive: !r.isActive } : r
      )
    );
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    try {
      await api.automation.createRule({
        name: newRuleName,
        trigger: newRuleTrigger,
        conditions: { condition: newRuleCondition },
        actions: [{ type: newRuleAction }],
        is_active: true,
      });
    } catch (err) {
      console.warn('Backend automation rule create error, adding locally:', err);
    }

    setAutomationRules([
      ...automationRules,
      {
        id: `rule-${Date.now()}`,
        name: newRuleName,
        trigger: newRuleTrigger,
        condition: newRuleCondition,
        action: newRuleAction,
        isActive: true,
        lastExecuted: 'Just now',
        result: 'success',
      },
    ]);

    setShowAddRuleModal(false);
    setNewRuleName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Section Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            IT Operations & Incident Management
          </h1>
          <p className="text-xs text-slate-500">
            Supervise cross-team SLA compliance, recurring cluster alerts, and problem records.
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs font-semibold">
          <button
            onClick={() => setActiveSection('overview')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeSection === 'overview'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSection('unassigned')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeSection === 'unassigned'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            Unassigned Queue
            {overviewData?.incidents?.unassigned > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                {overviewData.incidents.unassigned}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSection('correlation')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeSection === 'correlation'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            Correlation Alerts
          </button>
          <button
            onClick={() => setActiveSection('problems')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeSection === 'problems'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Problems (RCA)
          </button>
          <button
            onClick={() => setActiveSection('automation')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeSection === 'automation'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Automation Centre
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: EXECUTIVE OVERVIEW */}
      {/* ========================================================================= */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard
              title="Total Incidents (30d)"
              value="58"
              subtitle="4 active today"
              icon={TrendingUp}
            />
            <StatCard
              title="SLA Compliance"
              value="96.4%"
              subtitle="Target: 95.0%"
              badge={{ text: 'Compliant', positive: true }}
              icon={Clock}
            />
            <StatCard
              title="Active Problems"
              value={problems.length}
              subtitle="RCA investigations"
              icon={FolderGit2}
            />
            <StatCard
              title="Avg Resolution Time"
              value="2.4h"
              subtitle="-18m from last week"
              badge={{ text: '-12%', positive: true }}
              icon={CheckCircle}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Incidents by Operational Category
                </h2>
                <span className="text-[11px] text-slate-400">Past 30 Days</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        borderColor: '#334155',
                        borderRadius: 6,
                        color: '#F8FAFC',
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
                Priority Distribution
              </h2>
              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        borderColor: '#334155',
                        borderRadius: 6,
                        color: '#F8FAFC',
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                {priorityData.map((p) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-slate-600 font-medium">{p.name}:</span>
                    <span className="font-bold text-slate-900 font-mono">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Team Workload & Dispatch Distribution (Phase 3) */}
          {overviewData?.team_workloads && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    Support Team Workloads & Dispatch Capacity
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Real-time active ticket counts per category support desk.
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
                  Max Limit: 5 / Agent
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {overviewData.team_workloads.map((tw: any) => (
                  <div key={tw.id} className="p-3 bg-slate-50 rounded border border-slate-200/80 space-y-1">
                    <span className="text-[11px] font-bold text-slate-800 block truncate">{tw.name}</span>
                    <span className="text-[10px] text-slate-400 block uppercase">{tw.category} Desk</span>
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-lg font-bold text-slate-900 font-mono">{tw.active_tickets}</span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {tw.member_count} Agent{tw.member_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION: UNASSIGNED TICKET QUEUE (Phase 3) */}
      {/* ========================================================================= */}
      {activeSection === 'unassigned' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-amber-900 uppercase">
                  Unassigned Incident Triage Queue
                </h3>
                <p className="text-xs text-amber-700">
                  Incidents where all eligible agents were unavailable or at maximum workload capacity.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded">
              {incidents.filter((i) => !i.assigned_agent_id).length} Awaiting Assignment
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-4">Ticket</th>
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Priority</th>
                  <th className="py-2.5 px-4">Created</th>
                  <th className="py-2.5 px-4 text-right">Authorize Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {incidents.filter((t) => !t.assigned_agent_id && t.status !== 'closed').length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      All tickets are currently assigned to active agents.
                    </td>
                  </tr>
                ) : (
                  incidents
                    .filter((t) => !t.assigned_agent_id && t.status !== 'closed')
                    .map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">{t.ticket_number}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{t.subject}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            {t.category}
                          </span>
                        </td>
                        <td className="py-3 px-4"><PriorityBadge priority={t.priority} /></td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <select
                            onChange={(e) => {
                              if (e.target.value) handleManualAssign(t.id, e.target.value);
                            }}
                            defaultValue=""
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="" disabled>Assign Eligible Agent...</option>
                            {agents.map((ag) => (
                              <option key={ag.id} value={ag.id}>
                                {ag.full_name} (Agent)
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))
                )}

              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: INCIDENT CORRELATION & CLUSTER ALERTS (PRD 5.4, SRS FR-10) */}
      {/* ========================================================================= */}
      {activeSection === 'correlation' && (
        <div className="space-y-6">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-md bg-rose-100 text-rose-700">
                  <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-rose-900">
                      Active Major Incident Candidate Cluster #CR-904
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 text-xs font-mono font-bold">
                      Confidence: 94%
                    </span>
                  </div>
                  <p className="text-xs text-rose-700 mt-1">
                    Multiple users in Building A Floor 2 are experiencing rapid VPN termination and SSID drops.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveSection('problems');
                  setShowNewProblemModal(true);
                }}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                Promote to Problem Record
              </button>
            </div>

            {/* Matching Criteria Breakdown */}
            <div className="bg-white/80 rounded border border-rose-200 p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Cluster Category</span>
                <span className="font-semibold text-slate-800">Network</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Keyword Overlap</span>
                <span className="font-semibold text-slate-800">"vpn", "wifi", "floor 2"</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Time Window Filter</span>
                <span className="font-semibold text-slate-800">10 Minutes (PRD §5.4)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Incident Count</span>
                <span className="font-mono font-bold text-rose-600 text-sm">4 Tickets</span>
              </div>
            </div>
          </div>

          {/* Correlated Incidents Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-slate-200 font-semibold text-xs text-slate-900 uppercase tracking-wider">
              Tickets Associated with this Correlation Cluster
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-4">Ticket ID</th>
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4">Priority</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Reported By</th>
                  <th className="py-2.5 px-4 text-right">Detection Window</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {incidents
                  .filter((t) => t.category === 'Network')
                  .slice(0, 5)
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{t.ticket_number}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{t.subject}</td>
                      <td className="py-3 px-4"><PriorityBadge priority={t.priority} /></td>
                      <td className="py-3 px-4"><StatusBadge status={t.status} /></td>
                      <td className="py-3 px-4 text-slate-600">{t.assigned_agent_name || 'Unassigned'}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">T-35m</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: PROBLEM MANAGEMENT & ROOT CAUSE ANALYSIS (SRS FR-12) */}
      {/* ========================================================================= */}
      {activeSection === 'problems' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Problem Management Records (Root Cause Investigation)
              </h2>
              <p className="text-xs text-slate-500">
                Link recurring incidents to investigate root cause, document temporary workarounds, and deploy permanent fixes.
              </p>
            </div>
            <button
              onClick={() => setShowNewProblemModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Problem Record
            </button>
          </div>

          <div className="space-y-4">
            {problems.map((prob) => (
              <div
                key={prob.id}
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-blue-600">
                      {prob.id.toUpperCase()}
                    </span>
                    <span className="font-bold text-sm text-slate-900">{prob.title}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold capitalize">
                      {prob.status}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-mono font-medium">
                    {prob.linked_incidents_count} Linked Incidents
                  </span>
                </div>

                <p className="text-xs text-slate-600">{prob.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                  <div className="bg-slate-50 p-3 rounded border border-slate-200/80">
                    <span className="font-semibold text-slate-900 block mb-1">
                      Identified Root Cause:
                    </span>
                    <p className="text-slate-600">{prob.root_cause}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded border border-slate-200/80">
                    <span className="font-semibold text-slate-900 block mb-1">
                      Permanent Solution:
                    </span>
                    <p className="text-slate-600">{prob.permanent_solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: AUTOMATION CENTRE (TCA WORKFLOW RULES - PRD 5.6 & SRS FR-13) */}
      {/* ========================================================================= */}
      {activeSection === 'automation' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Workflow Automation Centre
              </h2>
              <p className="text-xs text-slate-500">
                Trigger–Condition–Action (TCA) engine executing autonomous escalations, dispatches, and manager alerts.
              </p>
            </div>
            <button
              onClick={() => setShowAddRuleModal(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-xs transition-colors"
            >
              + Add Rule
            </button>
          </div>

          {/* Rules Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Rule Name</th>
                  <th className="py-3 px-4">Trigger Event</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Automated Action</th>
                  <th className="py-3 px-4">Last Run</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {automationRules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-900">{r.name}</td>
                    <td className="py-3 px-4 font-mono text-blue-600">{r.trigger}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{r.condition}</td>
                    <td className="py-3 px-4 text-slate-800">{r.action}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{r.lastExecuted}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => toggleRule(r.id)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                          r.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {r.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showNewProblemModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateProblem}
            className="bg-white rounded-lg border border-slate-200 p-6 max-w-lg w-full space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">
                Create Problem Management Record
              </h3>
              <button
                type="button"
                onClick={() => setShowNewProblemModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                Problem Title
              </label>
              <input
                type="text"
                required
                value={probTitle}
                onChange={(e) => setProbTitle(e.target.value)}
                placeholder="e.g., Core Gateway Switch Port Flapping"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                Problem Description
              </label>
              <textarea
                rows={2}
                required
                value={probDesc}
                onChange={(e) => setProbDesc(e.target.value)}
                placeholder="Describe recurring symptoms observed across tickets..."
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-800">Category</label>
                <select
                  value={probCat}
                  onChange={(e) => setProbCat(e.target.value as IncidentCategory)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
                >
                  <option value="Network">Network</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Software">Software</option>
                  <option value="Access">Access</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-800">Temporary Workaround</label>
                <input
                  type="text"
                  value={probWorkaround}
                  onChange={(e) => setProbWorkaround(e.target.value)}
                  placeholder="e.g., Failover to secondary AP"
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                Identified Root Cause (RCA)
              </label>
              <input
                type="text"
                value={probRca}
                onChange={(e) => setProbRca(e.target.value)}
                placeholder="e.g., Power supply thermal throttling under PoE load"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                Permanent Fix
              </label>
              <input
                type="text"
                value={probSolution}
                onChange={(e) => setProbSolution(e.target.value)}
                placeholder="e.g., Firmware v3.2 deployment & module replacement"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewProblemModal(false)}
                className="px-3.5 py-1.5 text-xs rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs"
              >
                Save Problem Record
              </button>
            </div>
          </form>
        </div>
      )}

      {showAddRuleModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddRule}
            className="bg-white rounded-lg border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">
                Create Automation Rule (TCA)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRuleModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                Rule Name
              </label>
              <input
                type="text"
                required
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                placeholder="e.g., Critical Network Escalation"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                Trigger Event
              </label>
              <select
                value={newRuleTrigger}
                onChange={(e) => setNewRuleTrigger(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900"
              >
                <option value="ticket_created">ticket_created (On New Ticket)</option>
                <option value="sla_warning">sla_warning (75% Deadline Reached)</option>
                <option value="sla_breached">sla_breached (Target Exceeded)</option>
                <option value="similar_incidents_detected">similar_incidents_detected (Cluster Threshold Met)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                Condition
              </label>
              <input
                type="text"
                required
                value={newRuleCondition}
                onChange={(e) => setNewRuleCondition(e.target.value)}
                placeholder="e.g., Priority == Critical or Category == Network"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                Automated Action
              </label>
              <input
                type="text"
                required
                value={newRuleAction}
                onChange={(e) => setNewRuleAction(e.target.value)}
                placeholder="e.g., Notify Managers & Dispatch Tier 2"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddRuleModal(false)}
                className="px-3.5 py-1.5 text-xs rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs"
              >
                Create Automation Rule
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
