import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  CheckCircle2,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Layers,
  Clock,
  GitBranch,
  Building,
  User,
  Headphones,
  BarChart3,
  KeyRound,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Quick demonstration personas
  const demoAccounts = [
    { label: 'Admin', email: 'admin@smartticket.local', role: 'System Admin', icon: ShieldCheck },
    { label: 'Manager', email: 'manager@smartticket.local', role: 'IT Manager', icon: BarChart3 },
    { label: 'Agent', email: 'agent.network@smartticket.local', role: 'Network Agent', icon: Headphones },
    { label: 'Employee', email: 'employee.john@smartticket.local', role: 'Employee', icon: User },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your work email address.');
      return;
    }

    setIsLoading(true);

    try {
      const loggedUser = await login(cleanEmail);

      // Route dynamically to the role's assigned workspace
      switch (loggedUser.role) {
        case 'agent':
          navigate('/assigned-tickets');
          break;
        case 'manager':
        case 'admin':
        case 'employee':
        default:
          navigate('/');
          break;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full bg-slate-100/80 flex items-center justify-center p-4 sm:p-6 lg:p-10 antialiased font-sans">
      <div className="w-full max-w-[1000px] bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: EXECUTIVE BRANDING CANVAS */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#0F172A] via-[#111827] to-[#0A0F1D] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
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

            {/* Title & Badge */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-[11px] font-medium tracking-wide">
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span>Enterprise Service Desk</span>
              </div>
              <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-white leading-snug">
                Intelligent IT Incident & Workflow Automation
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                A unified service platform that centralizes IT support, automates incident triage, balances agent workload, and monitors service level commitments in real time.
              </p>
            </div>

            {/* Feature Capability List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
                <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-slate-100">Automated Triage Pipeline</h2>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Category routing and deterministic 3x3 priority scoring.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
                <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 shrink-0 mt-0.5">
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
                <div className="p-1.5 rounded-lg bg-teal-600/20 text-teal-400 shrink-0 mt-0.5">
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
        {/* RIGHT COLUMN: SINGLE PROFESSIONAL EMAIL SIGN-IN */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 bg-white p-8 sm:p-12 flex flex-col justify-between">
          <div className="space-y-8 max-w-md mx-auto w-full pt-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 mb-3">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Single Sign-On Access</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your work email address to automatically load your role and personalized workspace.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Single Clean Email Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-800">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., employee.john@smartticket.local or newagent@company.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-mono"
                  />
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Enter any registered employee, agent, manager, or admin email.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>{isLoading ? 'Verifying Identity...' : 'Continue to Workspace'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick Demonstration Fillers */}
            <div className="pt-6 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2.5">
                Quick Demonstration Accounts:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((acc) => {
                  const Icon = acc.icon;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleQuickFill(acc.email)}
                      className="text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-xs group"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                        <span className="font-semibold text-slate-800 group-hover:text-blue-700">
                          {acc.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono truncate block mt-0.5">
                        {acc.email}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Identity-Verified Access</span>
            <span className="font-mono">Direct PostgreSQL Resolution</span>
          </div>
        </div>
      </div>
    </div>
  );
};
