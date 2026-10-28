import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, getDashboardUrl } from './context/AuthContext';
import './style.css';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import OfficialLoginPage from './pages/public/OfficialLoginPage';
import SignupPage from './pages/public/SignupPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import UnauthorizedPage from './pages/public/UnauthorizedPage';
import NotFoundPage from './pages/public/NotFoundPage';

// Citizen Pages
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import SubmitGrievancePage from './pages/citizen/SubmitGrievancePage';
import MyGrievancesPage from './pages/citizen/MyGrievancesPage';

// Case Worker Pages
import WorkerDashboard from './pages/worker/WorkerDashboard';
import AssignedCasesPage from './pages/worker/AssignedCasesPage';

// Manager Pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import AllGrievancesPage from './pages/manager/AllGrievancesPage';
import OverdueGrievancesPage from './pages/manager/OverdueGrievancesPage';
import EscalationsPage from './pages/manager/EscalationsPage';
import AnalyticsPage from './pages/manager/AnalyticsPage';

// Administrator Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import SystemSettingsPage from './pages/admin/SystemSettingsPage';

// Shared Pages
import GrievanceDetailPage from './pages/shared/GrievanceDetailPage';

// Protected Route Guard
function Guard({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
          <span>Verifying secure session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    const isOfficialRoute = location.pathname.startsWith('/worker') ||
                            location.pathname.startsWith('/manager') ||
                            location.pathname.startsWith('/admin');
    const loginTarget = isOfficialRoute ? '/login/official' : '/login';
    return <Navigate to={loginTarget} state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

// Redirect helpers for generic paths like /grievances
function GrievancesRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'citizen') return <Navigate to="/citizen/grievances" replace />;
  if (user.role === 'case_worker') return <Navigate to="/worker/cases" replace />;
  return <Navigate to="/manager/grievances" replace />;
}

export function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/official" element={<OfficialLoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Citizen Pages */}
      <Route
        path="/citizen/dashboard"
        element={
          <Guard roles={['citizen']}>
            <CitizenDashboard />
          </Guard>
        }
      />
      <Route
        path="/citizen/submit"
        element={
          <Guard roles={['citizen']}>
            <SubmitGrievancePage />
          </Guard>
        }
      />
      <Route
        path="/citizen/grievances"
        element={
          <Guard roles={['citizen']}>
            <MyGrievancesPage />
          </Guard>
        }
      />

      {/* Case Worker Pages */}
      <Route
        path="/worker/dashboard"
        element={
          <Guard roles={['case_worker']}>
            <WorkerDashboard />
          </Guard>
        }
      />
      <Route
        path="/worker/cases"
        element={
          <Guard roles={['case_worker']}>
            <AssignedCasesPage />
          </Guard>
        }
      />

      {/* Manager Pages */}
      <Route
        path="/manager/dashboard"
        element={
          <Guard roles={['manager', 'admin']}>
            <ManagerDashboard />
          </Guard>
        }
      />
      <Route
        path="/manager/grievances"
        element={
          <Guard roles={['manager', 'admin']}>
            <AllGrievancesPage />
          </Guard>
        }
      />
      <Route
        path="/manager/overdue"
        element={
          <Guard roles={['manager', 'admin']}>
            <OverdueGrievancesPage />
          </Guard>
        }
      />
      <Route
        path="/manager/escalations"
        element={
          <Guard roles={['manager', 'admin']}>
            <EscalationsPage />
          </Guard>
        }
      />
      <Route
        path="/manager/analytics"
        element={
          <Guard roles={['manager', 'admin']}>
            <AnalyticsPage />
          </Guard>
        }
      />

      {/* Administrator Pages */}
      <Route
        path="/admin/dashboard"
        element={
          <Guard roles={['admin']}>
            <AdminDashboard />
          </Guard>
        }
      />
      <Route
        path="/admin/users"
        element={
          <Guard roles={['admin']}>
            <UserManagementPage />
          </Guard>
        }
      />
      <Route
        path="/admin/grievances"
        element={
          <Guard roles={['admin']}>
            <AllGrievancesPage />
          </Guard>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <Guard roles={['admin']}>
            <SystemSettingsPage />
          </Guard>
        }
      />

      {/* Shared Detail Page */}
      <Route
        path="/grievances/:id"
        element={
          <Guard>
            <GrievanceDetailPage />
          </Guard>
        }
      />
      <Route path="/grievances" element={<GrievancesRedirect />} />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}
