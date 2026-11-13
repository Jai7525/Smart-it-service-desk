import React from 'react';
import { cn } from '../lib/utils';
import { PriorityLevel } from '../types';
import { AlertCircle, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

interface PriorityBadgeProps {
  priority: PriorityLevel;
  className?: string;
}

const priorityConfig: Record<
  PriorityLevel,
  { label: string; classes: string; icon: React.ElementType }
> = {
  critical: {
    label: 'Critical',
    classes: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
    icon: AlertCircle,
  },
  high: {
    label: 'High',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: ArrowUp,
  },
  medium: {
    label: 'Medium',
    classes: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: ArrowRight,
  },
  low: {
    label: 'Low',
    classes: 'bg-gray-50 text-gray-600 border-gray-200',
    icon: ArrowDown,
  },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className }) => {
  const config = priorityConfig[priority] || priorityConfig.medium;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border transition-colors',
        config.classes,
        className
      )}
    >
      <Icon className="w-3 h-3 stroke-[2.2]" />
      {config.label}
    </span>
  );
};

