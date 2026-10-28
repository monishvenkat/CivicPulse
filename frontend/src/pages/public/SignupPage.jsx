import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, Phone, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const SignupPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.password.length < 10) {
      setError('Password must be at least 10 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(form);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-sm">
            ✳
          </div>
          <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
            Civic<span className="text-emerald-700">Pulse</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Create Citizen Account
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Join your community to report civic problems and track fast municipal resolution.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-lg border border-slate-200 rounded-2xl">
          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Account Created Successfully!</h3>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Your citizen account has been provisioned. You can now sign in to start submitting and tracking civic grievances.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 text-white font-bold text-xs shadow-sm hover:bg-emerald-800 transition-colors"
              >
                Continue to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    minLength="2"
                    maxLength="100"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Asha Patel"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number (Optional)
                </label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 012-3456"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password *
                </label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength="10"
                    maxLength="72"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="10+ characters (uppercase, lowercase, number)"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Must include uppercase, lowercase, and numeric characters.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-700 text-white font-bold text-xs shadow-sm hover:bg-emerald-800 transition-colors disabled:opacity-50 mt-4"
              >
                <span>{loading ? 'Creating Citizen Account...' : 'Register as Citizen'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          <div className="mt-6 text-center border-t border-slate-100 pt-4">
            <span className="text-xs text-slate-500">Already registered? </span>
            <Link to="/login" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
