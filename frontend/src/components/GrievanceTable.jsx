import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { AlertTriangle, Clock, ArrowRight, User } from 'lucide-react';

export const GrievanceTable = ({ grievances = [], emptyMessage = 'No grievances found.' }) => {
  if (!grievances || grievances.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          ✳
        </div>
        <h4 className="text-sm font-bold text-slate-800">No Records Found</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  const isOverdue = (g) => {
    if (['Resolved', 'Closed'].includes(g.status)) return false;
    return new Date(g.slaDeadline) < new Date();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3.5 px-4">Reference & Title</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Priority & SLA</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Assignee</th>
              <th className="py-3.5 px-4">Submitted</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {grievances.map(g => {
              const overdue = isOverdue(g);
              const escalated = g.escalation?.state === 'open' || g.escalation?.state === 'acknowledged';

              return (
                <tr
                  key={g.id || g._id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    overdue ? 'bg-rose-50/30' : ''
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 tracking-tight">
                        {g.reference}
                      </span>
                      {overdue && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          OVERDUE
                        </span>
                      )}
                      {escalated && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                          ESCALATED
                        </span>
                      )}
                    </div>
                    <div className="font-medium text-slate-700 line-clamp-1 mt-0.5 max-w-md">
                      {g.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {g.location}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {g.category}
                  </td>
                  <td className="py-3.5 px-4">
                    <PriorityBadge priority={g.priority} />
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Due: {new Date(g.slaDeadline).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={g.status} />
                  </td>
                  <td className="py-3.5 px-4">
                    {g.assignee ? (
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium truncate max-w-[130px]">{g.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                    {new Date(g.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/grievances/${g.id || g._id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 transition-all font-semibold text-[11px]"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GrievanceTable;
