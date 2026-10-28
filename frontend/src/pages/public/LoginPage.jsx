import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, getDashboardUrl } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage = () => {
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to appropriate role dashboard
  if (user) {
    if (user.role === 'citizen') {
      const destination = location.state?.from || '/citizen/dashboard';
      navigate(destination, { replace: true });
    } else {
      // If an official is already authenticated, send them to their official workspace
      const destination = location.state?.from || getDashboardUrl(user);
      navigate(destination, { replace: true });
    }
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const loggedUser = await login(email, password);

      // Verify that this account is a citizen
      if (loggedUser.role !== 'citizen') {
        // Disallow official account from entering citizen dashboard
        await logout();
        setError(`Official account detected (${loggedUser.role.replace('_', ' ')}). This login is for citizens only. Please use the Official Login portal.`);
        return;
      }

      const destination = location.state?.from || '/citizen/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-emerald-600 selection:text-white">
      {/* Subtle Official Login Hyperlink at the Extreme Far-Left Edge of the Webpage */}
      <div className="fixed bottom-6 left-6 z-30">
        <Link
          to="/login/official"
          className="text-xs text-slate-500 hover:text-emerald-700 underline underline-offset-4 transition-colors font-medium"
        >
          Official Login
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-sm">
            ✳
          </div>
          <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
            Civic<span className="text-emerald-700">Pulse</span>
          </span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Citizen Login
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Access your citizen dashboard, report civic issues, and track live resolutions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-lg border border-slate-200 rounded-2xl">
          {error && (
            <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="leading-relaxed block">{error}</span>
                {error.includes('Official') && (
                  <Link
                    to="/login/official"
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-2 mt-1.5"
                  >
                    <span>Proceed to Official Login</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Citizen Email Address
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="citizen@example.com"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full text-xs pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-700 text-white font-bold text-xs shadow-sm hover:bg-emerald-800 transition-colors disabled:opacity-50 mt-2 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-500">New to Civic Pulse? </span>
            <Link to="/signup" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
              Create Citizen Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
