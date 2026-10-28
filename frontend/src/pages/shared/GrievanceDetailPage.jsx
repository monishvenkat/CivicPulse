import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import ActivityTimeline from '../../components/ActivityTimeline';
import AssignmentModal from '../../components/AssignmentModal';
import StatusUpdateModal from '../../components/StatusUpdateModal';
import ReopenModal from '../../components/ReopenModal';
import { useAuth, getDashboardUrl } from '../../context/AuthContext';
import api from '../../api/client';
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  AlertTriangle,
  Flame,
  CheckCircle2,
  UserCheck,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Share2
} from 'lucide-react';

export const GrievanceDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);

  const loadGrievance = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/grievances/${id}`);
      setGrievance(data.grievance);
    } catch (err) {
      setError(err.message || 'Failed to load grievance details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrievance();
  }, [id]);

  if (loading) {
    return (
      <AppLayout title="Loading Case Details...">
        <div className="flex items-center justify-center py-20 text-slate-500 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin mr-2 text-emerald-700" />
          <span>Retrieving case file from database...</span>
        </div>
      </AppLayout>
    );
  }

  if (error || !grievance) {
    return (
      <AppLayout title="Case Record Error">
        <div className="max-w-md mx-auto bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Unable to Open Grievance</h3>
          <p className="text-xs text-slate-600 mt-1 mb-6">{error || 'Record could not be retrieved.'}</p>
          <Link
            to={getDashboardUrl(user)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isOverdue = ['Resolved', 'Closed'].indexOf(grievance.status) === -1 && new Date(grievance.slaDeadline) < new Date();
  const isEscalated = grievance.escalation?.state === 'open' || grievance.escalation?.state === 'acknowledged';
  const canAssign = ['manager', 'admin'].includes(user?.role);
  const canUpdateStatus = ['case_worker', 'manager', 'admin'].includes(user?.role);
  const canReopen = ['Resolved', 'Closed'].includes(grievance.status) && (user?.role === 'citizen' || ['manager', 'admin'].includes(user?.role));

  const handleEscalationAck = async () => {
    try {
      await api.post(`/grievances/${grievance.id || grievance._id}/escalation/acknowledge`);
      setSuccessMsg('Escalation formally acknowledged.');
      loadGrievance();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AppLayout
      title={`Case File: ${grievance.reference}`}
      subtitle={`Submitted on ${new Date(grievance.submittedAt).toLocaleDateString()} · ${grievance.category}`}
    >
      <div className="space-y-6 max-w-5xl">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to previous view</span>
          </button>
          <div className="text-[10px] font-mono text-slate-400">
            ID: {grievance.id || grievance._id}
          </div>
        </div>

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-slate-400 hover:text-slate-600">×</button>
          </div>
        )}

        {/* Overdue / Escalation Alert Banners */}
        {isOverdue && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="font-bold text-rose-900 block">SLA Service Standard Exceeded</strong>
              <p className="text-rose-700 mt-0.5">
                This grievance was scheduled for resolution by{' '}
                <strong>{new Date(grievance.slaDeadline).toLocaleString()}</strong>. It is currently operating under deficit escalation.
              </p>
            </div>
          </div>
        )}

        {isEscalated && (
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs">
              <Flame className="w-5 h-5 text-purple-600 shrink-0" />
              <div>
                <strong className="font-bold text-purple-900 block">
                  Management Escalation ({grievance.escalation.state.toUpperCase()})
                </strong>
                <p className="text-purple-700 mt-0.5">
                  {grievance.escalation.reason || 'SLA deadline exceeded'}
                </p>
              </div>
            </div>
            {grievance.escalation.state === 'open' && canAssign && (
              <button
                type="button"
                onClick={handleEscalationAck}
                className="px-3 py-1.5 rounded-lg bg-purple-700 text-white font-semibold text-xs hover:bg-purple-800 shadow-2xs shrink-0"
              >
                Acknowledge Escalation
              </button>
            )}
          </div>
        )}

        {/* Primary Case Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {grievance.reference}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-xs font-semibold text-slate-600">{grievance.category}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {grievance.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <PriorityBadge priority={grievance.priority} />
              <StatusBadge status={grievance.status} size="lg" />
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Grievance Description & Impact
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              {grievance.description}
            </p>
          </div>

          {/* Meta Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Incident Location</span>
                <span className="font-semibold text-slate-800">{grievance.location}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">SLA Due Date</span>
                <span className="font-semibold text-slate-800">
                  {new Date(grievance.slaDeadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <User className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Personnel</span>
                <span className="font-semibold text-slate-800">
                  {grievance.assignee?.name ? `${grievance.assignee.name} (${grievance.assignee.department || 'Public Works'})` : 'Unassigned'}
                </span>
              </div>
            </div>
          </div>

          {/* Resolution Card if Resolved / Closed */}
          {grievance.resolutionNote && (
            <div className="p-5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Resolution Certificate</span>
                </span>
                <span className="text-[10px] text-emerald-700">
                  Resolved: {grievance.resolvedAt ? new Date(grievance.resolvedAt).toLocaleString() : 'Confirmed'}
                </span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                "{grievance.resolutionNote}"
              </p>
            </div>
          )}

          {/* Reopen Audit Details if Reopened */}
          {grievance.reopenedAt && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>Case Was Reopened on {new Date(grievance.reopenedAt).toLocaleString()}</span>
              </div>
              <p className="text-amber-800 italic">"{grievance.reopenReason}"</p>
            </div>
          )}

          {/* Action Bar */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {canAssign && (
                <button
                  type="button"
                  onClick={() => setShowAssignModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{grievance.assignee ? 'Reassign Staff' : 'Assign Case'}</span>
                </button>
              )}

              {canUpdateStatus && grievance.status !== 'Closed' && (
                <button
                  type="button"
                  onClick={() => setShowStatusModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 text-white font-semibold text-xs shadow-xs hover:bg-emerald-800 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Update Status / Resolve</span>
                </button>
              )}

              {canReopen && (
                <button
                  type="button"
                  onClick={() => setShowReopenModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold text-xs shadow-xs hover:bg-amber-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reopen Case</span>
                </button>
              )}
            </div>

            <span className="text-[10px] text-slate-400">
              Last updated: {new Date(grievance.updatedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Activity & Audit History Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Audit Trail & Activity Log</h3>
          <p className="text-xs text-slate-500 mb-6">
            Immutable chronological record of submissions, staff assignments, status transitions, and progress notes.
          </p>

          <ActivityTimeline
            history={grievance.history}
            assignmentHistory={grievance.assignmentHistory}
          />
        </div>
      </div>

      {/* Interactive Modals */}
      <AssignmentModal
        grievance={grievance}
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssigned={updated => {
          setGrievance(updated);
          setSuccessMsg('Case assignment updated successfully.');
        }}
      />

      <StatusUpdateModal
        grievance={grievance}
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onUpdated={updated => {
          setGrievance(updated);
          setSuccessMsg(`Status updated to ${updated.status}.`);
        }}
      />

      <ReopenModal
        grievance={grievance}
        isOpen={showReopenModal}
        onClose={() => setShowReopenModal(false)}
        onReopened={updated => {
          setGrievance(updated);
          setSuccessMsg('Case has been reopened and returned to In Progress.');
        }}
      />
    </AppLayout>
  );
};

export default GrievanceDetailPage;
