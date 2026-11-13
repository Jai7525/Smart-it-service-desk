import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  User,
  Headphones,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  GitBranch,
} from 'lucide-react';

interface RoleOption {
  role: UserRole;
  title: string;
  tagline: string;
  badge: string;
  icon: React.ElementType;
  defaultEmail: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'employee',
    title: 'Employee',
    tagline: 'Submit incidents & track resolution',
    badge: 'Requester',
    icon: User,
    defaultEmail: 'employee.john@smartticket.local',
  },
  {
    role: 'agent',
    title: 'Support Agent',
    tagline: 'Investigate queue & triage SLAs',
    badge: 'Resolver',
    icon: Headphones,
    defaultEmail: 'agent.network@smartticket.local',
  },
  {
    role: 'manager',
    title: 'IT Manager',
    tagline: 'Supervise SLAs, alerts & RCA',
    badge: 'Operations',
    icon: BarChart3,
    defaultEmail: 'manager@smartticket.local',
  },
  {
    role: 'admin',
    title: 'System Admin',
    tagline: 'Policy engine & team topology',
    badge: 'Governance',
    icon: ShieldCheck,
    defaultEmail: 'admin@smartticket.local',
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, availableUsers } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('employee');
  const [email, setEmail] = useState('employee.john@smartticket.local');
  const [password, setPassword] = useState('password123');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectRole = (option: RoleOption) => {
    setSelectedRole(option.role);
    setErrorMessage('');

    const match = availableUsers.find(
      (u) => u.role.toLowerCase() === option.role.toLowerCase()
    );

    if (match) {
      setEmail(match.email);
    } else {
      setEmail(option.defaultEmail);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await login(email, selectedRole);
      if (selectedRole === 'agent') {
        navigate('/assigned-tickets');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const activeOption = ROLE_OPTIONS.find((r) => r.role === selectedRole) || ROLE_OPTIONS[0];

  return (
    <div className="min-h-screen w-full bg-slate-100/80 flex items-center justify-center p-4 sm:p-6 lg:p-10 antialiased font-sans">
      <div className="w-full max-w-[1060px] bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: PREMIUM EXECUTIVE NAVY CANVAS */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#0F172A] via-[#111827] to-[#0A0F1D] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
          {/* Subtle architectural ambient light */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-700/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-md ring-1 ring-white/10">
                ST
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white block">
                  SmartTicket
                </span>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                  Unified Service Management
                </span>
              </div>
            </div>

            {/* Title & Category Badge */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-[11px] font-medium tracking-wide">
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span>Enterprise Service Desk</span>
              </div>
              <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-white leading-snug">
                Intelligent IT Incident & Workflow Automation
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                A unified service platform that centralises IT support, automates triage, balances agent workload, and monitors service level commitments.
              </p>
            </div>

            {/* Feature Capability Cards */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
                <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-slate-100">Automated Triage Pipeline</h2>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Rule-based classification and deterministic 3×3 priority calculation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
                <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-slate-100">SLA Watchdog Daemon</h2>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Real-time deadline tracking with automated manager escalation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
                <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 shrink-0 mt-0.5">
                  <GitBranch className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-slate-100">Incident Correlation & RCA</h2>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Rolling-window cluster detection to prevent recurring outages.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Assurance */}
          <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Supabase PostgreSQL Backed
            </span>
            <span className="font-mono text-[10px] text-slate-500">v1.0 Production</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: CLEAN ENTERPRISE ACCESS TERMINAL (WHITE THEME) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 bg-white p-8 sm:p-10 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Select Your Access Role
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose an operational role to enter your personalized dashboard.
              </p>
            </div>

            {/* 4 Role Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedRole === opt.role;

                return (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => handleSelectRole(opt)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`p-2 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4 stroke-[2]" />
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-medium ${
                          isSelected
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">
                          {opt.title}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {opt.tagline}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-800">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-800">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Remember active workstation</span>
                </label>
                <span className="text-[11px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                  Self-service recovery
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>
                  {isLoading ? 'Authenticating...' : `Sign In to ${activeOption.title} Portal`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Bottom Security Footer */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Unified Service Desk Access</span>
            <span className="font-mono">Supabase Auth Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
