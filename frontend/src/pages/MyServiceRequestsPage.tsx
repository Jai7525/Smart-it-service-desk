import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ServiceRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Filter,
  Calendar,
  Layers,
  ChevronRight,
  User,
  ShieldCheck,
  FileText,
  X
} from 'lucide-react';

export const MyServiceRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedReq, setSelectedReq] = useState<ServiceRequest | null>(null);

  // Fulfillment & Assignment states
  const [availableAgents, setAvailableAgents] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [fulfillmentNotes, setFulfillmentNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isAgentOrManager = user?.role === 'agent' || user?.role === 'manager' || user?.role === 'admin';

  useEffect(() => {
    fetchRequests();
    if (isAgentOrManager) {
      fetchAgents();
    }
  }, [selectedStatus, user]);

  const fetchAgents = async () => {
    try {
      const users = await api.admin.listUsers();
      if (Array.isArray(users)) {
        const agents = users.filter((u: any) => u.role === 'agent' || u.role === 'manager');
        setAvailableAgents(agents);
      }
    } catch (err) {
      console.warn('Could not load agents list:', err);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await api.serviceRequests.list(selectedStatus);
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch service requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetailModal = (req: ServiceRequest) => {
    setSelectedReq(req);
    setSelectedAgentId(req.assigned_agent_id || '');
    setFulfillmentNotes(req.fulfillment_notes || '');
    setActionSuccess(null);
    setActionError(null);
  };

  const handleClaimOrAssign = async (agentId?: string) => {
    if (!selectedReq) return;
    const targetAgentId = agentId || selectedAgentId || user?.id;
    if (!targetAgentId) {
      setActionError('Please select an agent to assign.');
      return;
    }

    setUpdating(true);
    setActionError(null);
    try {
      const updated = await api.serviceRequests.updateStatus(selectedReq.id, {
        status: selectedReq.status === 'pending_approval' ? selectedReq.status : 'in_progress',
        assigned_agent_id: targetAgentId,
      });

      const updatedReq = await api.serviceRequests.get(selectedReq.id);
      setSelectedReq(updatedReq);
      setActionSuccess('Agent assigned successfully!');
      fetchRequests();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to assign agent.');
    } finally {
      setUpdating(false);
    }
  };

  const handleStartFulfillment = async () => {
    if (!selectedReq) return;
    setUpdating(true);
    setActionError(null);
    try {
      await api.serviceRequests.updateStatus(selectedReq.id, {
        status: 'in_progress',
        assigned_agent_id: selectedReq.assigned_agent_id || (user?.role === 'agent' ? user.id : undefined),
      });

      const updatedReq = await api.serviceRequests.get(selectedReq.id);
      setSelectedReq(updatedReq);
      setActionSuccess('Service request is now In Progress!');
      fetchRequests();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to start fulfillment.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCompleteFulfillment = async () => {
    if (!selectedReq) return;
    if (!fulfillmentNotes.trim()) {
      setActionError('Fulfillment completion notes are required.');
      return;
    }

    setUpdating(true);
    setActionError(null);
    try {
      await api.serviceRequests.updateStatus(selectedReq.id, {
        status: 'fulfilled',
        fulfillment_notes: fulfillmentNotes.trim(),
        assigned_agent_id: selectedReq.assigned_agent_id || (user?.role === 'agent' ? user.id : undefined),
      });

      const updatedReq = await api.serviceRequests.get(selectedReq.id);
      setSelectedReq(updatedReq);
      setActionSuccess('Service request fulfilled and completed successfully!');
      fetchRequests();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to mark as fulfilled.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            Pending Approval
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3 h-3 text-blue-500" />
            Approved • Queued
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="w-3 h-3 text-indigo-500 animate-spin" />
            Fulfillment In Progress
          </span>
        );
      case 'fulfilled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Fulfilled
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getStepProgress = (status: string) => {
    const steps = [
      { key: 'submitted', label: 'Submitted' },
      { key: 'approval', label: 'Manager Approval' },
      { key: 'fulfillment', label: 'IT Fulfillment' },
      { key: 'completed', label: 'Completed' },
    ];

    let currentStep = 1;
    if (status === 'approved') currentStep = 2;
    if (status === 'in_progress') currentStep = 3;
    if (status === 'fulfilled') currentStep = 4;
    if (status === 'rejected') currentStep = 2;

    return { steps, currentStep, isRejected: status === 'rejected' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            My Service Requests
          </h1>
          <p className="text-xs text-slate-500">
            Track approval state, assigned support agents, and delivery timelines for your requested services.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['all', 'pending_approval', 'approved', 'in_progress', 'fulfilled', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition-colors ${
                selectedStatus === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Request Grid / Table */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          Loading service requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-lg text-slate-400 text-xs">
          No service requests found in this filter.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-4">Request #</th>
                <th className="py-2.5 px-4">Service Item</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Submitted Date</th>
                <th className="py-2.5 px-4">Assigned Agent</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">
                    {req.request_number}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900 block">{req.title}</span>
                    <span className="text-[11px] text-slate-400 truncate block max-w-xs">
                      {req.business_justification}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                      {req.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(req.status)}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {new Date(req.created_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {req.assigned_agent_name ? (
                      <span className="flex items-center gap-1 font-medium">
                        <User className="w-3 h-3 text-slate-400" />
                        {req.assigned_agent_name}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenDetailModal(req)}
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

      {/* Details & Approval Tracking Drawer / Modal */}
      {selectedReq && (
        <div 
          onClick={() => setSelectedReq(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded">
                    {selectedReq.request_number}
                  </span>
                  <span className="text-sm font-bold text-slate-900">{selectedReq.title}</span>
                </div>
                <span className="text-xs text-slate-500 mt-1 block">
                  Category: {selectedReq.category} • Submitted by {selectedReq.requester_name || user?.full_name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Stepper Progress */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-3">
                  Lifecycle Fulfillment Stepper
                </span>
                {(() => {
                  const { steps, currentStep, isRejected } = getStepProgress(selectedReq.status);
                  return (
                    <div className="flex items-center justify-between relative">
                      <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-slate-200 -z-0" />
                      {steps.map((st, i) => {
                        const isComplete = i + 1 < currentStep || (i + 1 === 4 && selectedReq.status === 'fulfilled');
                        const isCurrent = i + 1 === currentStep;
                        return (
                          <div key={st.key} className="flex flex-col items-center relative z-10 space-y-1">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                isRejected && isCurrent
                                  ? 'bg-rose-600 text-white'
                                  : isComplete
                                  ? 'bg-emerald-600 text-white'
                                  : isCurrent
                                  ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {isComplete ? '✓' : i + 1}
                            </div>
                            <span className="text-[10px] font-semibold text-slate-700 text-center">
                              {st.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Request Data & Justification */}
              <div>
                <span className="font-semibold text-slate-800 block">Business Justification:</span>
                <p className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-700 mt-1">
                  {selectedReq.business_justification}
                </p>
              </div>

              {selectedReq.form_data && Object.keys(selectedReq.form_data).length > 0 && (
                <div>
                  <span className="font-semibold text-slate-800 block mb-1">Service Specifications:</span>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 grid grid-cols-2 gap-2">
                    {Object.entries(selectedReq.form_data).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-slate-400 capitalize block text-[10px]">{k.replace('_', ' ')}</span>
                        <span className="text-slate-900 font-medium">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval History */}
              <div>
                <span className="font-semibold text-slate-800 block mb-1">Approval History:</span>
                {selectedReq.approvals.length === 0 ? (
                  <p className="text-slate-400 italic">No formal approvals required for this service item.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedReq.approvals.map((app) => (
                      <div
                        key={app.id}
                        className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-slate-900">{app.approver_name || 'Approver'}</span>
                          {app.comments && (
                            <p className="text-slate-600 text-[11px] mt-0.5">"{app.comments}"</p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            app.decision === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.decision === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {app.decision}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedReq.fulfillment_notes && (
                <div>
                  <span className="font-semibold text-slate-800 block">Fulfillment Notes:</span>
                  <p className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded mt-1">
                    {selectedReq.fulfillment_notes}
                  </p>
                </div>
              )}

              {/* Status & Feedback Messages */}
              {actionSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{actionSuccess}</span>
                </div>
              )}
              {actionError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded text-xs flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* IT Agent / Manager Fulfillment Controls */}
              {isAgentOrManager && selectedReq.status !== 'rejected' && (
                <div className="p-3.5 bg-blue-50/50 rounded-lg border border-blue-200 space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      IT Fulfillment Actions ({user?.role?.toUpperCase()})
                    </span>
                    <span className="text-[10px] font-mono text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                      Step {selectedReq.status === 'fulfilled' ? '4 of 4' : selectedReq.status === 'in_progress' ? '3 of 4' : '2 of 4'}
                    </span>
                  </div>

                  {/* Agent Assignment Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Assigned IT Agent:
                      </label>
                      <select
                        value={selectedAgentId}
                        onChange={(e) => setSelectedAgentId(e.target.value)}
                        disabled={updating || selectedReq.status === 'fulfilled'}
                        className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">-- Select Support Agent --</option>
                        {availableAgents.map((ag) => (
                          <option key={ag.id} value={ag.id}>
                            {ag.full_name} ({ag.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleClaimOrAssign()}
                        disabled={updating || !selectedAgentId || selectedReq.status === 'fulfilled'}
                        className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs"
                      >
                        {updating ? 'Assigning...' : 'Assign Agent'}
                      </button>
                      {user?.role === 'agent' && (
                        <button
                          type="button"
                          onClick={() => handleClaimOrAssign(user.id)}
                          disabled={updating || selectedReq.status === 'fulfilled'}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs"
                        >
                          Claim
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Fulfillment Progress Actions */}
                  {selectedReq.status !== 'fulfilled' && (
                    <div className="pt-2 border-t border-blue-200/60 space-y-2">
                      {selectedReq.status === 'approved' && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-600">
                            Request is approved and ready for configuration/delivery.
                          </span>
                          <button
                            type="button"
                            onClick={handleStartFulfillment}
                            disabled={updating}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shrink-0 shadow-xs"
                          >
                            Start Fulfillment
                          </button>
                        </div>
                      )}

                      {(selectedReq.status === 'in_progress' || selectedReq.status === 'approved') && (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-700 block">
                            Fulfillment Completion Notes:
                          </label>
                          <textarea
                            value={fulfillmentNotes}
                            onChange={(e) => setFulfillmentNotes(e.target.value)}
                            placeholder="e.g. Software installed, license key activated, verified with user."
                            rows={2}
                            disabled={updating}
                            className="w-full text-xs p-2 bg-white border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500"
                          />
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={handleCompleteFulfillment}
                              disabled={updating}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {updating ? 'Fulfilling...' : 'Complete & Mark as Fulfilled'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer - Fixed at Bottom */}
            <div className="flex justify-end px-6 py-3 border-t border-slate-200 bg-slate-50/70 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

