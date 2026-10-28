import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth, getDashboardUrl } from '../../context/AuthContext';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  Users,
  ArrowRight,
  MapPin,
  Flame,
  Layers,
  Sparkles
} from 'lucide-react';

export const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-20 bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-extrabold text-xl shadow-xs">
              ✳
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-xl">
                Civic<span className="text-emerald-700">Pulse</span>
              </span>
              <span className="block text-[9px] font-semibold tracking-wider uppercase text-slate-400">
                Public Grievance Tracker · HACK-P423
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3">
            {user ? (
              <Link
                to={getDashboardUrl(user)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white font-semibold text-xs shadow-xs hover:bg-emerald-800 transition-colors"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 text-white font-semibold text-xs shadow-xs hover:bg-emerald-800 transition-colors"
                >
                  <span>Report an Issue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Your Voice, Our Responsibility.</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                Empowering Citizens.<br />
                <span className="text-emerald-700">Resolving Civic Issues</span> Fast.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Civic Pulse is an intelligent public grievance management system connecting citizens with local government departments. Submit reports with guaranteed SLAs, track live progress, and ensure civic accountability.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-700 text-white font-bold text-sm shadow-md hover:bg-emerald-800 hover:-translate-y-0.5 transition-all"
                >
                  <span>Submit a Grievance</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all shadow-2xs"
                >
                  <span>Track Existing Case</span>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80">
                <div>
                  <strong className="block text-2xl font-extrabold text-slate-900">4h – 72h</strong>
                  <span className="text-xs text-slate-500">Tiered SLA Guarantees</span>
                </div>
                <div>
                  <strong className="block text-2xl font-extrabold text-slate-900">100%</strong>
                  <span className="text-xs text-slate-500">Audit Trail Transparency</span>
                </div>
                <div>
                  <strong className="block text-2xl font-extrabold text-slate-900">4 Roles</strong>
                  <span className="text-xs text-slate-500">End-to-End Governance</span>
                </div>
              </div>
            </div>

            {/* Visual Card / Live Preview */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl relative">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-mono text-slate-400 ml-2">LIVE DISPATCH RADAR</span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    Active System
                  </span>
                </div>

                <div className="space-y-3.5 mt-4">
                  {/* Card 1 */}
                  <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-rose-800">CP-2026-1001</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                        Critical · 4h SLA
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 mt-1">Burst water main flooding residential street</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-rose-600" /> 4th Ave & Maple</span>
                      <span className="font-semibold text-rose-700">Auto-Escalated</span>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-slate-700">CP-2026-1003</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        In Progress
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 mt-1">Street light array flickering near school</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-indigo-600" /> Lincoln Middle School</span>
                      <span className="font-medium text-slate-600">Crew on site</span>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-emerald-800">CP-2026-1004</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                        Resolved
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 mt-1">Park waste bins emptied & sanitized</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Oak Ridge Park</span>
                      <span className="font-semibold text-emerald-700">Audit verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SLA & Feature Breakdown */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
              GUARANTEED CITIZEN SERVICE STANDARDS
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Strict Service Level Agreements (SLAs)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Every grievance is automatically categorized with a fixed SLA clock. Any case that exceeds its deadline triggers municipal escalation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl border border-rose-200 bg-rose-50/30">
              <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold mb-4">
                <Flame className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-900">Critical Priority</h4>
              <p className="text-2xl font-extrabold text-rose-700 my-1">4 Hours SLA</p>
              <p className="text-xs text-slate-600 mt-2">
                Water main bursts, live electrical hazards, road sinkholes, and imminent public safety emergencies.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-orange-200 bg-orange-50/30">
              <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-900">High Priority</h4>
              <p className="text-2xl font-extrabold text-orange-700 my-1">24 Hours SLA</p>
              <p className="text-xs text-slate-600 mt-2">
                Deep road potholes, broken traffic signals, contamination alerts, and blocked school walkways.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-amber-200 bg-amber-50/30">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-900">Medium Priority</h4>
              <p className="text-2xl font-extrabold text-amber-700 my-1">48 Hours SLA</p>
              <p className="text-xs text-slate-600 mt-2">
                Flickering streetlights, waste collection backlogs, drainage blockages, and public park facilities.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-emerald-200 bg-emerald-50/30">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-900">Low Priority</h4>
              <p className="text-2xl font-extrabold text-emerald-700 my-1">72 Hours SLA</p>
              <p className="text-xs text-slate-600 mt-2">
                Graffiti removal, lawn maintenance, trail signage, non-hazardous general municipal inquiries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-900 text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm">Civic<span className="text-emerald-400">Pulse</span></span>
            <span className="text-slate-400">· HACK-P423 Hackathon Submission</span>
          </div>
          <div className="text-slate-400">
            Public Grievance Management System · Secure Instance
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
