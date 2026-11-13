import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  change_type: string;
  risk_level: string;
  status: string;
  affected_service: string;
  owner: string;
}

export const ChangeCalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    fetchCalendar();
  }, []);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const data = await api.changes.getCalendar();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load change calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Enterprise IT Change Calendar
          </h1>
          <p className="text-xs text-slate-500">
            Visual implementation schedule, blackout windows, and deployment collisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-xs font-medium">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
            Active Schedule Horizon: 30 Days
          </span>
        </div>
      </div>

      {/* Calendar List & Scheduled Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Schedule Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Upcoming Change Execution Windows
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {events.length} Scheduled
              </span>
            </div>

            {loading ? (
              <div className="text-center py-16 text-slate-400 text-xs">Loading schedule...</div>
            ) : events.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                No planned maintenance or change windows on record.
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-400 cursor-pointer transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-900 block">{ev.title}</span>
                        <span className="text-[11px] text-slate-500">
                          Target Service: <span className="font-medium text-slate-700">{ev.affected_service}</span>
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          ev.risk_level === 'critical'
                            ? 'bg-rose-100 text-rose-800'
                            : ev.risk_level === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {ev.risk_level} risk
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(ev.start).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} - {new Date(ev.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-slate-600 font-medium">Owner: {ev.owner}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Event Detail / Policy Inspector */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Change Policy & Freeze Status
            </h2>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-xs space-y-1">
              <span className="font-bold block">Production Change Windows Open</span>
              <p className="text-[11px] leading-relaxed">
                Standard maintenance windows run Tuesday & Thursday 01:00 - 05:00 UTC. Emergency RFCs require CAB quorum.
              </p>
            </div>

            {selectedEvent ? (
              <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Selected Event</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{selectedEvent.title}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Execution Horizon</span>
                  <span className="font-mono text-slate-700 block mt-0.5">
                    {new Date(selectedEvent.start).toLocaleString()} to {new Date(selectedEvent.end).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Change Classification</span>
                  <span className="capitalize font-semibold text-slate-800 block mt-0.5">{selectedEvent.change_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Owner</span>
                  <span className="font-medium text-slate-800 block mt-0.5">{selectedEvent.owner}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Select any scheduled change from the list to inspect deployment parameters and rollback provisions.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

