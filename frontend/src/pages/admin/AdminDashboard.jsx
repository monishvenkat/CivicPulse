import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import api from '../../api/client';
import {
  Users,
  ShieldCheck,
  Activity,
  Layers,
  Settings,
  ArrowRight,
  UserPlus
} from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, healthData] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/health')
      ]);
      setStats(statsData.stats);
      setHealth(healthData);
    } catch (err) {
      setError(err.message || 'Failed to load administrator data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const byRole = stats?.userStats?.byRole || {};

  return (
    <AppLayout
      title="System Administration Console"
      subtitle="Comprehensive user management, system diagnostics, and municipal service governance."
    >
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* System Health Status Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Cluster Status: Operational</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-slate-500">
              MongoDB Database: <strong className="text-emerald-700 font-semibold">{health?.database || 'connected'}</strong> · ReadyState: 1
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 text-white font-semibold text-xs shadow-xs hover:bg-emerald-800 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Manage Users</span>
          </Link>
          <Link
            to="/admin/settings"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>SLA Settings</span>
          </Link>
        </div>
      </div>

      {/* User Statistics Grid */}
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
        User Account Distribution by Role
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Citizens</span>
          <strong className="text-2xl sm:text-3xl font-extrabold text-slate-900 block mt-1">
            {loading ? '—' : byRole.citizen ?? 0}
          </strong>
          <span className="text-[10px] text-slate-400">Public registered users</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Case Workers</span>
          <strong className="text-2xl sm:text-3xl font-extrabold text-slate-900 block mt-1">
            {loading ? '—' : byRole.case_worker ?? 0}
          </strong>
          <span className="text-[10px] text-slate-400">Field response staff</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Managers</span>
          <strong className="text-2xl sm:text-3xl font-extrabold text-slate-900 block mt-1">
            {loading ? '—' : byRole.manager ?? 0}
          </strong>
          <span className="text-[10px] text-slate-400">Operations supervisors</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Administrators</span>
          <strong className="text-2xl sm:text-3xl font-extrabold text-slate-900 block mt-1">
            {loading ? '—' : byRole.admin ?? 0}
          </strong>
          <span className="text-[10px] text-slate-400">System controllers</span>
        </div>
      </div>

      {/* Grievance Overview Grid */}
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
        Overall Grievance System Status
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Grievances</span>
          <strong className="text-2xl sm:text-3xl font-extrabold text-slate-900 block mt-1">
            {loading ? '—' : stats?.total ?? 0}
          </strong>
          <span className="text-[10px] text-slate-400">All-time municipal volume</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Active Workflows</span>
          <strong className="text-2xl sm:text-3xl font-extrabold text-indigo-700 block mt-1">
            {loading ? '—' : stats?.open ?? 0}
          </strong>
          <span className="text-[10px] text-slate-400">Submitted + In Progress</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Overdue Breaches</span>
          <strong className="text-2xl sm:text-3xl font-extrabold text-rose-700 block mt-1">
            {loading ? '—' : stats?.overdue ?? 0}
          </strong>
          <span className="text-[10px] text-slate-400">SLA clock elapsed</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Resolved Cases</span>
          <strong className="text-2xl sm:text-3xl font-extrabold text-emerald-700 block mt-1">
            {loading ? '—' : (stats?.resolved ?? 0) + (stats?.closed ?? 0)}
          </strong>
          <span className="text-[10px] text-slate-400">Audit-verified fixes</span>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
