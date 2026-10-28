import React from 'react';
import { Clock, CheckCircle2, AlertCircle, ArrowUpRight, HelpCircle, Archive } from 'lucide-react';

export const StatusBadge = ({ status, size = 'sm' }) => {
  const configs = {
    'Submitted': {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Clock,
      label: 'Submitted'
    },
    'Acknowledged': {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: ArrowUpRight,
      label: 'Acknowledged'
    },
    'In Progress': {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: Clock,
      label: 'In Progress'
    },
    'Awaiting Information': {
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: HelpCircle,
      label: 'Awaiting Info'
    },
    'Resolved': {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
      label: 'Resolved'
    },
    'Closed': {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: Archive,
      label: 'Closed'
    }
  };

  const config = configs[status] || {
    bg: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: AlertCircle,
    label: status
  };

  const Icon = config.icon;
  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-xs font-semibold' : 'px-2.5 py-0.5 text-[11px] font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses}`}>
      <Icon className={size === 'lg' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
