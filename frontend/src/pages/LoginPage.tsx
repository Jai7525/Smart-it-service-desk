import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import loginEcosystem from '../assets/login-3d-ecosystem.png';
import brandLogo from '../assets/logo.png';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('alex.morgan@enterprise.corp');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Quick demonstration accounts mapped to actual backend credentials & matching design tags
  const demoAccounts = [
    { label: 'Admin', tag: 'sys', dotColor: 'bg-amber-400', email: 'admin@smartticket.local' },
    { label: 'Manager', tag: 'lead', dotColor: 'bg-cyan-300', email: 'manager@smartticket.local' },
    { label: 'Agent', tag: 'tier-2', dotColor: 'bg-emerald-400', email: 'agent.network@smartticket.local' },
    { label: 'Employee', tag: 'staff', dotColor: 'bg-purple-300', email: 'employee.john@smartticket.local' },
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
    <main className="w-full min-h-screen flex flex-col lg:flex-row flex-1 bg-slate-50 antialiased font-sans select-none selection:bg-[#1E56F0] selection:text-white">
      {/* ========================================================================= */}
      {/* LEFT SECTION: Branding & 3D Illustration (54% Width)                      */}
      {/* ========================================================================= */}
      <section
        aria-label="Welcome and illustration"
        className="w-full lg:w-[54%] bg-white flex flex-col justify-between p-8 sm:p-12 lg:p-14 xl:p-16 border-r border-slate-100 relative overflow-hidden"
      >
        {/* Subtle Ambient Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#1E56F0_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.035] pointer-events-none" />

        {/* Top Content: SmartTicket Logo & Header */}
        <div className="relative z-10 space-y-6">
          {/* SmartTicket Custom S-Logo matching design screenshot */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center p-1.5">
              <img
                src={brandLogo}
                alt="SmartTicket Emblem"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                Smart<span className="text-[#1E56F0] font-extrabold">Ticket</span>
              </span>
              <span className="ml-2.5 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-blue-50 text-[#1540CC] rounded-full border border-blue-200/60">
                Enterprise
              </span>
            </div>
          </div>

          {/* Editorial Headings */}
          <div className="max-w-xl pt-2">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-slate-900 tracking-tight leading-[1.18]">
              Your Digital Service Station
            </h1>
            <p className="mt-3 text-base sm:text-lg text-slate-500 font-normal leading-relaxed">
              Welcome to your unified IT support and service desk portal.
            </p>
          </div>
        </div>

        {/* Center 3D Isometric IT Operations Illustration */}
        <div className="relative z-10 my-6 sm:my-8 flex items-center justify-center flex-1">
          <div className="relative w-full max-w-[500px] lg:max-w-[540px] xl:max-w-[560px] group">
            {/* Ambient Glow under illustration */}
            <div className="absolute inset-4 -bottom-6 bg-[#4B68F6]/15 rounded-full blur-2xl transform-gpu -z-10" />

            {/* Pristine 3D Scene Frame */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-200/80 border border-slate-100/90 bg-white">
              <img
                src={loginEcosystem}
                alt="SmartTicket 3D Isometric IT Service Operations Ecosystem"
                className="w-full h-auto object-cover transform transition-transform duration-700 ease-out hover:scale-[1.02]"
                loading="eager"
              />
            </div>

            {/* Micro Floating Badges */}
            <div className="hidden sm:flex absolute -bottom-3 -left-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-slate-100 items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-slate-700">All Systems Operational</span>
              <span className="text-[11px] font-mono font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                99.98%
              </span>
            </div>

            <div className="hidden sm:flex absolute -top-3 -right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-slate-100 items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#1E56F0] flex items-center justify-center">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-slate-800 leading-tight">Smart Routing</p>
                <p className="text-[10px] text-slate-400 leading-tight">Automated AI dispatch</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Tagline & Certifications */}
        <div className="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs sm:text-sm font-medium text-slate-500 tracking-wide flex items-center gap-1 sm:gap-2">
            <span>Fast resolution</span>
            <span className="text-[#1E56F0]">•</span>
            <span>Automated routing</span>
            <span className="text-[#1E56F0]">•</span>
            <span>24/7 SLA tracking</span>
          </p>
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-400 font-normal">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1E56F0]" />
            SOC2 Type II Certified
          </span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* RIGHT SECTION: Vibrant Signature Blue Sign-In Experience (46% Width)      */}
      {/* ========================================================================= */}
      <section
        aria-label="Sign in"
        className="w-full lg:w-[46%] bg-[#1E56F0] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-14 xl:p-16 relative overflow-hidden"
      >
        {/* Background Geometric Curves & Glow */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#4B68F6]/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#1032A3]/60 rounded-full blur-3xl pointer-events-none" />

        {/* Top Subtle Security Badge */}
        <div className="relative z-10 flex justify-end items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] font-medium text-blue-100 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
            <span>End-to-End Encrypted Session</span>
          </div>
        </div>

        {/* Center Container: Login Card */}
        <div className="relative z-10 my-auto py-8 max-w-md w-full mx-auto">
          {/* Header */}
          <div className="text-left mb-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Welcome back
            </h2>
            <p className="mt-2 text-base text-blue-100 font-normal">
              Sign in to the SmartTicket application
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 bg-rose-500/25 border border-rose-300/40 rounded-xl p-3.5 text-xs text-white flex items-start gap-2.5 backdrop-blur-sm">
              <AlertCircle className="w-4 h-4 text-rose-200 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="work-email" className="block text-sm font-semibold tracking-wide text-white">
                Work Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  id="work-email"
                  name="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white text-slate-900 placeholder-slate-400 font-medium rounded-xl text-sm border-2 border-transparent focus:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-blue-400/40 shadow-md transition-all duration-200"
                />
              </div>
            </div>

            {/* Options Row: Remember Me & Need Help? */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded text-[#1E56F0] bg-white border-none focus:ring-offset-[#1E56F0] focus:ring-2 focus:ring-white transition duration-150 cursor-pointer"
                />
                <span className="text-sm font-medium text-blue-100 group-hover:text-white transition-colors">
                  Remember me
                </span>
              </label>

              <button
                type="button"
                onClick={() => alert('For support or credentials reset, contact it-support@smartticket.local')}
                className="text-sm font-medium text-blue-100 hover:text-white underline underline-offset-4 decoration-blue-300/60 hover:decoration-white transition-colors cursor-pointer"
              >
                Need help?
              </button>
            </div>

            {/* Login Now CTA Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-6 rounded-xl font-bold text-[#1540CC] bg-white hover:bg-blue-50 active:bg-blue-100 shadow-lg shadow-[#1032A3]/25 flex items-center justify-center gap-2 group transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#1E56F0]" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Login Now</span>
                  <ArrowRight className="w-4 h-4 text-[#1E56F0] transform transition-transform duration-200 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* DEMO QUICK ACCESS Section */}
          <div className="mt-8 pt-7 border-t border-white/20">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-xs font-bold tracking-wider text-blue-200 uppercase">
                DEMO QUICK ACCESS:
              </span>
              <span className="text-[11px] text-blue-200/80 font-normal">Click role to auto-populate</span>
            </div>

            {/* 4 Demo Role Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => handleQuickFill(acc.email)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-white text-xs font-semibold backdrop-blur-sm transition-all duration-150 group text-left cursor-pointer ${
                    email === acc.email
                      ? 'bg-white/30 border-white shadow-md'
                      : 'bg-white/10 hover:bg-white/20 active:bg-white/25 border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${acc.dotColor}`} />
                    <span>{acc.label}</span>
                  </div>
                  <span className="text-[10px] text-blue-200 opacity-60 group-hover:opacity-100 font-mono">
                    {acc.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Compliance Footer */}
        <div className="relative z-10 pt-4 border-t border-white/15 text-center">
          <p className="text-xs text-blue-100/90 font-normal leading-relaxed">
            By signing in, you agree to the SmartTicket{' '}
            <span className="text-white font-medium underline underline-offset-2 hover:text-cyan-200 cursor-pointer">
              Terms of Service
            </span>{' '}
            and{' '}
            <span className="text-white font-medium underline underline-offset-2 hover:text-cyan-200 cursor-pointer">
              Privacy Policy
            </span>
            .
          </p>
        </div>
      </section>
    </main>
  );
};
