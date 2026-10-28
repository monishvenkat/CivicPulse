import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import GrievanceTable from '../../components/GrievanceTable';
import PriorityBadge from '../../components/PriorityBadge';
import api from '../../api/client';
import {
  Briefcase,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Flame,
  ShieldAlert
} from 'lucide-react';

export const WorkerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [approaching, setApproaching] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.get('/dashboard/stats');
      setStats(data.stats);
      setApproaching(data.approaching || []);
    } catch (err) {
      setError(err.message || 'Failed to load case worker dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AppLayout
      title="Case Worker Operations"
      subtitle="Manage assigned municipal service tickets, monitor SLA clocks, and record resolution notes."
    >
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Assigned Active</span>
            <Briefcase className="w-4 h-4 text-slate-400" />
          </div>
          <strong className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {loading ? '—' : stats?.open ?? 0}
          </strong>
          <span className="text-[11px] text-slate-400 block mt-1">Pending + In Progress</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">In Progress</span>
            <Clock className="w-4 h-4" />
          </div>
          <strong className="text-2xl sm:text-3xl font-extrabold text-indigo-700">
            {loading ? '—' : stats?.inProgress ?? 0}
          </strong>
          <span className="text-[11px] text-slate-400 block mt-1">Under active repair</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Overdue SLA</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <strong className="text-2xl sm:text-3xl font-extrabold text-rose-700">
            {loading ? '—' : stats?.overdue ?? 0}
          </strong>
          <span className="text-[11px] text-slate-400 block mt-1">Breached deadline</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <strong className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
            {loading ? '—' : stats?.resolved ?? 0}
          </strong>
          <span className="text-[11px] text-slate-400 block mt-1">Resolved cases</span>
        </div>
      </div>

      {/* Priority Distribution Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs mb-8">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
          Assigned Case Priority Breakdown
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-bold text-rose-900">Critical (4h)</span>
            </div>
            <strong className="text-base font-extrabold text-rose-800">
              {stats?.priorityDistribution?.Critical ?? 0}
            </strong>
          </div>

          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-bold text-orange-900">High (24h)</span>
            </div>
            <strong className="text-base font-extrabold text-orange-800">
              {stats?.priorityDistribution?.High ?? 0}
            </strong>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-900">Medium (48h)</span>
            </div>
            <strong className="text-base font-extrabold text-amber-800">
              {stats?.priorityDistribution?.Medium ?? 0}
            </strong>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-900">Low (72h)</span>
            </div>
            <strong className="text-base font-extrabold text-emerald-800">
              {stats?.priorityDistribution?.Low ?? 0}
            </strong>
          </div>
        </div>
      </div>

      {/* Priority Work Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Assigned Cases Work Queue</h3>
            <p className="text-xs text-slate-500">Sorted by earliest SLA deadline to prioritize critical interventions</p>
          </div>
          <Link
            to="/worker/cases"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>View All Assigned ({stats?.total ?? 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <GrievanceTable
          grievances={approaching}
          emptyMessage="No pending service cases currently assigned to your account."
        />
      </div>
    </AppLayout>
  );
};

export default WorkerDashboard;
