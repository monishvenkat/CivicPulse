import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { X, UserCheck, AlertCircle } from 'lucide-react';

export const AssignmentModal = ({ grievance, isOpen, onClose, onAssigned }) => {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.get('/users/workers')
        .then(data => setWorkers(data.workers || []))
        .catch(err => setError(err.message));
      setSelectedWorker(grievance?.assignee?._id || grievance?.assignee?.id || '');
      setReason('');
      setError('');
    }
  }, [isOpen, grievance]);

  if (!isOpen || !grievance) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWorker) {
      setError('Please select an active case worker.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await api.post(`/grievances/${grievance.id || grievance._id}/assign`, {
        workerId: selectedWorker,
        reason: reason.trim()
      });
      onAssigned(data.grievance);
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
            <UserCheck className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-sm text-slate-900">
              {grievance.assignee ? 'Reassign Grievance' : 'Assign Case Worker'}
            </h3>
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
            <span className="text-[10px] font-bold uppercase text-slate-500">Case Reference</span>
            <p className="text-xs font-mono font-bold text-slate-800">{grievance.reference}</p>
            <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{grievance.title}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Active Case Worker *
            </label>
            <select
              required
              value={selectedWorker}
              onChange={e => setSelectedWorker(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">-- Choose Case Worker --</option>
              {workers.map(w => (
                <option key={w._id || w.id} value={w._id || w.id}>
                  {w.name} {w.department ? `(${w.department})` : ''} · Active cases: {w.workload ?? 0}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assignment Reason or Instructions
            </label>
            <textarea
              rows="3"
              maxLength="500"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Provide context or specific routing notes for the case worker..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            <span className="text-[10px] text-slate-400 block text-right">{reason.length}/500</span>
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
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentModal;
