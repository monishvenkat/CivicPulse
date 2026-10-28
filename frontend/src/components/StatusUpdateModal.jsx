import React, { useState } from 'react';
import api from '../api/client';
import { X, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export const StatusUpdateModal = ({ grievance, isOpen, onClose, onUpdated }) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !grievance) return null;

  const transitionMap = {
    'Submitted': ['Acknowledged'],
    'Acknowledged': ['In Progress', 'Awaiting Information'],
    'In Progress': ['Awaiting Information', 'Resolved'],
    'Awaiting Information': ['In Progress'],
    'Resolved': ['Closed'],
    'Closed': []
  };

  const allowedNext = transitionMap[grievance.status] || [];
  const isResolving = selectedStatus === 'Resolved';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus) {
      setError('Please select a target status.');
      return;
    }

    if (isResolving && note.trim().length < 5) {
      setError('A comprehensive resolution note (at least 5 characters) is required when resolving a grievance.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await api.patch(`/grievances/${grievance.id || grievance._id}/status`, {
        status: selectedStatus,
        note: note.trim()
      });
      onUpdated(data.grievance);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-sm text-slate-900">Update Grievance Status</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500">Current Status</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                {grievance.status}
              </span>
              <span className="text-slate-400">→</span>
              <span className="text-xs font-semibold text-emerald-700">
                {selectedStatus || 'Select next step'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Permitted Next Status *
            </label>
            {allowedNext.length > 0 ? (
              <select
                required
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">-- Choose Target Status --</option>
                {allowedNext.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                This grievance has reached a terminal status ({grievance.status}) and cannot transition further via normal processing.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>{isResolving ? 'Resolution Note *' : 'Progress / Audit Note'}</span>
              {isResolving && (
                <span className="text-[10px] text-emerald-700 font-bold">Mandatory</span>
              )}
            </label>
            <textarea
              rows="4"
              required={isResolving}
              maxLength="2000"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={
                isResolving
                  ? 'Detail the actions taken to resolve the issue (repairs performed, crew dispatched, citizen verification)...'
                  : 'Optional note describing current progress, site visit findings, or next steps...'
              }
              className={`w-full text-xs px-3 py-2 rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none ${
                isResolving ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-300'
              }`}
            />
            <span className="text-[10px] text-slate-400 block text-right">{note.length}/2000</span>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || allowedNext.length === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{loading ? 'Updating...' : 'Update Status'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusUpdateModal;
