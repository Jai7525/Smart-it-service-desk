import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Quick demonstration accounts for college presentation
  const demoAccounts = [
    { label: 'Admin', email: 'admin@smartticket.local' },
    { label: 'Manager', email: 'manager@smartticket.local' },
    { label: 'Agent', email: 'agent.network@smartticket.local' },
    { label: 'Employee', email: 'employee.john@smartticket.local' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your work email.');
      return;
    }

    setIsLoading(true);

    try {
      const loggedUser = await login(cleanEmail);

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
      setErrorMessage(err.message || 'Authentication failed. Please check your email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full bg-slate-100/90 flex items-center justify-center p-4 sm:p-6 lg:p-8 antialiased font-sans">
      <div className="w-full max-w-[960px] bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: BRAND & VISUAL DASHBOARD MOCKUP (CLEAN, HUMAN, NO AI JARGON) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0A0F1D] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                ST
              </div>
              <span className="font-bold text-base tracking-tight text-white">SmartTicket</span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                Your team's IT service desk, all in one place.
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Report incidents, track SLA commitments, and resolve requests faster with automated routing.
              </p>
            </div>
          </div>

          {/* Center Visual Mockup Card */}
          <div className="relative z-10 my-6 bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 shadow-lg backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-200">Network Incident Queue</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">Live</span>
            </div>

            <div className="space-y-2">
              <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-100">INC-1025 • Gateway VPN Timeout</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Assigned to Network Operations</div>
                </div>
                <span className="text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded">
                  Critical
                </span>
              </div>

              <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-100">INC-1028 • Switch Port Latency</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">SLA response met in 12m</div>
                </div>
                <span className="text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">
                  Resolved
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Human Tagline */}
          <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Built for modern IT support teams</span>
            <span className="font-mono text-[10px] text-slate-500">v1.0</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: CLEAN & MINIMAL SIGN-IN (NO ROBOT JARGON) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 bg-white p-8 sm:p-12 flex flex-col justify-between">
          <div className="max-w-sm mx-auto w-full space-y-6 pt-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in</h1>
              <p className="text-xs text-slate-500 mt-1">
                Enter your work email address to continue to your workspace.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Clean Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Work email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Continue with Email</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Subtle Demo Quick Sign-in */}
            <div className="pt-6 border-t border-slate-100">
              <span className="text-[11px] font-medium text-slate-400 block mb-2.5 text-center">
                Demo quick sign-in:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.label}
                    type="button"
                    onClick={() => handleQuickFill(acc.email)}
                    className={`py-1.5 px-2 rounded-md text-[11px] font-semibold border transition-all cursor-pointer text-center ${
                      email === acc.email
                        ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-400/20'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Human Standard Footer */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>© 2026 SmartTicket</span>
            <div className="flex items-center gap-3">
              <span className="hover:text-slate-600 cursor-pointer">Help & Support</span>
              <span>•</span>
              <span className="hover:text-slate-600 cursor-pointer">Privacy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
