import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, Flame } from 'lucide-react';

interface SLABadgeProps {
  deadline?: string | null;
  respondedAt?: string | null;
  resolvedAt?: string | null;
  isBreached?: boolean;
  type?: 'response' | 'resolution';
  compact?: boolean;
}

export const SLABadge: React.FC<SLABadgeProps> = ({
  deadline,
  respondedAt,
  resolvedAt,
  isBreached = false,
  type = 'resolution',
  compact = false,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    text: string;
    status: 'safe' | 'warning' | 'breached' | 'completed';
    percentage: number;
  }>({
    text: 'Calculating...',
    status: 'safe',
    percentage: 100,
  });

  useEffect(() => {
    // If ticket is already resolved or responded to
    if (type === 'response' && respondedAt) {
      setTimeRemaining({
        text: 'Responded',
        status: 'completed',
        percentage: 100,
      });
      return;
    }

    if (type === 'resolution' && resolvedAt) {
      setTimeRemaining({
        text: 'Resolved',
        status: 'completed',
        percentage: 100,
      });
      return;
    }

    if (!deadline) {
      setTimeRemaining({
        text: 'No SLA Target',
        status: 'safe',
        percentage: 100,
      });
      return;
    }

    const calculateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(deadline).getTime();
      const diff = target - now;

      if (diff <= 0 || isBreached) {
        const overdueMins = Math.abs(Math.floor(diff / (1000 * 60)));
        const overdueHours = Math.floor(overdueMins / 60);
        const remMins = overdueMins % 60;
        const overdueText =
          overdueHours > 0
            ? `+${overdueHours}h ${remMins}m`
            : `+${overdueMins}m`;

        setTimeRemaining({
          text: `Breached (${overdueText})`,
          status: 'breached',
          percentage: 0,
        });
        return;
      }

      // Calculate time remaining
      const totalMins = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      let text = '';
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        text = `${days}d ${hours % 24}h left`;
      } else if (hours > 0) {
        text = `${hours}h ${mins}m left`;
      } else {
        text = `${mins}m ${secs}s left`;
      }

      // Warning status if under 1 hour remaining
      const status = totalMins < 60 ? 'warning' : 'safe';

      setTimeRemaining({
        text,
        status,
        percentage: Math.min(100, Math.max(0, (totalMins / 240) * 100)),
      });
    };

    calculateTimer();
    const interval = setInterval(calculateTimer, 1000);

    return () => clearInterval(interval);
  }, [deadline, respondedAt, resolvedAt, isBreached, type]);

  if (timeRemaining.status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle className="w-3 h-3 text-emerald-600" />
        {timeRemaining.text}
      </span>
    );
  }

  if (timeRemaining.status === 'breached') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-300 animate-pulse">
        <Flame className="w-3 h-3 text-rose-600" />
        {compact ? 'SLA Breached' : timeRemaining.text}
      </span>
    );
  }

  if (timeRemaining.status === 'warning') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
        <AlertTriangle className="w-3 h-3 text-amber-600" />
        {timeRemaining.text}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-slate-700 bg-slate-100 border border-slate-200">
      <Clock className="w-3 h-3 text-slate-500" />
      {timeRemaining.text}
    </span>
  );
};
