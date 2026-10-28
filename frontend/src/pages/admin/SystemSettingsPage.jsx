import React from 'react';
import AppLayout from '../../components/AppLayout';
import { Settings, Clock, ShieldCheck, Database, KeyRound, Server } from 'lucide-react';

export const SystemSettingsPage = () => {
  const slaPolicies = [
    { priority: 'Critical', hours: 4, description: 'Immediate public hazards, burst mains, live exposed electrical wires, road sinkholes.' },
    { priority: 'High', hours: 24, description: 'Dangerous potholes, traffic light failure, water discoloration, walkway blocks.' },
    { priority: 'Medium', hours: 48, description: 'Streetlight outages, park sanitation, standard drainage blockages.' },
    { priority: 'Low', hours: 72, description: 'Graffiti, general landscaping, non-hazardous municipal improvements.' }
  ];

  return (
    <AppLayout
      title="System & SLA Policy Configuration"
      subtitle="Operational governance parameters, automated SLA escalation policies, and security controls."
    >
      <div className="space-y-8 max-w-4xl">
        {/* SLA Standards Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Clock className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Service Level Agreement (SLA) Matrix</h3>
              <p className="text-xs text-slate-500">Configured baseline hours calculated from submission timestamp</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {slaPolicies.map(policy => (
              <div key={policy.priority} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-xs font-bold text-slate-900">{policy.priority} Priority</strong>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {policy.hours} Hours
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {policy.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <strong>Escalation Logic:</strong> Any unresolved grievance whose server-side deadline lapses is flagged as <code>OVERDUE</code> and elevated into the management escalation register automatically every 60 seconds.
          </div>
        </div>

        {/* Security & Token Configuration Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Security & Authentication Baseline</h3>
              <p className="text-xs text-slate-500">Cryptographic tokens, session isolation, and access control policies</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Session Cookie</span>
              <p className="font-bold text-slate-800">civic_session</p>
              <p className="text-[11px] text-slate-500 mt-1">HttpOnly, SameSite=Strict, 12h lifetime</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Password Hashing</span>
              <p className="font-bold text-slate-800">bcrypt (12 salt rounds)</p>
              <p className="text-[11px] text-slate-500 mt-1">10–72 chars with uppercase, lowercase, number</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Role Isolation</span>
              <p className="font-bold text-slate-800">Server-Side Verified</p>
              <p className="text-[11px] text-slate-500 mt-1">Role never trusted from frontend request body</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SystemSettingsPage;
