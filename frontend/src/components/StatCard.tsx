import React from 'react';
import { cn } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: { text: string; positive?: boolean };
  icon?: React.ElementType;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  badge,
  icon: Icon,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200/80 rounded-lg p-4 flex flex-col justify-between shadow-xs transition-all hover:border-slate-300',
        className
      )}
    >
      <div className="flex items-center justify-between text-slate-500 mb-2">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && <Icon className="w-4 h-4 text-slate-400 stroke-[1.8]" />}
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {badge && (
          <span
            className={cn(
              'text-[11px] font-medium px-1.5 py-0.5 rounded border',
              badge.positive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            )}
          >
            {badge.text}
          </span>
        )}
      </div>

      {subtitle && <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
};

