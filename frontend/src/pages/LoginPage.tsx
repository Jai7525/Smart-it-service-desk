import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Quick demonstration pills
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
    <div className="min-h-screen w-full bg-[#0B0F19] flex flex-col justify-between items-center p-4 sm:p-6 antialiased font-sans relative overflow-hidden">
      {/* Subtle modern ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-purple-600/20 via-violet-500/15 to-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top spacer */}
      <div className="pt-8" />

      {/* Centered Modern Card Container */}
      <div className="w-full max-w-[420px] relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] shadow-lg shadow-purple-500/25 ring-1 ring-white/20 mb-1">
            <span className="font-bold text-white text-base tracking-wider font-mono">ST</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">SmartTicket</h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Enterprise IT Service Management & Automation
            </p>
          </div>
        </div>

        {/* White Clean Surface Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl p-7 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your registered email to access your workspace.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying identity...</span>
                </>
              ) : (
                <>
                  <span>Continue to Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Demo Quick-Fill Section */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2.5 text-center">
              Demonstration Quick Access
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => handleQuickFill(acc.email)}
                  className={`py-1.5 px-2 rounded-md text-[11px] font-semibold border transition-all cursor-pointer text-center ${
                    email === acc.email
                      ? 'bg-purple-50 text-purple-700 border-purple-300 ring-1 ring-purple-400/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                  }`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-8 pt-4 relative z-10 flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5 text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Supabase PostgreSQL Backed
        </span>
        <span className="text-slate-700">•</span>
        <span className="font-mono text-[11px] text-slate-500">v1.0 Production</span>
      </div>
    </div>
  );
};
