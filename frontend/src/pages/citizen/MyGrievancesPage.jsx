import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
import GrievanceTable from '../../components/GrievanceTable';
import api from '../../api/client';
import { Search, Filter, RefreshCw } from 'lucide-react';

export const MyGrievancesPage = () => {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');

  const loadGrievances = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (status) params.append('status', status);
      if (category) params.append('category', category);

      const data = await api.get(`/grievances/mine?${params.toString()}`);
      setGrievances(data.grievances || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch grievances.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadGrievances();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, status, category]);

  return (
    <AppLayout
      title="My Grievance Register"
      subtitle="Complete record of all civic complaints submitted under your verified account."
    >
      <div className="space-y-6">
        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, reference number, or location..."
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

        {/* Results List */}
        <GrievanceTable
          grievances={grievances}
          emptyMessage="No grievances match your current search and filter criteria."
        />
      </div>
    </AppLayout>
  );
};

export default MyGrievancesPage;
