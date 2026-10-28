import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, getDashboardUrl } from '../context/AuthContext';
import {
  LayoutDashboard,
  FilePlus,
  ListFilter,
  Briefcase,
  AlertTriangle,
  Flame,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Layers
} from 'lucide-react';

export const AppLayout = ({ children, title, subtitle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const isOfficial = user && ['case_worker', 'manager', 'admin'].includes(user.role);
    await logout();
    navigate(isOfficial ? '/login/official' : '/login');
  };

  const getNavLinks = () => {
    if (!user) return [];

    switch (user.role) {
      case 'citizen':
        return [
          { label: 'Dashboard', path: '/citizen/dashboard', icon: LayoutDashboard },
          { label: 'Submit Grievance', path: '/citizen/submit', icon: FilePlus },
          { label: 'My Grievances', path: '/citizen/grievances', icon: ListFilter }
        ];
      case 'case_worker':
        return [
          { label: 'Workload Dashboard', path: '/worker/dashboard', icon: LayoutDashboard },
          { label: 'Assigned Cases', path: '/worker/cases', icon: Briefcase }
        ];
      case 'manager':
        return [
          { label: 'Operations Command', path: '/manager/dashboard', icon: LayoutDashboard },
          { label: 'All Grievances', path: '/manager/grievances', icon: Layers },
          { label: 'Overdue Cases', path: '/manager/overdue', icon: AlertTriangle },
          { label: 'Escalations', path: '/manager/escalations', icon: Flame },
          { label: 'Analytics', path: '/manager/analytics', icon: BarChart3 }
        ];
      case 'admin':
        return [
          { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'User Management', path: '/admin/users', icon: Users },
          { label: 'All Grievances', path: '/admin/grievances', icon: Layers },
          { label: 'System & SLA Settings', path: '/admin/settings', icon: Settings }
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const roleColors = {
    citizen: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    case_worker: 'bg-blue-100 text-blue-800 border-blue-300',
    manager: 'bg-purple-100 text-purple-800 border-purple-300',
    admin: 'bg-amber-100 text-amber-800 border-amber-300'
  };

  const roleLabels = {
    citizen: 'Citizen Portal',
    case_worker: 'Case Worker',
    manager: 'Operations Manager',
    admin: 'System Administrator'
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col fixed inset-y-0 z-30">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Link to={getDashboardUrl(user)} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-lg shadow-xs">
              ✳
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-lg">Civic<span className="text-emerald-700">Pulse</span></span>
              <span className="block text-[9px] font-medium tracking-wide uppercase text-slate-500">Public Grievance Tracker</span>
            </div>
          </Link>
        </div>

        {/* User Role Banner */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-600">ROLE WORKSPACE</span>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${roleColors[user?.role] || 'bg-slate-100 text-slate-700'}`}>
            {user?.role?.replace('_', ' ')}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navLinks.map(link => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">
                  {roleLabels[user?.role] || 'Civic Pulse'}
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h1 className="text-sm md:text-base font-bold text-slate-900 leading-tight">
                {title || 'Civic Pulse Workspace'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Session</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                    isActive ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        )}

        {/* Body Container */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {subtitle && (
            <p className="text-xs text-slate-500 mb-6 -mt-2">{subtitle}</p>
          )}
          {children}
        </main>

        {/* Footer */}
        <footer className="py-4 px-8 border-t border-slate-200 text-center text-xs text-slate-400">
          Civic Pulse (HACK-P423) · Your Voice, Our Responsibility. · Full-Stack Public Grievance Tracker
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;
