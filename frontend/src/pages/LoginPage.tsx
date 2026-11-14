import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Headphones,
} from 'lucide-react';
import loginIllustration from '../assets/login-illustration.svg';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Quick demonstration accounts
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
    <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans">
      {/* Outer Grand Card Filling Screen Elegantly */}
      <div className="w-full max-w-[1140px] min-h-[640px] bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200/80">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: CRISP WHITE ILLUSTRATION SECTION                             */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 bg-white p-8 sm:p-12 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100 relative">
          
          {/* Brand & Headline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                ST
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900">SmartTicket</span>
            </div>

            <div className="pt-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Your Digital Service Station
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Welcome to your unified IT support and service desk portal.
              </p>
            </div>
          </div>

          {/* Handcrafted Editorial Cartoon Illustration */}
          <div className="my-auto py-4 flex items-center justify-center">
            <div className="w-full max-w-[440px] flex items-center justify-center transform hover:scale-[1.01] transition-transform duration-300">
              <img
                src={loginIllustration}
                alt="IT Support Service Desk"
                className="w-full h-auto object-contain drop-shadow-sm select-none"
              />
            </div>
          </div>

          {/* Simple Clean Tagline */}
          <div className="text-xs text-slate-400 font-medium">
            Fast resolution • Automated routing • 24/7 SLA tracking
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: REFINED MINIMAL SOFT-BLUE SIGN-IN PANEL                     */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 bg-slate-50/70 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative">
          
          <div className="max-w-md w-full mx-auto my-auto space-y-7">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Welcome back
              </h2>
              <p className="text-sm text-slate-500 mt-1.5 font-normal">
                Sign in to the SmartTicket application
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-700 flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Work Email"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium shadow-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <span className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium underline-offset-2 hover:underline">
                  Need help?
                </span>
              </div>

              {/* Minimal Clean Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/15 flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Login Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demonstration Persona Switcher */}
            <div className="pt-6 border-t border-slate-200 space-y-2.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block text-center">
                Demo Quick Access:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.label}
                    type="button"
                    onClick={() => handleQuickFill(acc.email)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                      email === acc.email
                        ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-sm'
                    }`}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clean Terms Link */}
          <div className="pt-6 border-t border-slate-200 text-center text-[11px] text-slate-400 leading-relaxed max-w-sm mx-auto">
            By signing in, you agree to the SmartTicket Terms of Service and Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
};
