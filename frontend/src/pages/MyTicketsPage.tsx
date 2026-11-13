import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { mockIncidents } from '../data/mockData';
import { Incident } from '../types';
import { api } from '../services/api';
import {
  Search,
  Filter,
  CheckCircle2,
  MessageSquare,
  Clock,
  Send,
  X,
  FileText,
  UserCheck,
} from 'lucide-react';

import { useLocation } from 'react-router-dom';

export const MyTicketsPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [tickets, setIncidents] = useState<Incident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Incident | null>(null);

  const fetchTickets = async () => {
    try {
      const data = await api.incidents.list();
      if (Array.isArray(data) && data.length > 0) {
        setIncidents(data);
        // Check for ticket query param or location state to auto-open
        const params = new URLSearchParams(location.search);
        const ticketParam = params.get('ticket') || (location.state as any)?.ticketNumber;
        if (ticketParam) {
          const match = data.find((t) => t.ticket_number === ticketParam || t.id === ticketParam);
          if (match) setSelectedTicket(match);
        }
      } else {
        setIncidents(mockIncidents);
      }
    } catch (e) {
      setIncidents(mockIncidents);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [location.search, location.state]);

  // New comment input
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<
    { id: string; author: string; text: string; time: string }[]
  >([
    {
      id: 'c1',
      author: 'Alex Rivers (Support Agent)',
      text: 'Investigating router port configuration on Floor 2 IDF closet.',
      time: '25 mins ago',
    },
    {
      id: 'c2',
      author: 'John Doe (You)',
      text: 'Thanks! Notice that the issue is also happening when waking laptop from sleep.',
      time: '10 mins ago',
    },
  ]);

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleConfirmClose = async (ticketId: string) => {
    try {
      await api.incidents.confirmResolution(ticketId);
    } catch (e: any) {
      alert(`Confirmation failed: ${e.message}`);
      return;
    }
    const updated = tickets.map((t) =>
      t.id === ticketId ? { ...t, status: 'closed' as const } : t
    );
    setIncidents(updated);
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: 'closed' });
    }
  };

  const handleRejectReopen = async (ticketId: string, reason: string) => {
    try {
      await api.incidents.rejectResolution(ticketId, reason);
    } catch (e: any) {
      alert(`Reopen request failed: ${e.message}`);
      return;
    }
    const updated = tickets.map((t) =>
      t.id === ticketId ? { ...t, status: 'reopened' as const } : t
    );
    setIncidents(updated);
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: 'reopened' });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (selectedTicket) {
      try {
        await api.incidents.addComment(selectedTicket.id, newComment, false);
      } catch (err) {
        console.warn('Backend comment error, applying locally:', err);
      }
    }

    setComments([
      ...comments,
      {
        id: `c-${Date.now()}`,
        author: `${user?.full_name || 'You'} (You)`,
        text: newComment,
        time: 'Just now',
      },
    ]);
    setNewComment('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            My Submitted Tickets
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, filter, and track technical support requests submitted across your devices.
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by ID or title..."
            className="w-full bg-slate-50 border border-slate-200 rounded pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="Network">Network</option>
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
            <option value="Access">Access</option>
          </select>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Ticket ID</th>
              <th className="py-3 px-4">Subject & Description</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Assigned Agent</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredTickets.map((t) => (
              <tr
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td className="py-3 px-4 font-mono font-bold text-blue-600">
                  {t.ticket_number}
                </td>
                <td className="py-3 px-4 max-w-sm">
                  <div className="font-semibold text-slate-900 truncate">{t.subject}</div>
                  <div className="text-[11px] text-slate-500 truncate">{t.description}</div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
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
                    <span className="text-slate-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  {t.status === 'resolved' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmClose(t.id);
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors"
                    >
                      Confirm & Close
                    </button>
                  ) : (
                    <span className="text-slate-400 text-[11px]">View Details →</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slide-over Ticket Detail Drawer */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col p-6 space-y-5 overflow-y-auto">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-blue-600">
                  {selectedTicket.ticket_number}
                </span>
                <StatusBadge status={selectedTicket.status} />
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subject & Core Meta */}
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {selectedTicket.subject}
              </h2>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <PriorityBadge priority={selectedTicket.priority} />
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                  {selectedTicket.category}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Location: {selectedTicket.location || 'Remote'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Full Description
              </span>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200/80 leading-relaxed">
                {selectedTicket.description}
              </p>
            </div>

            {/* Resolution Section if Resolved */}
            {selectedTicket.status === 'resolved' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">
                    Resolution Provided by Support Team
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed italic bg-white p-2.5 rounded border border-emerald-200/60">
                  "{selectedTicket.resolution_notes || 'Issue verified and resolved.'}"
                </p>
                <div className="flex items-center justify-between text-[11px] text-emerald-800 font-medium">
                  <span>Assigned Agent: {selectedTicket.assigned_agent_name || 'Agent'}</span>
                  <span>{selectedTicket.resolved_at ? new Date(selectedTicket.resolved_at).toLocaleDateString() : 'Awaiting confirmation'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleConfirmClose(selectedTicket.id)}
                    className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirm & Close Ticket
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt("Please provide a reason why this issue is not resolved:");
                      if (reason && reason.trim()) {
                        handleRejectReopen(selectedTicket.id, reason.trim());
                      }
                    }}
                    className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    Not Resolved (Reopen)
                  </button>
                </div>
              </div>
            )}

            {/* Comment Thread (SRS FR-08 / ticket_comments) */}
            <div className="border-t border-slate-200 pt-4 flex-1 flex flex-col space-y-3">
              <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                Ticket Activity & Discussion
              </span>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-48 pr-1">
                {comments.map((c) => (
                  <div key={c.id} className="bg-slate-50 p-2.5 rounded border border-slate-200/60 text-xs">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-800">{c.author}</span>
                      <span className="text-slate-400 font-mono text-[10px]">{c.time}</span>
                    </div>
                    <p className="text-slate-600 leading-normal">{c.text}</p>
                  </div>
                ))}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a reply or update..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

