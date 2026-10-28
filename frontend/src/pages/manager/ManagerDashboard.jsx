import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import api from '../../api/client';
import {
  Layers,
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Users,
  BarChart3,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export const ManagerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.get('/dashboard/stats');
      setStats(data.stats);
    } catch (err) {
      setError(err.message || 'Failed to load manager operations dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AppLayout
      title="Municipal Operations Command Center"
      subtitle="City-wide grievance monitoring, staff assignment balance, and SLA escalation control."
    >
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total System Cases</span>
          <strong className="text-2xl font-extrabold text-slate-900 block mt-1">
            {loading ? '—' : stats?.total ?? 0}
          </strong>
          <span className="text-[10px] text-slate-400">All submissions</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Pending Triage</span>
          <strong className="text-2xl font-extrabold text-blue-700 block mt-1">
            {loading ? '—' : stats?.pending ?? 0}
          </strong>
          <span className="text-[10px] text-slate-400">Needs assignment</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">In Progress</span>
          <strong className="text-2xl font-extrabold text-indigo-700 block mt-1">
            {loading ? '—' : stats?.inProgress ?? 0}
          </strong>
          <span className="text-[10px] text-slate-400">Active municipal work</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Overdue SLA</span>
          <strong className="text-2xl font-extrabold text-rose-700 block mt-1">
            {loading ? '—' : stats?.overdue ?? 0}
          </strong>
          <span className="text-[10px] text-slate-400">Passed deadline</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Escalated</span>
          <strong className="text-2xl font-extrabold text-purple-700 block mt-1">
            {loading ? '—' : stats?.escalated ?? 0}
          </strong>
          <span className="text-[10px] text-slate-400">Supervisor review</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Resolved / Closed</span>
          <strong className="text-2xl font-extrabold text-emerald-700 block mt-1">
            {loading ? '—' : (stats?.resolved ?? 0) + (stats?.closed ?? 0)}
          </strong>
          <span className="text-[10px] text-slate-400">Completed fixes</span>
        </div>
      </div>

      {/* Operations Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          to="/manager/overdue"
          className="p-5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-all flex items-center justify-between group"
        >
          <div>
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Overdue Cases ({stats?.overdue ?? 0})</span>
            </div>
            <p className="text-xs text-rose-600/80 mt-1">
              Review grievances that breached SLA thresholds and expedite field resolution.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-rose-600 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/manager/escalations"
          className="p-5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-50 transition-all flex items-center justify-between group"
        >
          <div>
            <div className="flex items-center gap-2 text-purple-800 font-bold text-sm">
              <Flame className="w-4 h-4 text-purple-600" />
              <span>Open Escalations ({stats?.escalated ?? 0})</span>
            </div>
            <p className="text-xs text-purple-600/80 mt-1">
              Inspect critical triggers and formally acknowledge management escalation.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/manager/analytics"
          className="p-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all flex items-center justify-between group"
        >
          <div>
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <BarChart3 className="w-4 h-4 text-emerald-700" />
              <span>Performance Analytics</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Visual breakdowns by municipal category, priority distribution, and worker capacity.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Case Worker Workload Distribution */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>Case Worker Workload & Capacity</span>
            </h3>
            <p className="text-xs text-slate-500">Live active case assignments across municipal personnel</p>
          </div>
          <Link
            to="/manager/grievances?unassigned=true"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            Assign Unassigned Cases →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-semibold uppercase">
                <th className="py-2.5 px-3">Case Worker</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-center">Active Workload</th>
                <th className="py-2.5 px-3 text-right">Capacity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(stats?.workerWorkload || []).map(w => {
                const count = w.activeCaseCount || 0;
                let badge = 'bg-emerald-100 text-emerald-800';
                let label = 'Optimal Capacity';
                if (count >= 5) {
                  badge = 'bg-rose-100 text-rose-800';
                  label = 'Heavy Load';
                } else if (count >= 3) {
                  badge = 'bg-amber-100 text-amber-800';
                  label = 'Moderate';
                }

                return (
                  <tr key={w._id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {w.name}
                      <span className="block text-[10px] font-normal text-slate-400">{w.email}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {w.department || 'Public Works'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                      {count} active cases
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge}`}>
                        {label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default ManagerDashboard;
