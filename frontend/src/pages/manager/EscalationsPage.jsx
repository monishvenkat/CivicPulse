import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import PriorityBadge from '../../components/PriorityBadge';
import StatusBadge from '../../components/StatusBadge';
import AssignmentModal from '../../components/AssignmentModal';
import api from '../../api/client';
import {
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserCheck,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export const EscalationsPage = () => {
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [assigningGrievance, setAssigningGrievance] = useState(null);

  const loadEscalations = async () => {
    try {
      setLoading(true);
      const data = await api.get('/escalations');
      setEscalations(data.escalations || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch escalations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEscalations();
  }, []);

  const handleAcknowledge = async (id) => {
    try {
      await api.post(`/grievances/${id}/escalation/acknowledge`);
      setActionSuccess('Escalation formally acknowledged by management.');
      loadEscalations();
    } catch (err) {
      setError(err.message || 'Failed to acknowledge escalation.');
    }
  };

  return (
    <AppLayout
      title="SLA Escalation Management"
      subtitle="Supervisory management for grievances triggered by SLA breaches or urgent civic escalations."
    >
      <div className="space-y-6">
        {actionSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess('')} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            {escalations.length} Active Escalated Case{escalations.length === 1 ? '' : 's'}
          </span>
          <button
            onClick={loadEscalations}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {escalations.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Open Escalations</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              All municipal service tickets are operating normally without open managerial escalations.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {escalations.map(g => {
              const esc = g.escalation || {};
              const isOpen = esc.state === 'open';

              return (
                <div
                  key={g.id || g._id}
                  className={`bg-white rounded-xl border p-5 shadow-2xs transition-all ${
                    isOpen ? 'border-purple-300 bg-purple-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        isOpen ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-xs">{g.reference}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isOpen ? 'bg-rose-100 text-rose-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {isOpen ? 'Open Escalation' : 'Acknowledged'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm mt-0.5">{g.title}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={g.priority} />
                      <StatusBadge status={g.status} />
                    </div>
                  </div>

                  <div className="py-3 text-xs space-y-2">
                    <p className="text-slate-600">{g.description}</p>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700">
                      <strong>Escalation Reason:</strong> {esc.reason || 'SLA threshold exceeded'}{' '}
                      <span className="text-slate-400">
                        (Triggered: {esc.triggeredAt ? new Date(esc.triggeredAt).toLocaleString() : 'System sweep'})
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="text-slate-500 text-[11px]">
                      <span>Assigned to: </span>
                      <strong className="text-slate-800">
                        {g.assignee?.name ? `${g.assignee.name} (${g.assignee.department || 'Staff'})` : 'Unassigned'}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOpen && (
                        <button
                          type="button"
                          onClick={() => handleAcknowledge(g.id || g._id)}
                          className="px-3 py-1.5 rounded-lg bg-purple-700 text-white font-semibold text-xs hover:bg-purple-800 transition-colors shadow-2xs"
                        >
                          Acknowledge Escalation
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setAssigningGrievance(g)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Reassign Case</span>
                      </button>
                      <Link
                        to={`/grievances/${g.id || g._id}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 flex items-center gap-1"
                      >
                        <span>Full Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AssignmentModal
        grievance={assigningGrievance}
        isOpen={Boolean(assigningGrievance)}
        onClose={() => setAssigningGrievance(null)}
        onAssigned={() => loadEscalations()}
      />
    </AppLayout>
  );
};

export default EscalationsPage;
