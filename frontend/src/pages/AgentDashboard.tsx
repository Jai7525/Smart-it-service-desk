import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { Incident } from '../types';
import { api } from '../services/api';
import {
  Ticket,
  Clock,
  AlertCircle,
  CheckCircle,
  Play,
  Check,
  UserCheck,
  RotateCcw,
  MessageSquare,
  Lock,
  Send,
  Timer,
  AlertTriangle,
  Search,
} from 'lucide-react';

export const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Incident | null>(null);
  const [activeTab, setActiveTab] = useState<'my_queue' | 'awaiting_confirmation' | 'reopened' | 'all_team'>('my_queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [teams, setTeams] = useState<any[]>([]);

  const fetchAgentTickets = async () => {
    try {
      const [incidentData, teamsData] = await Promise.allSettled([
        api.incidents.list(),
        api.admin.listTeams(),
      ]);

      if (incidentData.status === 'fulfilled' && Array.isArray(incidentData.value)) {
        setIncidents(incidentData.value);
        if (incidentData.value.length > 0) {
          // Check for ticket query param to auto-select
          const params = new URLSearchParams(location.search);
          const ticketParam = params.get('ticket') || (location.state as any)?.ticketNumber;
          if (ticketParam) {
            const match = incidentData.value.find((t: Incident) => t.ticket_number === ticketParam || t.id === ticketParam);
            if (match) {
              setSelectedTicket(match);
              return;
            }
          }

          // Default selected ticket to the logged-in agent's first ticket if available, else first incident
          const myFirst = incidentData.value.find((t: Incident) => {
            if (!user) return true;
            if (t.assigned_agent_id && user.id && t.assigned_agent_id === user.id) return true;
            if (t.assigned_agent_name && user.full_name) {
              return t.assigned_agent_name.toLowerCase().includes(user.full_name.toLowerCase());
            }
            return false;
          });
          setSelectedTicket(myFirst || incidentData.value[0]);
        } else {
          setSelectedTicket(null);
        }
      }

      if (teamsData.status === 'fulfilled' && Array.isArray(teamsData.value)) {
        setTeams(teamsData.value);
      }
    } catch (e) {
      console.warn('Could not fetch agent tickets:', e);
    }
  };

  useEffect(() => {
    fetchAgentTickets();
  }, [location.search, location.state]);

  // Agent investigation state
  const [resolutionNote, setResolutionNote] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [timelineNotes, setTimelineNotes] = useState<
    { id: string; author: string; text: string; is_internal: boolean; time: string }[]
  >([
    {
      id: 'tn-1',
      author: 'System Automation',
      text: 'Incident automatically classified as Network and assigned based on lowest active workload.',
      is_internal: true,
      time: '45m ago',
    },
    {
      id: 'tn-2',
      author: 'Alex Rivers (You)',
      text: 'Dispatched ping diagnostic to Floor 2 switch stack 1.',
      is_internal: true,
      time: '20m ago',
    },
  ]);

  // SLA Live Countdown Calculator
  const getRemainingTime = (deadlineStr?: string) => {
    if (!deadlineStr) return { text: 'N/A', isUrgent: false, isBreached: false };
    const diffMs = new Date(deadlineStr).getTime() - Date.now();
    if (diffMs <= 0) return { text: 'BREACHED', isUrgent: true, isBreached: true };

    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return {
      text: `${hours}h ${minutes}m remaining`,
      isUrgent: totalMinutes < 45,
      isBreached: false,
    };
  };

  const isMyTicket = (t: Incident) => {
    if (!user) return true;
    if (t.assigned_agent_id && user.id && t.assigned_agent_id === user.id) return true;
    if (t.assigned_agent_name && user.full_name) {
      const tName = t.assigned_agent_name.toLowerCase();
      const uName = user.full_name.toLowerCase();
      if (tName.includes(uName) || uName.includes(tName.split(' ')[0])) return true;
    }
    return false;
  };

  const myQueue = incidents.filter((t) => {
    const matchesSearch =
      t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'my_queue') {
      return isMyTicket(t) && (t.status === 'open' || t.status === 'in_progress' || t.status === 'reopened');
    }
    if (activeTab === 'awaiting_confirmation') {
      return isMyTicket(t) && t.status === 'resolved';
    }
    if (activeTab === 'reopened') {
      return isMyTicket(t) && t.status === 'reopened';
    }
    return true; // all_team
  });

  const activeCount = incidents.filter(
    (t) => (t.status === 'open' || t.status === 'in_progress' || t.status === 'reopened') && isMyTicket(t)
  ).length;
  const awaitingConfCount = incidents.filter(
    (t) => t.status === 'resolved' && isMyTicket(t)
  ).length;
  const reopenedCount = incidents.filter(
    (t) => t.status === 'reopened' && isMyTicket(t)
  ).length;
  const criticalCount = incidents.filter(
    (t) => t.priority === 'critical' && t.status !== 'closed'
  ).length;

  const handleUpdateStatus = async (newStatus: 'in_progress' | 'resolved') => {
    if (!selectedTicket) return;

    try {
      await api.incidents.updateStatus(selectedTicket.id, newStatus, resolutionNote);
    } catch (e) {
      console.warn('Backend update status error, updating locally:', e);
    }

    const updated = incidents.map((t) =>
      t.id === selectedTicket.id
        ? {
            ...t,
            status: newStatus,
            resolution_notes:
              newStatus === 'resolved'
                ? resolutionNote || 'Technical root cause addressed.'
                : t.resolution_notes,
          }
        : t
    );

    setIncidents(updated);
    setSelectedTicket({
      ...selectedTicket,
      status: newStatus,
      resolution_notes: newStatus === 'resolved' ? resolutionNote : selectedTicket.resolution_notes,
    });

    setTimelineNotes([
      ...timelineNotes,
      {
        id: `tn-${Date.now()}`,
        author: `${user?.full_name || 'Agent'} (You)`,
        text:
          newStatus === 'in_progress'
            ? 'Accepted ticket and started technical diagnosis.'
            : `Marked resolved. Resolution note: ${resolutionNote}`,
        is_internal: false,
        time: 'Just now',
      },
    ]);
    setResolutionNote('');
  };

  const handleReassign = async (teamIdOrName: string) => {
    if (!selectedTicket) return;
    const selectedTeam = teams.find((t) => t.id === teamIdOrName || t.name === teamIdOrName);
    const targetName = selectedTeam ? selectedTeam.name : teamIdOrName;
    const targetTeamId = selectedTeam ? selectedTeam.id : undefined;

    try {
      if (targetTeamId) {
        await api.incidents.assign(selectedTicket.id, {
          team_id: targetTeamId,
          reason: `Reassigned to ${targetName} support queue`,
        });
      }
    } catch (e) {
      console.warn('Backend reassign error, updating locally:', e);
    }

    const updated = incidents.map((t) =>
      t.id === selectedTicket.id
        ? { ...t, assigned_agent_name: `${targetName} Triage` }
        : t
    );
    setIncidents(updated);
    setSelectedTicket({
      ...selectedTicket,
      assigned_agent_name: `${targetName} Triage`,
    });

    setTimelineNotes([
      ...timelineNotes,
      {
        id: `tn-${Date.now()}`,
        author: user?.full_name || 'Agent',
        text: `Reassigned ticket to ${targetName} queue.`,
        is_internal: true,
        time: 'Just now',
      },
    ]);
  };

  const handleAddInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNote.trim()) return;

    setTimelineNotes([
      ...timelineNotes,
      {
        id: `tn-${Date.now()}`,
        author: `${user?.full_name || 'Agent'} (Private Note)`,
        text: internalNote,
        is_internal: true,
        time: 'Just now',
      },
    ]);
    setInternalNote('');
  };

  const respSla = getRemainingTime(selectedTicket?.response_deadline);
  const resSla = getRemainingTime(selectedTicket?.resolution_deadline);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Queue"
          value={activeCount}
          subtitle="Open & In Progress"
          icon={Ticket}
        />
        <StatCard
          title="Critical Alerts"
          value={criticalCount}
          subtitle="Prioritized routing"
          badge={{ text: 'Action Needed', positive: false }}
          icon={AlertCircle}
        />
        <StatCard
          title="SLA Compliance"
          value="98.2%"
          subtitle="Target: 95.0%"
          badge={{ text: 'On Track', positive: true }}
          icon={Clock}
        />
        <StatCard
          title="Resolved (Today)"
          value="14"
          subtitle="Mean handle: 38m"
          icon={CheckCircle}
        />
      </div>

      {/* Main 2-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Ticket Worklist */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          {/* Header & Tabs */}
          <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded overflow-x-auto">
              <button
                onClick={() => setActiveTab('my_queue')}
                className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'my_queue'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active Queue ({activeCount})
              </button>
              <button
                onClick={() => setActiveTab('awaiting_confirmation')}
                className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'awaiting_confirmation'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Awaiting Confirmation ({awaitingConfCount})
              </button>
              {reopenedCount > 0 && (
                <button
                  onClick={() => setActiveTab('reopened')}
                  className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeTab === 'reopened'
                      ? 'bg-white text-rose-700 shadow-xs'
                      : 'text-rose-600 hover:text-rose-800'
                  }`}
                >
                  Reopened ({reopenedCount})
                </button>
              )}
              <button
                onClick={() => setActiveTab('all_team')}
                className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'all_team'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Team ({incidents.length})
              </button>
            </div>

            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter queue..."
                className="w-full bg-slate-50 border border-slate-200 rounded pl-8 pr-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Queue Items */}
          <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
            {myQueue.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className={`p-3.5 cursor-pointer transition-colors ${
                  selectedTicket?.id === t.id
                    ? 'bg-blue-50/70 border-l-3 border-blue-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {t.ticket_number}
                    </span>
                    <PriorityBadge priority={t.priority} />
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                      {t.category}
                    </span>
                  </div>
                  <StatusBadge status={t.status} />
                </div>

                <h3 className="font-semibold text-xs text-slate-900 truncate">
                  {t.subject}
                </h3>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {t.description}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                  <span>Assignee: {t.assigned_agent_name || 'Unassigned'}</span>
                  <span>Location: {t.location || 'Remote'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Deep Ticket Triage & Resolution Workbench */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-5">
          {selectedTicket ? (
            <>
              {/* Ticket Top Meta */}
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-sm font-bold text-blue-600">
                    {selectedTicket.ticket_number}
                  </span>
                  <StatusBadge status={selectedTicket.status} />
                </div>
                <h2 className="text-sm font-bold text-slate-900 leading-snug">
                  {selectedTicket.subject}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <PriorityBadge priority={selectedTicket.priority} />
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                    {selectedTicket.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Floor: {selectedTicket.location || 'Remote'}
                  </span>
                </div>
              </div>

              {/* SLA Real-Time Target Matrix */}
              <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-800 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-blue-600" />
                    SLA Countdown Targets
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Target: {selectedTicket.priority} Matrix
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block uppercase">1st Response</span>
                    <span
                      className={`font-mono text-xs font-bold ${
                        respSla.isBreached
                          ? 'text-rose-600'
                          : respSla.isUrgent
                          ? 'text-amber-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {selectedTicket.status !== 'open' ? 'Responded (Met)' : respSla.text}
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block uppercase">Resolution</span>
                    <span
                      className={`font-mono text-xs font-bold ${
                        selectedTicket.status === 'resolved' || selectedTicket.status === 'closed'
                          ? 'text-emerald-600'
                          : resSla.isBreached
                          ? 'text-rose-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {selectedTicket.status === 'resolved' ? 'Resolved' : resSla.text}
                    </span>
                  </div>
                </div>
              </div>

              {/* Problem Description */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Reported Technical Issue
                </span>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200/60">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Fast Status Transitions & Reassignment */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">Agent Actions</span>
                  {/* Reassignment Dropdown */}
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleReassign(e.target.value);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-600 focus:outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>Reassign Team...</option>
                    {teams.length > 0 ? (
                      teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          Dispatch to {team.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Network Operations">Dispatch to Network Operations</option>
                        <option value="Hardware Support">Dispatch to Hardware Support</option>
                        <option value="Application Support">Dispatch to Application Support</option>
                        <option value="Identity & Access Team">Dispatch to Identity & Access Team</option>
                        <option value="General Service Desk">Dispatch to General Service Desk</option>
                      </>
                    )}
                  </select>
                </div>

                {(selectedTicket.status === 'open' || selectedTicket.status === 'reopened') && (
                  <button
                    onClick={() => handleUpdateStatus('in_progress')}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {selectedTicket.status === 'reopened' ? 'Resume Investigation (Reopened)' : 'Accept Ticket & Start Investigation'}
                  </button>
                )}

                {selectedTicket.status === 'in_progress' && (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Enter technical resolution steps taken..."
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    />
                    <button
                      onClick={() => handleUpdateStatus('resolved')}
                      disabled={!resolutionNote.trim()}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Check className="w-4 h-4 stroke-[2.2]" />
                      Mark as Resolved (Awaiting Confirmation)
                    </button>
                  </div>
                )}

                {selectedTicket.status === 'resolved' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Awaiting Employee Confirmation
                    </div>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      You have resolved this incident with note: "{selectedTicket.resolution_notes}". Only the reporting employee can confirm resolution to close the ticket.
                    </p>
                  </div>
                )}

                {selectedTicket.status === 'closed' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Incident Closed & Verified
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      The reporting employee has verified the fix and the incident is officially closed.
                    </p>
                  </div>
                )}
              </div>

              {/* Internal Notes & Activity Timeline */}
              <div className="border-t border-slate-100 pt-3 space-y-2.5">
                <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-amber-600" />
                  Investigation Timeline & Internal Notes
                </span>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {timelineNotes.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2 rounded text-xs border ${
                        n.is_internal
                          ? 'bg-amber-50/50 border-amber-200/80 text-amber-900'
                          : 'bg-slate-50 border-slate-200/80 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="font-semibold">{n.author}</span>
                        <span className="font-mono text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-[11px] leading-normal">{n.text}</p>
                    </div>
                  ))}
                </div>

                {/* Add Internal Note */}
                <form onSubmit={handleAddInternalNote} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Add private investigation note..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-medium"
                  >
                    Log
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Select a ticket from the queue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
