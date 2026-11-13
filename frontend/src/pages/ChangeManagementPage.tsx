import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ChangeRequest, ChangeType, ChangeRiskLevel } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  GitPullRequest,
  Calendar,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  TrendingUp,
  FileCheck2,
  X,
  Play,
  RotateCcw,
  CheckSquare,
  User,
  Info
} from 'lucide-react';

export const ChangeManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending_cab' | 'scheduled' | 'in_progress' | 'completed'>('all');

  // Selected Change Modal State
  const [selectedChange, setSelectedChange] = useState<any | null>(null);
  const [activePlanTab, setActivePlanTab] = useState<'implementation' | 'testing' | 'rollback'>('implementation');

  // New Change Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [changeType, setChangeType] = useState<ChangeType>('normal');
  const [category, setCategory] = useState('Infrastructure');
  const [reason, setReason] = useState('');
  const [affectedService, setAffectedService] = useState('');
  const [affectedDepts, setAffectedDepts] = useState('');
  const [proposedStart, setProposedStart] = useState('');
  const [proposedEnd, setProposedEnd] = useState('');
  const [implementationPlan, setImplementationPlan] = useState('');
  const [testingPlan, setTestingPlan] = useState('');
  const [rollbackPlan, setRollbackPlan] = useState('');
  const [downtimeMinutes, setDowntimeMinutes] = useState(0);

  // Risk Scores
  const [impactScore, setImpactScore] = useState(3);
  const [complexityScore, setComplexityScore] = useState(3);
  const [downtimeScore, setDowntimeScore] = useState(2);
  const [securityScore, setSecurityScore] = useState(2);
  const [rollbackScore, setRollbackScore] = useState(2);

  // Actions & Execution States
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionComments, setActionComments] = useState('');
  const [executionNotes, setExecutionNotes] = useState('');
  const [testingResults, setTestingResults] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin';
  const isAgentOrManager = user?.role === 'agent' || user?.role === 'manager' || user?.role === 'admin';

  useEffect(() => {
    fetchChanges();
  }, [activeTab]);

  const fetchChanges = async () => {
    setLoading(true);
    try {
      const statusParam = activeTab === 'all' ? undefined : activeTab;
      const data = await api.changes.list(statusParam);
      setChanges(data);
    } catch (err) {
      console.error('Failed to fetch changes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetailModal = async (chg: ChangeRequest) => {
    try {
      const fullDetail = await api.changes.get(chg.id);
      setSelectedChange(fullDetail);
      setExecutionNotes(fullDetail.execution_notes || '');
      setTestingResults(fullDetail.testing_results || '');
    } catch (err) {
      setSelectedChange(chg);
    }
    setActionComments('');
    setActivePlanTab('implementation');
    setMsg(null);
  };

  const handleCreateChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    try {
      const payload = {
        title,
        description,
        change_type: changeType,
        category,
        reason,
        affected_service: affectedService,
        affected_departments: affectedDepts,
        proposed_start: proposedStart,
        proposed_end: proposedEnd,
        implementation_plan: implementationPlan,
        testing_plan: testingPlan,
        rollback_plan: rollbackPlan,
        expected_downtime_minutes: Number(downtimeMinutes),
        risk_assessment: {
          business_impact_score: impactScore,
          technical_complexity_score: complexityScore,
          expected_downtime_score: downtimeScore,
          security_exposure_score: securityScore,
          rollback_difficulty_score: rollbackScore,
        },
      };

      const res = await api.changes.create(payload);
      setMsg({ type: 'success', text: `Change Record ${res.change_number} registered with ${res.risk_level.toUpperCase()} risk rating.` });
      setShowModal(false);
      resetCreateForm();
      await fetchChanges();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to submit change request.' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setTitle('');
    setDescription('');
    setReason('');
    setAffectedService('');
    setAffectedDepts('');
    setProposedStart('');
    setProposedEnd('');
    setImplementationPlan('');
    setTestingPlan('');
    setRollbackPlan('');
    setDowntimeMinutes(0);
  };

  const handleApproveChange = async () => {
    if (!selectedChange) return;
    setActionLoading(true);
    try {
      await api.changes.approve(selectedChange.id, actionComments || 'Approved by CAB');
      const updated = await api.changes.get(selectedChange.id);
      setSelectedChange(updated);
      setMsg({ type: 'success', text: `Change ${selectedChange.change_number} has been approved by CAB and scheduled!` });
      fetchChanges();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to approve change.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectChange = async () => {
    if (!selectedChange) return;
    if (!actionComments.trim()) {
      setMsg({ type: 'error', text: 'Rejection reason is required.' });
      return;
    }
    setActionLoading(true);
    try {
      await api.changes.reject(selectedChange.id, actionComments.trim());
      const updated = await api.changes.get(selectedChange.id);
      setSelectedChange(updated);
      setMsg({ type: 'success', text: `Change ${selectedChange.change_number} was rejected.` });
      fetchChanges();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to reject change.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedChange) return;
    setActionLoading(true);
    try {
      await api.changes.updateStatus(selectedChange.id, {
        status: newStatus,
        execution_notes: executionNotes.trim() || undefined,
        testing_results: testingResults.trim() || undefined,
      });
      const updated = await api.changes.get(selectedChange.id);
      setSelectedChange(updated);
      setMsg({ type: 'success', text: `Change status transitioned to ${newStatus.toUpperCase()} successfully.` });
      fetchChanges();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update change status.' });
    } finally {
      setActionLoading(false);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300">Critical Risk</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-100 text-orange-800 border border-orange-300">High Risk</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">Medium Risk</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">Low Risk</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_cab':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">Pending CAB</span>;
      case 'approved':
      case 'scheduled':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">Scheduled</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">In Progress</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>;
      case 'rolled_back':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">Rolled Back</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Enterprise IT Change Management (ITIL)
          </h1>
          <p className="text-xs text-slate-500">
            Automated CAB approval governance, multi-dimensional risk matrix, and change implementation tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Raise Change Request (RFC)
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
            msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="font-semibold underline ml-3">
            Dismiss
          </button>
        </div>
      )}

      {/* Changes Table Container */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Change Registry</span>
            <span className="text-[11px] text-slate-500 font-mono">({changes.length} records)</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs font-semibold">
            {(['all', 'pending_cab', 'scheduled', 'in_progress', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded transition-colors capitalize ${
                  activeTab === tab ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">Loading changes...</div>
        ) : changes.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">No change requests found in this view.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-4">Change #</th>
                  <th className="py-2.5 px-4">Title & Service</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Risk Rating</th>
                  <th className="py-2.5 px-4">Proposed Schedule</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Owner</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {changes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{c.change_number}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{c.title}</span>
                      <span className="text-[11px] text-slate-400 block">{c.affected_service}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold bg-slate-100 text-slate-700">
                        {c.change_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">{getRiskBadge(c.risk_level)}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(c.proposed_start).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(c.status)}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{c.owner_name || 'Unassigned'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetailModal(c)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* DETAILED CHANGE INSPECTION & CAB EXECUTION MODAL         */}
      {/* ======================================================== */}
      {selectedChange && (
        <div
          onClick={() => setSelectedChange(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded">
                    {selectedChange.change_number}
                  </span>
                  <span className="text-sm font-bold text-slate-900">{selectedChange.title}</span>
                </div>
                <span className="text-xs text-slate-500 mt-1 block">
                  Service: <strong className="text-slate-700">{selectedChange.affected_service}</strong> • Requested by {selectedChange.requester_name || 'Requester'} • Owner: {selectedChange.owner_name || 'Unassigned'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedChange(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Classification & Schedule Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Change Type</span>
                  <span className="font-bold text-slate-900 uppercase text-xs">{selectedChange.change_type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Risk Rating</span>
                  <div className="mt-0.5">{getRiskBadge(selectedChange.risk_level)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Downtime</span>
                  <span className="font-bold text-slate-900 text-xs">{selectedChange.expected_downtime_minutes || 0} mins</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Current Status</span>
                  <div className="mt-0.5">{getStatusBadge(selectedChange.status)}</div>
                </div>
              </div>

              {/* Schedule Dates */}
              <div className="flex items-center gap-4 text-xs bg-blue-50/40 p-2.5 rounded border border-blue-100 text-slate-700">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900">Execution Window: </span>
                  <span className="font-mono text-[11px]">
                    {new Date(selectedChange.proposed_start).toLocaleString()} ➔ {new Date(selectedChange.proposed_end).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Reason & Description */}
              <div>
                <span className="font-semibold text-slate-800 block mb-1">Business Reason & Scope:</span>
                <p className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-700">
                  {selectedChange.reason || selectedChange.description}
                </p>
              </div>

              {/* Technical Plans Tabs */}
              <div>
                <div className="flex items-center gap-1 border-b border-slate-200 pb-1 mb-2">
                  <button
                    type="button"
                    onClick={() => setActivePlanTab('implementation')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      activePlanTab === 'implementation' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Implementation Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePlanTab('testing')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      activePlanTab === 'testing' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Testing & Verification
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePlanTab('rollback')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      activePlanTab === 'rollback' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Rollback Plan
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200 font-mono text-[11px] text-slate-800 whitespace-pre-wrap min-h-[70px]">
                  {activePlanTab === 'implementation' && (selectedChange.implementation_plan || 'No implementation steps recorded.')}
                  {activePlanTab === 'testing' && (selectedChange.testing_plan || 'No testing steps recorded.')}
                  {activePlanTab === 'rollback' && (selectedChange.rollback_plan || 'No rollback procedure specified.')}
                </div>
              </div>

              {/* CAB Approvals Log */}
              {selectedChange.approvals && selectedChange.approvals.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-800 block mb-1">CAB Authorization Log:</span>
                  <div className="space-y-1.5">
                    {selectedChange.approvals.map((app: any) => (
                      <div key={app.id} className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-slate-900">{app.approver_name || 'CAB Reviewer'}</span>
                          {app.comments && <p className="text-slate-600 text-[11px]">"{app.comments}"</p>}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          app.decision === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {app.decision}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* CAB AUTHORIZATION ACTIONS (Manager / Admin Role)         */}
              {/* ======================================================== */}
              {isManagerOrAdmin && selectedChange.status === 'pending_cab' && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2.5">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    CAB Authorization Required
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Review risk matrix, implementation window, and rollback plan before authorizing deployment.
                  </p>
                  <input
                    type="text"
                    value={actionComments}
                    onChange={(e) => setActionComments(e.target.value)}
                    placeholder="CAB comments or rejection reason..."
                    className="w-full text-xs p-2 bg-white border border-amber-300 rounded text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-amber-500"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleRejectChange}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs"
                    >
                      {actionLoading ? 'Rejecting...' : 'Reject Change'}
                    </button>
                    <button
                      type="button"
                      onClick={handleApproveChange}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {actionLoading ? 'Authorizing...' : 'Authorize & Schedule'}
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* IMPLEMENTATION CONTROLS (Agent / Manager / Admin)        */}
              {/* ======================================================== */}
              {isAgentOrManager && ['approved', 'scheduled', 'in_progress'].includes(selectedChange.status) && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Play className="w-4 h-4 text-blue-600" />
                      Implementation Controls
                    </span>
                    <span className="text-[10px] font-mono text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Status: {selectedChange.status.toUpperCase()}
                    </span>
                  </div>

                  {selectedChange.status === 'scheduled' || selectedChange.status === 'approved' ? (
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <span className="text-[11px] text-slate-600">
                        Ready for execution during the designated maintenance window.
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus('in_progress')}
                        disabled={actionLoading}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs shrink-0 flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {actionLoading ? 'Updating...' : 'Begin Implementation'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Execution Notes & Validation Results:
                        </label>
                        <textarea
                          rows={2}
                          value={executionNotes}
                          onChange={(e) => setExecutionNotes(e.target.value)}
                          placeholder="e.g. Firmware flashed successfully, network BGP peers re-converged in 42s."
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded text-slate-900 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus('rolled_back')}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded text-xs font-semibold flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Rollback Change
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus('completed')}
                          disabled={actionLoading}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Complete & Close Change
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end px-6 py-3 border-t border-slate-200 bg-slate-50/70 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedChange(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* RAISE CHANGE MODAL (Safe Viewport Layout)                 */}
      {/* ======================================================== */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          <form
            onSubmit={handleCreateChange}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <GitPullRequest className="w-4 h-4 text-blue-600" />
                Raise Infrastructure Change Request (RFC)
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-800">Change Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Core Switch OS Upgrade v16.2"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-800">Change Classification *</label>
                  <select
                    value={changeType}
                    onChange={(e) => setChangeType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:bg-white"
                  >
                    <option value="standard">Standard (Pre-Approved Low Risk)</option>
                    <option value="normal">Normal (Formal CAB Review Required)</option>
                    <option value="emergency">Emergency (Expedited Critical Outage Fix)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-800">Affected Service / Asset *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Identity Gateway / Active Directory"
                    value={affectedService}
                    onChange={(e) => setAffectedService(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-800">Affected Departments</label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering, Finance, Operations"
                    value={affectedDepts}
                    onChange={(e) => setAffectedDepts(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-800">Proposed Start Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={proposedStart}
                    onChange={(e) => setProposedStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-800">Proposed End Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={proposedEnd}
                    onChange={(e) => setProposedEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-800">Downtime (Minutes)</label>
                  <input
                    type="number"
                    min={0}
                    value={downtimeMinutes}
                    onChange={(e) => setDowntimeMinutes(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-800">Business Justification & Reason *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Why is this change necessary and what are the benefits?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:bg-white"
                />
              </div>

              {/* Dynamic Risk Assessment Matrix */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    Automated Risk Rating Calculator (1 - Low to 5 - Critical)
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2 text-[10px]">
                  <div>
                    <label className="block text-slate-500 mb-1">Impact (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={impactScore}
                      onChange={(e) => setImpactScore(Number(e.target.value))}
                      className="w-full p-1 bg-white border border-slate-200 rounded text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Complexity (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={complexityScore}
                      onChange={(e) => setComplexityScore(Number(e.target.value))}
                      className="w-full p-1 bg-white border border-slate-200 rounded text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Downtime (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={downtimeScore}
                      onChange={(e) => setDowntimeScore(Number(e.target.value))}
                      className="w-full p-1 bg-white border border-slate-200 rounded text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Security (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={securityScore}
                      onChange={(e) => setSecurityScore(Number(e.target.value))}
                      className="w-full p-1 bg-white border border-slate-200 rounded text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Rollback Diff (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={rollbackScore}
                      onChange={(e) => setRollbackScore(Number(e.target.value))}
                      className="w-full p-1 bg-white border border-slate-200 rounded text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-800">Implementation Plan *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Step-by-step technical execution commands..."
                    value={implementationPlan}
                    onChange={(e) => setImplementationPlan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-800">Testing Plan *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Validation assertions post-change..."
                    value={testingPlan}
                    onChange={(e) => setTestingPlan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-800">Rollback Plan *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Fallback procedure if tests fail..."
                    value={rollbackPlan}
                    onChange={(e) => setRollbackPlan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-3 border-t border-slate-200 bg-slate-50/70 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 text-xs rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Submitting RFC...' : 'Submit Change for Review'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
