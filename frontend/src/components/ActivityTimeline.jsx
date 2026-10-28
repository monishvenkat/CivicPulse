import React from 'react';
import { History, User, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';

export const ActivityTimeline = ({ history = [], assignmentHistory = [] }) => {
  // Merge status history and assignment history into a unified chronological log
  const statusEvents = (history || []).map(h => ({
    type: 'status',
    at: new Date(h.at),
    status: h.status,
    previousStatus: h.previousStatus,
    note: h.note,
    actor: h.actor
  }));

  const assignmentEvents = (assignmentHistory || []).map(a => ({
    type: 'assignment',
    at: new Date(a.at),
    from: a.from,
    to: a.to,
    actor: a.actor,
    reason: a.reason
  }));

  const events = [...statusEvents, ...assignmentEvents].sort((a, b) => b.at - a.at);

  if (events.length === 0) {
    return (
      <div className="text-center py-6 text-slate-400 text-xs">
        No recorded activity yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {events.map((event, idx) => {
        const isStatus = event.type === 'status';

        return (
          <div key={idx} className="relative group">
            {/* Timeline node dot */}
            <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
              isStatus ? 'border-emerald-600' : 'border-purple-600'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                isStatus ? 'bg-emerald-600' : 'bg-purple-600'
              }`} />
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  {isStatus ? (
                    <>
                      <span>Status transition:</span>
                      <StatusBadge status={event.status} size="sm" />
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5 text-purple-600" />
                      <span>Case assigned to {event.to?.name || 'Case Worker'}</span>
                    </>
                  )}
                </span>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {event.at.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {isStatus && event.previousStatus && (
                <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-1">
                  <span>From</span>
                  <span className="font-medium text-slate-700">{event.previousStatus}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="font-medium text-slate-700">{event.status}</span>
                </div>
              )}

              {event.note && (
                <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200/60 mt-1 italic">
                  "{event.note}"
                </p>
              )}

              {event.reason && (
                <p className="text-[11px] text-purple-900 bg-purple-50 p-2 rounded border border-purple-100 mt-1">
                  <strong>Assignment reason:</strong> {event.reason}
                </p>
              )}

              <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <span>Updated by:</span>
                <span className="font-medium text-slate-600">
                  {event.actor?.name ? `${event.actor.name} (${event.actor.role || 'Staff'})` : 'Authorized user'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityTimeline;
