import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
import api from '../../api/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { BarChart3, PieChart as PieIcon, RefreshCw, AlertCircle } from 'lucide-react';

export const AnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.get('/dashboard/stats');
      setStats(data.stats);
    } catch (err) {
      setError(err.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const statusColors = {
    'Submitted': '#3b82f6',
    'Acknowledged': '#f59e0b',
    'In Progress': '#6366f1',
    'Awaiting Information': '#a855f7',
    'Resolved': '#10b981',
    'Closed': '#64748b'
  };

  const priorityColors = {
    'Critical': '#ef4444',
    'High': '#f97316',
    'Medium': '#f59e0b',
    'Low': '#10b981'
  };

  const statusData = Object.entries(stats?.statusDistribution || {}).map(([name, value]) => ({
    name,
    count: value,
    color: statusColors[name] || '#94a3b8'
  }));

  const priorityData = Object.entries(stats?.priorityDistribution || {}).map(([name, value]) => ({
    name,
    count: value,
    color: priorityColors[name] || '#94a3b8'
  }));

  const categoryData = Object.entries(stats?.categoryDistribution || {}).map(([name, value]) => ({
    name,
    count: value
  }));

  const workerData = (stats?.workerWorkload || []).map(w => ({
    name: w.name.split(' ')[0],
    activeCases: w.activeCaseCount || 0
  }));

  return (
    <AppLayout
      title="Municipal Performance Analytics"
      subtitle="Visual distribution of grievance volumes, resolution SLAs, and operational bottlenecks."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Real-Time System Metrics · {stats?.total || 0} Total Records Analyzed
          </span>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Status Distribution */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-700" />
              <span>Grievance Status Distribution</span>
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Priority Breakdown */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-700" />
              <span>Priority Level Distribution (SLA Tiers)</span>
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`pcell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Category Volume */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-700" />
              <span>Municipal Category Volume</span>
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#047857" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Case Worker Active Load */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-700" />
              <span>Personnel Active Load Balance</span>
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workerData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="activeCases" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AnalyticsPage;
