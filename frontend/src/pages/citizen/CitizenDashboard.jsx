import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import GrievanceTable from '../../components/GrievanceTable';
import api from '../../api/client';
import {
  FilePlus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight
} from 'lucide-react';

export const CitizenDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentGrievances, setRecentGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, grievancesData] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/grievances?limit=5')
      ]);
      setStats(statsData.stats);
      setRecentGrievances(grievancesData.grievances || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AppLayout
      title="Citizen Service Portal"
      subtitle="Report civic grievances, track department workflows, and monitor SLA resolution times."
    >
      {/* Top Banner / Actions */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-8 text-white mb-8 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            A CITY THAT LISTENS
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold mt-1">
            See an issue in your neighborhood?
          </h2>
          <p className="text-xs text-emerald-100/90 mt-1 max-w-lg">
            Submit a report with location details. Our automated routing system assigns your case to municipal crews with guaranteed SLA deadlines.
          </p>
        </div>
        <Link
          to="/citizen/submit"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-emerald-900 font-bold text-xs shadow-sm hover:bg-emerald-50 hover:-translate-y-0.5 transition-all shrink-0"
        >
          <FilePlus className="w-4 h-4 text-emerald-700" />
          <span>Report New Grievance</span>
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Reports</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <strong className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {loading ? '—' : stats?.total ?? 0}
          </strong>
          <span className="text-[11px] text-slate-400 block mt-1">Submitted by you</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">In Progress</span>
            <Clock className="w-4 h-4" />
          </div>
          <strong className="text-2xl sm:text-3xl font-extrabold text-indigo-700">
            {loading ? '—' : stats?.inProgress ?? 0}
          </strong>
          <span className="text-[11px] text-slate-400 block mt-1">Active municipal work</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Past Deadline</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <strong className="text-2xl sm:text-3xl font-extrabold text-rose-700">
            {loading ? '—' : stats?.overdue ?? 0}
          </strong>
          <span className="text-[11px] text-slate-400 block mt-1">SLA exceeded & escalated</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Resolved</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <strong className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
            {loading ? '—' : stats?.resolved ?? 0}
          </strong>
          <span className="text-[11px] text-slate-400 block mt-1">Verified fixes</span>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Your Recent Grievances</h3>
            <p className="text-xs text-slate-500">Track current status and supervisor notes</p>
          </div>
          <Link
            to="/citizen/grievances"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>View All ({stats?.total ?? 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <GrievanceTable
          grievances={recentGrievances}
          emptyMessage="You have not submitted any civic complaints yet. Click 'Report New Grievance' to get started."
        />
      </div>
    </AppLayout>
  );
};

export default CitizenDashboard;
