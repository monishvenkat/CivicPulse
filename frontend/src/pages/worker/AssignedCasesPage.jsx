import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
import GrievanceTable from '../../components/GrievanceTable';
import api from '../../api/client';
import { Search, Filter, AlertTriangle, RefreshCw } from 'lucide-react';

export const AssignedCasesPage = () => {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const loadCases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (status) params.append('status', status);
      if (onlyOverdue) params.append('overdue', 'true');

      const data = await api.get(`/grievances?${params.toString()}`);
      setGrievances(data.grievances || []);
    } catch (err) {
      setError(err.message || 'Failed to load assigned grievances.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCases();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, status, onlyOverdue]);

  return (
    <AppLayout
      title="Assigned Service Tickets"
      subtitle="Complete list of grievances currently assigned to your team."
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search assigned cases by reference, title, or location..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="In Progress">In Progress</option>
              <option value="Awaiting Information">Awaiting Info</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            <button
              type="button"
              onClick={() => setOnlyOverdue(!onlyOverdue)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                onlyOverdue
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Overdue Only</span>
            </button>

            <button
              onClick={loadCases}
              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <GrievanceTable
          grievances={grievances}
          emptyMessage="No assigned grievances match your query."
        />
      </div>
    </AppLayout>
  );
};

export default AssignedCasesPage;
