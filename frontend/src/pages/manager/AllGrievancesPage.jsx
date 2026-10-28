import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import GrievanceTable from '../../components/GrievanceTable';
import AssignmentModal from '../../components/AssignmentModal';
import api from '../../api/client';
import { Search, Filter, RefreshCw, UserCheck } from 'lucide-react';

export const AllGrievancesPage = () => {
  const [searchParams] = useSearchParams();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [unassignedOnly, setUnassignedOnly] = useState(searchParams.get('unassigned') === 'true');

  const [assigningGrievance, setAssigningGrievance] = useState(null);

  const loadGrievances = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (category) params.append('category', category);
      if (unassignedOnly) params.append('unassigned', 'true');

      const data = await api.get(`/grievances?${params.toString()}`);
      setGrievances(data.grievances || []);
    } catch (err) {
      setError(err.message || 'Failed to load grievances.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadGrievances();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, status, priority, category, unassignedOnly]);

  return (
    <AppLayout
      title="City-Wide Grievance Register"
      subtitle="Complete database of all public civic complaints across all departments."
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
              placeholder="Search reference, title, location, citizen..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical (4h)</option>
              <option value="High">High (24h)</option>
              <option value="Medium">Medium (48h)</option>
              <option value="Low">Low (72h)</option>
            </select>

            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">All Categories</option>
              <option value="Roads & Transport">Roads & Transport</option>
              <option value="Water & Sanitation">Water & Sanitation</option>
              <option value="Waste Management">Waste Management</option>
              <option value="Parks & Public Spaces">Parks & Public Spaces</option>
              <option value="Street Lighting">Street Lighting</option>
              <option value="Public Safety">Public Safety</option>
              <option value="Other">Other</option>
            </select>

            <button
              type="button"
              onClick={() => setUnassignedOnly(!unassignedOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                unassignedOnly
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Unassigned Only</span>
            </button>

            <button
              onClick={loadGrievances}
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
          emptyMessage="No grievances match your search and filter criteria."
        />
      </div>

      <AssignmentModal
        grievance={assigningGrievance}
        isOpen={Boolean(assigningGrievance)}
        onClose={() => setAssigningGrievance(null)}
        onAssigned={() => loadGrievances()}
      />
    </AppLayout>
  );
};

export default AllGrievancesPage;
