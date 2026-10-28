import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, getDashboardUrl } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';

export const OfficialLoginPage = () => {
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in
  if (user) {
    if (['case_worker', 'manager', 'admin'].includes(user.role)) {
      const destination = location.state?.from || getDashboardUrl(user);
      navigate(destination, { replace: true });
    } else {
      // If a logged-in citizen stumbles onto /login/official, redirect to their citizen dashboard
      navigate('/citizen/dashboard', { replace: true });
    }
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your official email address and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const loggedUser = await login(email, password);

      // Verify that this account is an authorized municipal official
      if (!['case_worker', 'manager', 'admin'].includes(loggedUser.role)) {
        // Log out citizen account so they are not authenticated into official portal
        await logout();
        setError('Citizen account detected. The Official Portal is restricted to case workers, managers, and administrators. Please use the Citizen Login.');
        return;
      }

      // Route to the verified role dashboard
      const destination = location.state?.from || getDashboardUrl(loggedUser);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-emerald-500 selection:text-white">
      {/* Return to Citizen Login Link at top left */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors underline underline-offset-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Citizen Login</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold text-2xl shadow-lg shadow-emerald-900/40 mb-4 border border-emerald-400/20">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Official Portal Login
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Authorized access for administrators, managers, and case workers.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 sm:px-8 shadow-2xl border border-slate-700/80 rounded-2xl">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">
                <span className="leading-relaxed block">{error}</span>
                {error.includes('Citizen') && (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 mt-2"
                  >
                    <span>Proceed to Citizen Login</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Official Email Address
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="official@civicpulse.local"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-600 bg-slate-900/80 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your security credentials"
                  className="w-full text-xs pl-9 pr-10 py-2.5 rounded-lg border border-slate-600 bg-slate-900/80 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 mt-5 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Official Portal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
            <span className="text-xs text-slate-400">Not a municipal official? </span>
            <Link
              to="/login"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
            >
              Citizen Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficialLoginPage;
