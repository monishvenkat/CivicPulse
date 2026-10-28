import React from 'react';
import { Flame, AlertTriangle, Info, ShieldCheck } from 'lucide-react';

export const PriorityBadge = ({ priority }) => {
  const configs = {
    'Critical': {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: Flame,
      sla: '4h SLA'
    },
    'High': {
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: AlertTriangle,
      sla: '24h SLA'
    },
    'Medium': {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Info,
      sla: '48h SLA'
    },
    'Low': {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: ShieldCheck,
      sla: '72h SLA'
    }
  };

  const config = configs[priority] || {
    bg: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Info,
    sla: 'Standard'
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium ${config.bg}`}>
      <Icon className="w-3 h-3" />
      <span>{priority}</span>
      <span className="text-[9px] opacity-75 font-normal">({config.sla})</span>
    </span>
  );
};

export default PriorityBadge;
