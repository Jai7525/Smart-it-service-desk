import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImpactLevel, UrgencyLevel } from '../types';
import { api } from '../services/api';
import { ArrowLeft, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export const CreateIncidentPage: React.FC = () => {
  const navigate = useNavigate();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState<ImpactLevel>('medium');
  const [urgency, setUrgency] = useState<UrgencyLevel>('medium');
  const [location, setLocation] = useState('Building A, Floor 2');
  const [department, setDepartment] = useState('Engineering');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<any>(null);

  // Real-time keyword category prediction preview
  const predictCategory = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.match(/\b(wifi|wi-fi|vpn|network|internet|lan|dns)\b/)) return 'Network';
    if (lower.match(/\b(laptop|keyboard|mouse|monitor|screen|printer)\b/)) return 'Hardware';
    if (lower.match(/\b(software|excel|outlook|crash|bug|freeze|install)\b/)) return 'Software';
    if (lower.match(/\b(password|login|access|unlock|mfa|2fa)\b/)) return 'Access';
    return 'General';
  };

  const previewCategory = predictCategory(`${subject} ${description}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = await api.incidents.create({
        subject,
        description,
        impact,
        urgency,
        location,
      });
      setSubmittedTicket(data);
    } catch (err: any) {
      alert(`Incident submission error: ${err.message || 'Please check connection'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Report Technical Incident
            </h1>
            <p className="text-xs text-slate-500">
              Fill in details below. The triage engine will automatically classify and dispatch your ticket.
            </p>
          </div>
        </div>
      </div>

      {submittedTicket ? (
        /* Submission Success Confirmation */
        <div className="bg-white border border-emerald-200 rounded-lg p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-3 text-emerald-600">
            <CheckCircle2 className="w-6 h-6 stroke-[2]" />
            <h2 className="text-base font-semibold text-slate-900">
              Incident Logged Successfully
            </h2>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block uppercase text-[10px]">Ticket Number</span>
              <span className="font-mono font-bold text-blue-600 text-sm">
                {submittedTicket.ticket_number}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase text-[10px]">Auto Category</span>
              <span className="font-semibold text-slate-800">{submittedTicket.category}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase text-[10px]">Calculated Priority</span>
              <span className="font-semibold capitalize text-rose-600">
                {submittedTicket.priority}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase text-[10px]">Initial Status</span>
              <span className="font-semibold capitalize text-slate-800">
                {submittedTicket.status}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setSubmittedTicket(null);
                setSubject('');
                setDescription('');
              }}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded border border-slate-200"
            >
              Report Another Issue
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
            >
              View in Dashboard
            </button>
          </div>
        </div>
      ) : (
        /* Incident Submission Form */
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 space-y-5 shadow-xs">
          {/* Subject */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Incident Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., VPN drops continuously after 10 minutes on Wi-Fi"
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Incident Description & Steps to Reproduce <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details, error messages, and what you were doing when the issue occurred..."
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Real-time Triage Classification Peek */}
          <div className="bg-slate-50 border border-slate-200/80 rounded p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Automated Classification Engine:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Detected Category:</span>
              <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                {previewCategory}
              </span>
            </div>
          </div>

          {/* 2-Column Impact & Urgency Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">
                Business Impact
              </label>
              <select
                value={impact}
                onChange={(e) => setImpact(e.target.value as ImpactLevel)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              >
                <option value="high">High - Entire team or business service blocked</option>
                <option value="medium">Medium - Multiple employees impacted</option>
                <option value="low">Low - Single employee or cosmetic inconvenience</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">
                Urgency Level
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              >
                <option value="high">High - Immediate attention needed</option>
                <option value="medium">Medium - Resolution needed within normal window</option>
                <option value="low">Low - Flexible timeline</option>
              </select>
            </div>
          </div>

          {/* Location & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">
                Physical Location / Office
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Building A, Floor 2, Desk 204"
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              >
                <option value="Engineering">Engineering & Tech</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance & Operations</option>
                <option value="Marketing">Sales & Marketing</option>
              </select>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded shadow-xs transition-colors"
            >
              {isSubmitting ? 'Dispatching...' : 'Submit Incident'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

