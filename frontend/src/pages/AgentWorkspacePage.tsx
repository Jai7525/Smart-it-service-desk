import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { Incident } from '../types';
import { api } from '../services/api';
import {
  Ticket,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';

export const AgentWorkspacePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const [incidentData, teamsData] = await Promise.allSettled([
          api.incidents.list(),
          api.admin.listTeams(),
        ]);

        if (incidentData.status === 'fulfilled' && Array.isArray(incidentData.value)) {
          setIncidents(incidentData.value);
        }
        if (teamsData.status === 'fulfilled' && Array.isArray(teamsData.value)) {
          setTeams(teamsData.value);
        }
      } catch (e) {
        console.warn('Workspace load error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkspace();
  }, []);

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

  const myActiveTickets = incidents.filter(
    (t) => (t.status === 'open' || t.status === 'in_progress' || t.status === 'reopened') && isMyTicket(t)
  );

  const awaitingConfirmationTickets = incidents.filter(
    (t) => t.status === 'resolved' && isMyTicket(t)
  );

  const resolvedTodayTickets = incidents.filter(
    (t) => (t.status === 'resolved' || t.status === 'closed') && isMyTicket(t)
  );

  // Remaining SLA Calculator
  const getRemainingTime = (deadlineStr?: string) => {
    if (!deadlineStr) return { text: 'N/A', isUrgent: false, isBreached: false, minutes: 9999 };
    const diffMs = new Date(deadlineStr).getTime() - Date.now();
    if (diffMs <= 0) return { text: 'BREACHED', isUrgent: true, isBreached: true, minutes: -1 };

    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return {
      text: `${hours}h ${minutes}m`,
      isUrgent: totalMinutes < 60,
      isBreached: false,
      minutes: totalMinutes,
    };
  };

  // Urgent SLA watchlist
  const urgentTickets = myActiveTickets
    .map((t) => ({ ...t, slaInfo: getRemainingTime(t.resolution_deadline) }))
    .sort((a, b) => a.slaInfo.minutes - b.slaInfo.minutes)
    .slice(0, 5);

  const criticalUrgentCount = myActiveTickets.filter(
    (t) => t.priority === 'critical' || getRemainingTime(t.resolution_deadline).isUrgent
  ).length;

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Agent Support Workspace
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Cockpit
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time incident queue, SLA monitoring watchlist, and workload capacity.
          </p>
        </div>

        <button
          onClick={() => navigate('/assigned-tickets')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
        >
          <span>Open Assigned Tickets Queue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Active Workload"
          value={myActiveTickets.length}
          subtitle="Max Capacity: 5 tickets"
          icon={Ticket}
          badge={{ text: `${myActiveTickets.length}/5 Capacity`, positive: myActiveTickets.length < 5 }}
        />
        <StatCard
          title="SLA Urgent"
          value={criticalUrgentCount}
          subtitle="Imminent resolution deadlines"
          icon={AlertTriangle}
          badge={{ text: criticalUrgentCount > 0 ? 'Requires Action' : 'All Nominal', positive: criticalUrgentCount === 0 }}
        />
        <StatCard
          title="Awaiting Confirmation"
          value={awaitingConfirmationTickets.length}
          subtitle="Customer verification"
          icon={Clock}
        />
        <StatCard
          title="Resolved Records"
          value={resolvedTodayTickets.length}
          subtitle="SLA compliant delivery"
          icon={CheckCircle}
          badge={{ text: '100% Target', positive: true }}
        />
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Urgent SLA Watchlist (Left 7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                Priority SLA Watchlist
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Sorted by closest deadline
            </span>
          </div>

          {urgentTickets.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-slate-700">No active tickets pending in your queue!</p>
              <p className="text-[11px] text-slate-400 mt-1">You are all caught up with your support obligations.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {urgentTickets.map((t) => {
                const sla = t.slaInfo;
                return (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/assigned-tickets?ticket=${t.ticket_number}`)}
                    className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600">
                          {t.ticket_number}
                        </span>
                        <PriorityBadge priority={t.priority} />
                        <StatusBadge status={t.status} />
                      </div>
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {t.subject}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Category: <span className="text-slate-600">{t.category}</span> • Priority:{' '}
                        <span className="text-slate-600 font-medium capitalize">{t.priority}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded inline-block ${
                          sla.isBreached
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : sla.isUrgent
                            ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {sla.text}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Resolution SLA</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
            <button
              onClick={() => navigate('/assigned-tickets')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
            >
              <span>View full ticket queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 5 Columns: Support Team & Capacity Matrix */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Team Workload Distribution */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Layers className="w-4 h-4 text-slate-600" />
              <h2 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                Support Team Dispatches
              </h2>
            </div>

            <div className="space-y-3">
              {teams.slice(0, 5).map((team) => (
                <div key={team.id || team.name} className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-slate-800">{team.name}</span>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      Category: {team.category}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-700">
                    {team.active_workload !== undefined ? `${team.active_workload} active` : 'Active'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SLA Performance Summary Box */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-xl p-5 text-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
                SLA Guarantee Matrix
              </span>
              <Sparkles className="w-4 h-4 text-blue-300" />
            </div>
            <p className="text-2xl font-extrabold text-white tracking-tight">99.8% Compliance</p>
            <p className="text-xs text-blue-200 leading-relaxed">
              Automated deterministic triage prioritizes incident responses in real time according to priority tiers.
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('/assigned-tickets')}
                className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-semibold text-white transition-all text-center"
              >
                Go to Investigation Workbench
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
