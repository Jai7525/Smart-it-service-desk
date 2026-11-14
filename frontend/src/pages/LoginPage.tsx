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
    <div className="min-h-screen w-full bg-[#3B82F6] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans">
      {/* Outer Grand Card Filling Screen Elegantly */}
      <div className="w-full max-w-[1140px] min-h-[640px] bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border-4 border-white/20">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: CRISP WHITE ILLUSTRATION SECTION                             */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 bg-white p-8 sm:p-12 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100 relative">
          
          {/* Brand & Headline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#3B82F6] flex items-center justify-center font-bold text-white text-xs shadow-sm">
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
        {/* RIGHT COLUMN: BALANCED MEDIUM BLUE SIGN-IN AREA                           */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 bg-[#3B82F6] p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white relative">
          
          <div className="max-w-md w-full mx-auto my-auto space-y-7">
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Welcome back
              </h2>
              <p className="text-sm text-blue-100 mt-1.5 font-normal">
                Sign in to the SmartTicket application
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-500/20 border border-rose-300/40 rounded-xl p-3.5 text-xs text-rose-100 flex items-start gap-2.5 backdrop-blur-sm animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-200 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <div className="relative">
                  <Mail className="w-4 h-4 text-blue-200 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Work Email"
                    className="w-full bg-blue-600/50 border border-blue-300/40 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-blue-100 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white focus:bg-blue-600/70 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-blue-100 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-blue-300 bg-blue-600/50 text-white focus:ring-0 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <span className="text-blue-100 hover:text-white cursor-pointer font-medium underline-offset-2 hover:underline">
                  Need help?
                </span>
              </div>

              {/* High-Contrast White Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-2 bg-white hover:bg-slate-50 disabled:opacity-60 text-[#2563EB] rounded-xl text-sm font-bold shadow-lg shadow-blue-900/15 flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
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
            <div className="pt-6 border-t border-blue-400/30 space-y-2.5">
              <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider block text-center">
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
                        ? 'bg-white text-[#2563EB] border-white shadow-sm'
                        : 'bg-blue-600/40 hover:bg-blue-600/70 text-white border-blue-300/30'
                    }`}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clean Terms Link */}
          <div className="pt-6 border-t border-blue-400/30 text-center text-[11px] text-blue-100 leading-relaxed max-w-sm mx-auto">
            By signing in, you agree to the SmartTicket Terms of Service and Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
};
