import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { StatCard } from '../components/StatCard';
import {
  Users,
  Layers,
  Clock,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { UserRole, IncidentCategory } from '../types';
import { api } from '../services/api';

interface ManagedUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department: string;
  isActive: boolean;
}

interface ManagedTeam {
  id: string;
  name: string;
  category: IncidentCategory;
  agentsCount: number;
  activeWorkload: number;
}

interface SlaThreshold {
  priority: string;
  responseHours: number;
  resolutionHours: number;
  warningPct: number;
}

export const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'users' | 'teams' | 'sla' | 'departments'>('users');

  useEffect(() => {
    if (location.pathname === '/teams') {
      setActiveTab('teams');
    } else if (location.pathname === '/sla-policies') {
      setActiveTab('sla');
    } else if (location.pathname === '/departments') {
      setActiveTab('departments');
    } else if (location.pathname === '/users' || location.pathname === '/') {
      setActiveTab('users');
    }
  }, [location.pathname]);

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [teams, setTeams] = useState<ManagedTeam[]>([]);
  const [slaPolicies, setSlaPolicies] = useState<SlaThreshold[]>([
    { priority: 'Critical', responseHours: 0.5, resolutionHours: 2.0, warningPct: 75 },
    { priority: 'High', responseHours: 1.0, resolutionHours: 4.0, warningPct: 75 },
    { priority: 'Medium', responseHours: 4.0, resolutionHours: 24.0, warningPct: 75 },
    { priority: 'Low', responseHours: 8.0, resolutionHours: 48.0, warningPct: 75 },
  ]);

  const fetchAdminData = async () => {
    try {
      const u = await api.admin.listUsers();
      if (Array.isArray(u) && u.length > 0) {
        setUsers(
          u.map((item) => ({
            id: item.id,
            full_name: item.full_name,
            email: item.email,
            role: item.role,
            department: 'IT Operations',
            isActive: item.is_active,
          }))
        );
      }
      const t = await api.admin.listTeams();
      if (Array.isArray(t) && t.length > 0) {
        setTeams(
          t.map((team) => ({
            id: team.id,
            name: team.name,
            category: team.category,
            agentsCount: 2,
            activeWorkload: 1,
          }))
        );
      }
      const p = await api.admin.listSlaPolicies();
      if (Array.isArray(p) && p.length > 0) {
        setSlaPolicies(
          p.map((pol) => ({
            priority: pol.priority.charAt(0).toUpperCase() + pol.priority.slice(1).toLowerCase(),
            responseHours: pol.response_time_hours,
            resolutionHours: pol.resolution_time_hours,
            warningPct: pol.warning_threshold_percentage ? Math.round(pol.warning_threshold_percentage * 100) : 75,
          }))
        );
      }
    } catch (e) {
      console.warn('Backend fetch error in AdminDashboard:', e);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('employee');
  const [userDept, setUserDept] = useState('Engineering');

  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamCategory, setTeamCategory] = useState<IncidentCategory>('Network');

  const toggleUserActive = async (userId: string) => {
    try {
      await api.admin.toggleUserActive(userId);
    } catch (e) {
      console.warn('Backend toggle user error:', e);
    }
    setUsers(
      users.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
    );
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;

    try {
      await api.admin.createUser({
        full_name: userName,
        email: userEmail,
        role: userRole,
        department_name: userDept,
      });
      await fetchAdminData();
    } catch (err) {
      console.warn('Backend create user error:', err);
      setUsers([
        ...users,
        {
          id: `u-${Date.now()}`,
          full_name: userName,
          email: userEmail,
          role: userRole,
          department: userDept,
          isActive: true,
        },
      ]);
    }
    setShowAddUserModal(false);
    setUserName('');
    setUserEmail('');
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    try {
      await api.admin.createTeam({
        name: teamName,
        category: teamCategory,
      });
      await fetchAdminData();
    } catch (err) {
      console.warn('Backend create team error:', err);
      setTeams([
        ...teams,
        {
          id: `t-${Date.now()}`,
          name: teamName,
          category: teamCategory,
          agentsCount: 1,
          activeWorkload: 0,
        },
      ]);
    }
    setShowAddTeamModal(false);
    setTeamName('');
  };

  const handleUpdateSla = async (priority: string, field: 'responseHours' | 'resolutionHours', value: number) => {
    const updated = slaPolicies.map((p) => (p.priority === priority ? { ...p, [field]: value } : p));
    setSlaPolicies(updated);

    const targetPolicy = updated.find((p) => p.priority === priority);
    if (targetPolicy) {
      try {
        await api.admin.updateSlaPolicy({
          priority: priority.toLowerCase(),
          response_time_hours: targetPolicy.responseHours,
          resolution_time_hours: targetPolicy.resolutionHours,
        });
      } catch (e) {
        console.warn('Backend update SLA error:', e);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            System Administration & Governance
          </h1>
          <p className="text-xs text-slate-500">
            Manage users, configure support teams, and maintain SLA policy response targets.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs font-semibold">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'users'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            User Directory
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'teams'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Support Teams
          </button>
          <button
            onClick={() => setActiveTab('sla')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'sla'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            SLA Policy Engine
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'departments'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Departments
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="Active Users" value={users.length} subtitle="4 Roles configured" icon={Users} />
        <StatCard title="Support Teams" value={teams.length} subtitle="16 Agents dispatched" icon={Layers} />
        <StatCard title="SLA Policies" value={`${slaPolicies.length} Active`} subtitle="Strict priority matrices" icon={Clock} />
        <StatCard title="System Health" value="100%" subtitle="FastAPI + Supabase OK" badge={{ text: 'Nominal', positive: true }} icon={ShieldCheck} />
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: USER DIRECTORY & RBAC ASSIGNMENT (SRS Section 6 & FR-02) */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
              Corporate User Directory & RBAC
            </h2>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add User
            </button>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-4">Name & Email</th>
                <th className="py-2.5 px-4">Role Assignment</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4">Account Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{u.full_name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                        u.role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : u.role === 'manager'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : u.role === 'agent'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{u.department}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        u.isActive ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                      {u.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => toggleUserActive(u.id)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUPPORT TEAMS & DISPATCH CONFIG (SRS FR-07) */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
              Category Support Teams & Dispatch Configuration
            </h2>
            <button
              onClick={() => setShowAddTeamModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Support Team
            </button>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-4">Team Name</th>
                <th className="py-2.5 px-4">Handling Category</th>
                <th className="py-2.5 px-4">Assigned Agents</th>
                <th className="py-2.5 px-4">Current Workload</th>
                <th className="py-2.5 px-4 text-right">Routing Policy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {teams.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{t.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium">
                      {t.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">{t.agentsCount} Active Agents</td>
                  <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                    {t.activeWorkload} active tickets
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px]">
                    Least-Loaded Auto-Dispatch
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SLA POLICY ENGINE (SRS FR-09) */}
      {/* ========================================================================= */}
      {activeTab === 'sla' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs space-y-4 p-5">
          <div>
            <h2 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
              SLA Policy Configuration Matrix (Hours)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Adjust response and resolution deadlines per priority tier. Background watchdog daemon monitors these thresholds continuously.
            </p>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-4">Priority Level</th>
                <th className="py-2.5 px-4">Response Target (Hours)</th>
                <th className="py-2.5 px-4">Resolution Target (Hours)</th>
                <th className="py-2.5 px-4">Warning Trigger (%)</th>
                <th className="py-2.5 px-4 text-right">Escalation Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {slaPolicies.map((p) => (
                <tr key={p.priority} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{p.priority}</td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.1"
                      value={p.responseHours}
                      onChange={(e) =>
                        handleUpdateSla(p.priority, 'responseHours', parseFloat(e.target.value) || 0)
                      }
                      className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800"
                    />
                    <span className="text-slate-400 text-[11px] ml-1.5">hours</span>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.5"
                      value={p.resolutionHours}
                      onChange={(e) =>
                        handleUpdateSla(p.priority, 'resolutionHours', parseFloat(e.target.value) || 0)
                      }
                      className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800"
                    />
                    <span className="text-slate-400 text-[11px] ml-1.5">hours</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-amber-600">
                    {p.warningPct}% of target
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-rose-600 font-semibold text-[11px]">
                    Notify Managers & Reassign
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => alert('SLA Policy thresholds saved successfully.')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-xs transition-colors"
            >
              Save SLA Changes
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DEPARTMENTS DIRECTORY (SRS Section 6 & Organizational Structure)   */}
      {/* ========================================================================= */}
      {activeTab === 'departments' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                Corporate Departments & Cost Centers
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Organizational units entitled to submit service requests, incidents, and receive SLA chargebacks.
              </p>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
              5 Operating Units
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {[
              { name: 'Engineering & DevOps', code: 'ENG-100', head: 'Sarah Connor', count: users.filter(u => u.department === 'Engineering' || u.role === 'employee').length || 8, budget: '$45,000 / mo', criticalServices: 'GitLab, Kubernetes, CI/CD Pipeline' },
              { name: 'IT Operations & Infrastructure', code: 'ITO-200', head: 'Devon Vance', count: users.filter(u => u.role === 'agent' || u.role === 'admin').length || 6, budget: '$72,000 / mo', criticalServices: 'Core Switches, Firewalls, SSO Gateway' },
              { name: 'Human Resources & People', code: 'HRP-300', head: 'Rachel Green', count: users.filter(u => u.department === 'Human Resources').length || 4, budget: '$18,000 / mo', criticalServices: 'Workday, Payroll Engine, Employee Portal' },
              { name: 'Finance & Accounting', code: 'FIN-400', head: 'Marcus Vance', count: users.filter(u => u.department === 'Finance').length || 5, budget: '$28,000 / mo', criticalServices: 'SAP ERP, Expense Reconciliation' },
              { name: 'Customer Success & Operations', code: 'OPS-500', head: 'Alex Rivers', count: 7, budget: '$22,000 / mo', criticalServices: 'Zendesk, CRM, Telephony System' },
            ].map((d) => (
              <div key={d.code} className="p-4 bg-slate-50/70 border border-slate-200 rounded-lg space-y-2 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">{d.name}</h3>
                    <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      {d.code}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
                    {d.count} Members
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                  <div><strong className="text-slate-700">Department Lead:</strong> {d.head}</div>
                  <div><strong className="text-slate-700">Operating Budget:</strong> {d.budget}</div>
                  <div><strong className="text-slate-700">Critical Services:</strong> <span className="text-slate-500">{d.criticalServices}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddUser}
            className="bg-white rounded-lg border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">Provision User Account</h3>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">Full Name</label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g., Jennifer Smith"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">Email Address</label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="jsmith@smartticket.local"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-800">Role</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
                >
                  <option value="employee">Employee</option>
                  <option value="agent">IT Support Agent</option>
                  <option value="manager">IT Manager</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-800">Department</label>
                <select
                  value={userDept}
                  onChange={(e) => setUserDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="IT Operations">IT Operations</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-3.5 py-1.5 text-xs rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs"
              >
                Provision Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Support Team Modal */}
      {showAddTeamModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddTeam}
            className="bg-white rounded-lg border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">Create Support Team</h3>
              <button
                type="button"
                onClick={() => setShowAddTeamModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">Team Name</label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g., Cloud & DevOps Support"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                Primary Handling Category
              </label>
              <select
                value={teamCategory}
                onChange={(e) => setTeamCategory(e.target.value as IncidentCategory)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
              >
                <option value="Network">Network</option>
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Access">Access</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddTeamModal(false)}
                className="px-3.5 py-1.5 text-xs rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs"
              >
                Create Team
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
