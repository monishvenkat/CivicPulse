import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import PriorityBadge from '../../components/PriorityBadge';
import api from '../../api/client';
import {
  FilePlus,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight
} from 'lucide-react';

const categories = [
  'Roads & Transport',
  'Water & Sanitation',
  'Waste Management',
  'Parks & Public Spaces',
  'Street Lighting',
  'Public Safety',
  'Other'
];

export const SubmitGrievancePage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    category: categories[0],
    location: '',
    priority: 'Medium',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedGrievance, setSubmittedGrievance] = useState(null);

  const slaDescriptions = {
    Critical: '4 Hours SLA · Immediate public hazards or service collapses',
    High: '24 Hours SLA · Major road defects or persistent outages',
    Medium: '48 Hours SLA · Standard public works and maintenance',
    Low: '72 Hours SLA · Non-urgent municipal improvements'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }
    if (form.description.trim().length < 20) {
      setError('Description must be at least 20 characters long to provide adequate investigation details.');
      return;
    }
    if (form.location.trim().length < 2) {
      setError('Please provide a specific street, neighborhood, or landmark.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.post('/grievances', form);
      setSubmittedGrievance(data.grievance);
    } catch (err) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout
      title="Submit Civic Grievance"
      subtitle="Report an issue to municipal authorities with transparent SLA tracking."
    >
      <div className="max-w-2xl mx-auto">
        {submittedGrievance ? (
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center shadow-lg space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              SUBMISSION CONFIRMED
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Grievance Successfully Registered
            </h2>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Reference Number:</span>
                <span className="font-mono text-sm font-extrabold text-emerald-800">
                  {submittedGrievance.reference}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Service Deadline:</span>
                <span className="text-xs font-bold text-slate-800">
                  {new Date(submittedGrievance.slaDeadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Assigned Status:</span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  {submittedGrievance.status}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Keep this reference number for follow-ups. You can track all progress live in your dashboard.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                to={`/grievances/${submittedGrievance.id || submittedGrievance._id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-700 text-white font-bold text-xs shadow-xs hover:bg-emerald-800 transition-colors"
              >
                <span>View Full Case Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmittedGrievance(null);
                  setForm({
                    title: '',
                    category: categories[0],
                    location: '',
                    priority: 'Medium',
                    description: ''
                  });
                }}
                className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Submit Another Report
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            {error && (
              <div className="mb-6 flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Report Title *
                </label>
                <input
                  type="text"
                  required
                  minLength="5"
                  maxLength="120"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Clear summary, e.g. 'Deep pothole damaging vehicles on West Grand Blvd'"
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <span className="text-[10px] text-slate-400 block text-right mt-1">
                  {form.title.length}/120
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Urgency Priority *
                  </label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Critical">Critical (4h SLA)</option>
                    <option value="High">High (24h SLA)</option>
                    <option value="Medium">Medium (48h SLA)</option>
                    <option value="Low">Low (72h SLA)</option>
                  </select>
                </div>
              </div>

              {/* Priority Guidance Alert */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Selected Priority Level:</span>
                <PriorityBadge priority={form.priority} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Location or Service Area *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    minLength="2"
                    maxLength="200"
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    placeholder="Street intersection, landmark, or specific building address"
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Detailed Description *
                </label>
                <textarea
                  rows="5"
                  required
                  minLength="20"
                  maxLength="4000"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the issue, hazards observed, how long it has persisted, and any specific safety implications..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>Minimum 20 characters required</span>
                  <span>{form.description.length}/4000</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => navigate('/citizen/dashboard')}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-700 text-white font-bold text-xs shadow-xs hover:bg-emerald-800 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Submitting Grievance...' : 'Submit Grievance'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default SubmitGrievancePage;
