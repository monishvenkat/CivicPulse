import React, { useState } from 'react';
import api from '../api/client';
import { X, RotateCcw, AlertCircle } from 'lucide-react';

export const ReopenModal = ({ grievance, isOpen, onClose, onReopened }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !grievance) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setError('Please provide a specific reason for reopening (at least 5 characters).');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await api.post(`/grievances/${grievance.id || grievance._id}/reopen`, {
        reason: reason.trim()
      });
      onReopened(data.grievance);
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
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-700" />
            <h3 className="font-bold text-sm text-slate-900">Reopen Grievance</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            Reopening will transition this grievance back to <strong className="text-slate-800">In Progress</strong> and notify the assigned department for further remediation.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reason for Reopening *
            </label>
            <textarea
              rows="4"
              required
              minLength="5"
              maxLength="1000"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Explain why the issue has recurred or why previous resolution was unsatisfactory..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 resize-none"
            />
            <span className="text-[10px] text-slate-400 block text-right">{reason.length}/1000</span>
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
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? 'Reopening...' : 'Confirm Reopen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReopenModal;
