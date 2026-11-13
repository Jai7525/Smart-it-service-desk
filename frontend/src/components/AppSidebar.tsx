import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  Ticket,
  BookOpen,
  Bell,
  Users,
  Settings,
  ShieldAlert,
  FolderGit2,
  GitBranch,
  Layers,
  Clock,
  Building,
  ShoppingBag,
  ListOrdered,
  CheckSquare,
  GitPullRequest,
  Calendar,
  Sparkles,
  Workflow
} from 'lucide-react';
import { cn } from '../lib/utils';

export const AppSidebar: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const getNavLinks = () => {
    switch (user.role) {
      case 'employee':
        return [
          { label: 'Dashboard', to: '/', icon: LayoutDashboard },
          { label: 'Report Incident', to: '/create-ticket', icon: PlusCircle },
          { label: 'My Tickets', to: '/tickets', icon: Ticket },
          { label: 'Service Catalogue', to: '/service-catalog', icon: ShoppingBag },
          { label: 'My Service Requests', to: '/my-requests', icon: ListOrdered },
          { label: 'Knowledge Base', to: '/knowledge', icon: BookOpen },
          { label: 'AI Support Assistant', to: '/ai-assistant', icon: Sparkles },
        ];
      case 'agent':
        return [
          { label: 'Agent Workspace', to: '/', icon: LayoutDashboard },
          { label: 'Assigned Tickets', to: '/assigned-tickets', icon: Ticket },
          { label: 'Service Requests', to: '/my-requests', icon: ListOrdered },
          { label: 'Change Management', to: '/changes', icon: GitPullRequest },
          { label: 'Knowledge Base', to: '/knowledge', icon: BookOpen },
          { label: 'AI Agent Assistant', to: '/ai-assistant', icon: Sparkles },
        ];
      case 'manager':
        return [
          { label: 'Executive Overview', to: '/', icon: LayoutDashboard },
          { label: 'Incident Triage', to: '/tickets', icon: Ticket },
          { label: 'Approval Centre', to: '/approvals', icon: CheckSquare },
          { label: 'Change Management', to: '/changes', icon: GitPullRequest },
          { label: 'Change Calendar', to: '/change-calendar', icon: Calendar },
          { label: 'Similar Incident Alerts', to: '/correlation', icon: ShieldAlert },
          { label: 'Problem Records (RCA)', to: '/problems', icon: FolderGit2 },
          { label: 'Automation Rules', to: '/automation', icon: GitBranch },
        ];
      case 'admin':
        return [
          { label: 'System Overview', to: '/', icon: LayoutDashboard },
          { label: 'User Directory', to: '/users', icon: Users },
          { label: 'Support Teams', to: '/teams', icon: Layers },
          { label: 'Approval Workflows', to: '/approvals', icon: CheckSquare },
          { label: 'Change Governance', to: '/changes', icon: GitPullRequest },
          { label: 'SLA Policy Engine', to: '/sla-policies', icon: Clock },
          { label: 'Departments', to: '/departments', icon: Building },
          { label: 'Automation Centre', to: '/automation', icon: GitBranch },
          { label: 'AI Configuration', to: '/ai-assistant', icon: Sparkles },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-14 px-5 flex items-center gap-3 border-b border-slate-800">
        <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-sm">
          ST
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-slate-100 tracking-tight">SmartTicket</span>
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">USM Platform</span>
        </div>
      </div>

      {/* Role Badge Indicator */}
      <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-900/50">
        <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
          Active Workspace
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 capitalize">
            {user.role} Portal
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
          Operations
        </div>
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <Icon className="w-4 h-4 stroke-[2]" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Profile Anchor */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded">
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-200">
            {user.full_name.charAt(0)}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-medium text-slate-200 truncate">{user.full_name}</span>
            <span className="text-[10px] text-slate-400 truncate">{user.email}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

