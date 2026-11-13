import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ServiceRequest } from '../types';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  User,
  AlertTriangle,
  FileText,
  Filter
} from 'lucide-react';

export const ManagerApprovalCentrePage: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Modal actions
  const [actionReq, setActionReq] = useState<ServiceRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'info' | null>(null);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const statusParam =
        activeTab === 'pending'
          ? 'pending_approval'
          : activeTab === 'approved'
          ? 'approved'
          : 'rejected';
      const data = await api.serviceRequests.list(statusParam);
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch approval queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAction = (req: ServiceRequest, type: 'approve' | 'reject' | 'info') => {
    setActionReq(req);
    setActionType(type);
    setComments('');
  };

  const handleExecuteDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionReq || !actionType) return;

    if (actionType === 'reject' && !comments.trim()) {
      setMsg({ text: 'A rejection reason is required for audit logs.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setMsg(null);

    try {
      if (actionType === 'approve') {
        await api.serviceRequests.approve(actionReq.id, comments);
        setMsg({ text: `Request ${actionReq.request_number} authorized and dispatched to fulfillment queue.`, type: 'success' });
      } else if (actionType === 'reject') {
        await api.serviceRequests.reject(actionReq.id, comments);
        setMsg({ text: `Request ${actionReq.request_number} rejected.`, type: 'success' });
      }

      setActionReq(null);
      setActionType(null);
      await fetchRequests();
    } catch (err: any) {
      setMsg({ text: err.message || 'Action failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Manager Approval Centre
          </h1>
          <p className="text-xs text-slate-500">
            Review and authorize departmental service requests, hardware requisitions, and access elevations.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs font-semibold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'pending'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Authorization
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'approved'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved History
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'rejected'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center justify-between border ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Requests Table */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          Loading approval requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-lg text-slate-400 text-xs">
          No service requests currently in the {activeTab} queue.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-4">Request #</th>
                <th className="py-2.5 px-4">Requester</th>
                <th className="py-2.5 px-4">Requested Service</th>
                <th className="py-2.5 px-4">Business Justification</th>
                <th className="py-2.5 px-4">Submitted</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">
                    {req.request_number}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900 block">{req.requester_name}</span>
                    <span className="text-[11px] text-slate-400 block">{req.requester_email}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900 block">{req.title}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{req.category}</span>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <p className="text-slate-600 truncate">{req.business_justification}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {new Date(req.created_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {activeTab === 'pending' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAction(req, 'approve')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors shadow-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleOpenAction(req, 'reject')}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-semibold transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="font-semibold text-slate-500 uppercase text-[10px]">
                        Processed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Decision Modal */}
      {actionReq && actionType && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleExecuteDecision}
            className="bg-white rounded-lg border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">
                {actionType === 'approve' ? 'Authorize Service Request' : 'Reject Service Request'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setActionReq(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-1">
              <div>
                <span className="text-slate-500">Request:</span>{' '}
                <span className="font-semibold text-slate-800">{actionReq.request_number} - {actionReq.title}</span>
              </div>
              <div>
                <span className="text-slate-500">Requester:</span>{' '}
                <span className="font-semibold text-slate-800">{actionReq.requester_name}</span>
              </div>
              <div>
                <span className="text-slate-500">Justification:</span>
                <p className="text-slate-700 italic mt-0.5">"{actionReq.business_justification}"</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                {actionType === 'reject' ? 'Rejection Reason (Required) *' : 'Approval Comments (Optional)'}
              </label>
              <textarea
                rows={3}
                required={actionType === 'reject'}
                placeholder={
                  actionType === 'reject'
                    ? 'Explain the business or policy rationale for denying this request...'
                    : 'Add any specific provisioning instructions for IT dispatch...'
                }
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setActionReq(null);
                  setActionType(null);
                }}
                className="px-3 py-1.5 text-xs rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-1.5 rounded text-xs font-semibold text-white shadow-xs ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submitting
                  ? 'Saving...'
                  : actionType === 'approve'
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

