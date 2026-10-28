import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
import GrievanceTable from '../../components/GrievanceTable';
import api from '../../api/client';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';

export const OverdueGrievancesPage = () => {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOverdue = async () => {
    try {
      setLoading(true);
      const data = await api.get('/grievances?overdue=true');
      setGrievances(data.grievances || []);
    } catch (err) {
      setError(err.message || 'Failed to load overdue cases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverdue();
  }, []);

  return (
    <AppLayout
      title="Overdue Grievance Monitor"
      subtitle="Critical tracking of civic complaints that have breached standard municipal SLA service standards."
    >
      <div className="space-y-6">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-rose-900">SLA Breach Escalation Protocol Active</h4>
            <p className="text-rose-700 mt-0.5">
              These grievances have passed their maximum calculated resolution window without closure. Review staff workloads and reassign or escalate resources to expedite resolution.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            {grievances.length} Active Overdue Case{grievances.length === 1 ? '' : 's'}
          </span>
          <button
            onClick={loadOverdue}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <GrievanceTable
          grievances={grievances}
          emptyMessage="No overdue grievances detected. All active municipal tickets are within SLA boundaries."
        />
      </div>
    </AppLayout>
  );
};

export default OverdueGrievancesPage;
