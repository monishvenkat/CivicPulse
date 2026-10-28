import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth, getDashboardUrl } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const UnauthorizedPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-lg">
        <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600">
          HTTP 403 · ACCESS RESTRICTED
        </span>
        <h2 className="text-xl font-bold text-slate-900 mt-1 mb-2">
          Permission Denied
        </h2>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          Your current account role <strong>({user?.role || 'Guest'})</strong> does not have permission to view or manage this resource. All administrative and management routes are protected by role-based server authentication.
        </p>

        <Link
          to={user ? getDashboardUrl(user) : '/login'}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-700 text-white text-xs font-bold shadow-xs hover:bg-emerald-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Your Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
