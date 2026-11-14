import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Bell,
  Shield,
  ChevronDown,
  Check,
  LogOut,
  CheckCheck,
  Clock,
  ArrowRight,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  FileText,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { NotificationItem, Incident } from '../types';

export const TopNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Incident[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [allTickets, setAllTickets] = useState<Incident[]>([]);

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const data = await api.notifications.list(false);
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    } catch (e) {
      console.warn('Could not load notifications:', e);
    }
  };

  // Fetch tickets for fast global search
  const fetchTicketsForSearch = async () => {
    try {
      const data = await api.incidents.list();
      if (Array.isArray(data)) {
        setAllTickets(data);
      }
    } catch (e) {
      console.warn('Could not load tickets for search:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchTicketsForSearch();

    // Poll notifications every 30s
    const timer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(timer);
  }, [user]);

  // Handle global search input
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    const lower = q.toLowerCase();
    const results = allTickets.filter(
      (t) =>
        t.ticket_number.toLowerCase().includes(lower) ||
        t.subject.toLowerCase().includes(lower) ||
        (t.assigned_agent_name && t.assigned_agent_name.toLowerCase().includes(lower)) ||
        (t.category && t.category.toLowerCase().includes(lower)) ||
        (t.description && t.description.toLowerCase().includes(lower))
    );

    setSearchResults(results.slice(0, 8));
    setSearchOpen(true);
  };

  // Handle outside click for popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.notifications.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = (n: NotificationItem) => {
    // Automatically mark as read if unread
    if (!n.is_read) {
      api.notifications.markAsRead(n.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setNotificationsOpen(false);

    // Deep link based on ticket number or type
    const fullText = `${n.title} ${n.message}`;
    const incMatch = fullText.match(/INC-[A-Z0-9-]+/i);
    const reqMatch = fullText.match(/REQ-[0-9]+/i);
    const chgMatch = fullText.match(/CHG-[0-9]+/i);

    if (incMatch) {
      const ticketNum = incMatch[0];
      if (user?.role === 'agent') {
        navigate(`/assigned-tickets?ticket=${encodeURIComponent(ticketNum)}`, {
          state: { ticketNumber: ticketNum },
        });
      } else {
        navigate(`/tickets?ticket=${encodeURIComponent(ticketNum)}`, {
          state: { ticketNumber: ticketNum },
        });
      }
    } else if (reqMatch) {
      if (user?.role === 'manager' || user?.role === 'admin') {
        navigate('/approvals');
      } else {
        navigate('/my-requests');
      }
    } else if (chgMatch) {
      navigate('/changes');
    } else if (n.type === 'sla_warning' || n.type === 'sla_breach') {
      if (user?.role === 'agent') {
        navigate('/assigned-tickets');
      } else {
        navigate('/tickets');
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sla_breach':
      case 'major_alert':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
      case 'sla_warning':
        return <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case 'assignment':
        return <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case 'status_update':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20">
      {/* Global Search Bar */}
      <div ref={searchRef} className="relative flex items-center gap-2 max-w-md w-full">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim()) setSearchOpen(true);
            }}
            placeholder="Search tickets by ID, keyword, or assignee..."
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Global Search Results Dropdown */}
        {searchOpen && (
          <div className="absolute top-10 left-0 w-full bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden z-50 divide-y divide-slate-100">
            <div className="px-3 py-2 bg-slate-50 text-[11px] font-semibold text-slate-500 flex justify-between items-center">
              <span>Matching Tickets ({searchResults.length})</span>
              <span className="text-[10px] text-slate-400">Esc to close</span>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No tickets matched "{searchQuery}"
                </div>
              ) : (
                searchResults.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                      if (user.role === 'agent') {
                        navigate(`/assigned-tickets?ticket=${encodeURIComponent(t.ticket_number)}`, {
                          state: { ticketNumber: t.ticket_number },
                        });
                      } else {
                        navigate(`/tickets?ticket=${encodeURIComponent(t.ticket_number)}`, {
                          state: { ticketNumber: t.ticket_number },
                        });
                      }
                    }}
                    className="p-2.5 hover:bg-blue-50/60 cursor-pointer transition-colors text-xs flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 text-[11px]">
                          {t.ticket_number}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase font-semibold">
                          {t.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {t.status}
                        </span>
                      </div>
                      <p className="font-medium text-slate-800 truncate mt-0.5">{t.subject}</p>
                      <span className="text-[10px] text-slate-400">
                        Assignee: {t.assigned_agent_name || 'Unassigned'}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Notifications Icon & Popover */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
              {/* Header */}
              <div className="px-4 py-2.5 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  {unreadCount > 0 ? (
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {unreadCount} unread
                    </span>
                  ) : (
                    <span className="bg-slate-200 text-slate-600 text-[10px] font-medium px-1.5 py-0.2 rounded-full">
                      All caught up
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={fetchNotifications}
                    className="text-[10px] text-slate-500 hover:text-slate-700 font-medium"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-50/50 border-b border-slate-100 text-[11px]">
                <button
                  onClick={() => setNotifFilter('all')}
                  className={`px-2.5 py-0.5 rounded font-semibold transition-colors ${
                    notifFilter === 'all' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setNotifFilter('unread')}
                  className={`px-2.5 py-0.5 rounded font-semibold transition-colors ${
                    notifFilter === 'unread' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {(() => {
                  const filtered = notifFilter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;
                  if (filtered.length === 0) {
                    return (
                      <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                        <CheckCircle2 className="w-6 h-6 text-slate-300 mx-auto" />
                        <p>{notifFilter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</p>
                      </div>
                    );
                  }
                  return filtered.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-2.5 ${
                        n.is_read ? 'bg-white' : 'bg-blue-50/40 hover:bg-blue-50/70'
                      }`}
                    >
                      <div className="pt-0.5">{getNotificationIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <span className={`font-semibold text-xs leading-snug truncate ${n.is_read ? 'text-slate-800' : 'text-blue-900 font-bold'}`}>
                            {n.title}
                          </span>
                          {!n.is_read && (
                            <button
                              onClick={(e) => handleMarkAsRead(n.id, e)}
                              title="Mark as read"
                              className="p-1 hover:bg-blue-100 rounded text-blue-600 shrink-0"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                          <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="uppercase text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">
                            {n.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Indicator Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
              {user.full_name.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">
                {user.full_name}
              </span>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                {user.role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-lg border border-slate-200 shadow-xl py-1 z-50 divide-y divide-slate-100">
              <div className="px-4 py-2.5">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {user.full_name}
                </span>
                <span className="text-[11px] text-slate-500 font-mono block truncate">
                  {user.email}
                </span>
                <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold uppercase">
                  {user.role} Portal Access
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
