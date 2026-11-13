import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { mockIncidents } from '../data/mockData';
import { Incident } from '../types';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Ticket,
  Clock,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Incident[]>(mockIncidents);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Confirmation & Rejection Dialog state
  const [confirmDialogTicket, setConfirmDialogTicket] = useState<Incident | null>(null);
  const [reopenDialogTicket, setReopenDialogTicket] = useState<Incident | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const data = await api.incidents.list();
      if (Array.isArray(data) && data.length > 0) {
        setTickets(data);
        setIsLiveConnected(true);
      }
    } catch (err) {
      // Graceful fallback to mock data if backend not active
      setIsLiveConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleConfirmResolution = async () => {
    if (!confirmDialogTicket) return;
    try {
      await api.incidents.confirmResolution(confirmDialogTicket.id);
      setSuccessToast("Your incident has been successfully closed. Thank you for confirming the resolution.");
      setConfirmDialogTicket(null);
      await fetchTickets();
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      alert(`Confirmation failed: ${err.message}`);
    }
  };

  const handleRejectResolution = async () => {
    if (!reopenDialogTicket || !rejectionReason.trim()) return;
    try {
      await api.incidents.rejectResolution(reopenDialogTicket.id, rejectionReason);
      setSuccessToast("Resolution rejected. Ticket returned to your assigned IT Support Agent's active queue.");
      setReopenDialogTicket(null);
      setRejectionReason('');
      await fetchTickets();
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    }
  };

  const myTickets = tickets.filter((t) =>
    filterStatus === 'all' ? true : t.status === filterStatus
  );

  const awaitingConfirmation = tickets.filter((t) => t.status === 'resolved');
  const openCount = tickets.filter((t) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = awaitingConfirmation.length;
  const closedCount = tickets.filter((t) => t.status === 'closed').length;

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Welcome back, {user.full_name}
            </h1>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isLiveConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              {isLiveConnected ? 'Live API Connected' : 'Demo Workspace'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit IT support requests, monitor ticket resolution, and review technical help guides.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTickets}
            disabled={isLoading}
            className="p-2 border border-slate-200 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
            title="Refresh tickets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/create-ticket"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.2]" />
            Report Technical Issue
          </Link>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-3 text-emerald-900 text-xs shadow-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium flex-1">{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* AWAITING CONFIRMATION HIGHLIGHT SECTION (PRD Step 3) */}
      {awaitingConfirmation.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-300 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-100 rounded-md text-amber-700">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Awaiting My Confirmation ({awaitingConfirmation.length})
                </h2>
                <p className="text-xs text-slate-600">
                  Your assigned IT Support Agent marked these issues as fixed. Please verify and confirm resolution to close the ticket.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-mono font-bold uppercase">
              Action Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {awaitingConfirmation.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-amber-200 rounded-lg p-4 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-blue-600">{t.ticket_number}</span>
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">{t.subject}</h3>
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded text-xs">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-0.5">
                      Agent Resolution Note:
                    </span>
                    <p className="text-slate-800 leading-relaxed italic">
                      "{t.resolution_notes || 'Issue identified and corrected by support team.'}"
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5">
                    <span>Agent: <strong className="text-slate-700">{t.assigned_agent_name || 'Assigned Agent'}</strong></span>
                    <span className="font-mono text-[10px]">
                      {t.resolved_at ? new Date(t.resolved_at).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setConfirmDialogTicket(t)}
                    className="flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirm Resolution
                  </button>
                  <button
                    onClick={() => {
                      setReopenDialogTicket(t);
                      setRejectionReason('');
                    }}
                    className="flex items-center justify-center gap-1.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Not Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Open Requests"
          value={openCount}
          subtitle="Awaiting agent investigation"
          icon={Ticket}
        />
        <StatCard
          title="In Progress"
          value={inProgressCount}
          subtitle="Active with technical support"
          icon={Clock}
        />
        <StatCard
          title="Awaiting Confirmation"
          value={resolvedCount}
          subtitle="Ready for your review"
          icon={AlertCircle}
        />
        <StatCard
          title="Closed Incidents"
          value={closedCount}
          subtitle="Resolved & verified"
          icon={CheckCircle2}
        />
      </div>

      {/* Tickets Table Card */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
              My Submitted Tickets
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono">
              {myTickets.length}
            </span>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5">
            {['all', 'open', 'in_progress', 'resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 text-xs rounded capitalize transition-colors ${
                  filterStatus === st
                    ? 'bg-slate-900 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-4">Ticket ID</th>
                <th className="py-2.5 px-4">Subject & Description</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Priority</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Assigned Agent</th>
                <th className="py-2.5 px-4 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {myTickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-blue-600">
                    {t.ticket_number}
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-medium text-slate-900 truncate">{t.subject}</div>
                    <div className="text-[11px] text-slate-500 truncate">{t.description}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">
                      {t.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {t.assigned_agent_name || (
                      <span className="text-slate-400 italic">Auto-Dispatch</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                    {new Date(t.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRMATION DIALOG MODAL (Step 4) */}
      {confirmDialogTicket && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-full shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Confirm that your issue has been resolved?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Please verify that the reported IT issue is fixed before closing this incident.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-blue-600">{confirmDialogTicket.ticket_number}</span>
                <span className="text-slate-500">{confirmDialogTicket.category}</span>
              </div>
              <p className="font-semibold text-slate-800">{confirmDialogTicket.subject}</p>
              {confirmDialogTicket.resolution_notes && (
                <p className="text-slate-600 italic border-t border-slate-200/60 pt-1.5 mt-1">
                  Agent Note: "{confirmDialogTicket.resolution_notes}"
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialogTicket(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolution}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                Yes, Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION & REOPEN DIALOG MODAL (Step 5) */}
      {reopenDialogTicket && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-full shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Issue Not Resolved — Reopen Ticket
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Please explain why the issue is not fixed so your assigned agent can continue technical diagnosis.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-700 block">
                Rejection Reason / Ongoing Problem Symptoms *
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. The Wi-Fi connection is still disconnecting when switching floors."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setReopenDialogTicket(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectionReason.trim()}
                onClick={handleRejectResolution}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                Reopen Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
