import React from 'react';
import { cn } from '../lib/utils';
import { TicketStatus } from '../types';

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

const statusConfig: Record<TicketStatus, { label: string; classes: string; dot: string }> = {
  open: {
    label: 'Open',
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  },
  in_progress: {
    label: 'In Progress',
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500 animate-pulse',
  },
  resolved: {
    label: 'Resolved (Awaiting Confirmation)',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-400/30',
    dot: 'bg-emerald-500 animate-pulse',
  },
  closed: {
    label: 'Closed',
    classes: 'bg-zinc-100 text-zinc-500 border-zinc-200',
    dot: 'bg-zinc-400',
  },
  reopened: {
    label: 'Reopened',
    classes: 'bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-400/30',
    dot: 'bg-amber-500 animate-ping',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status] || statusConfig.open;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border transition-colors',
        config.classes,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
};

