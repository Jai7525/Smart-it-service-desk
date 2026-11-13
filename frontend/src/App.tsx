import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppSidebar } from './components/AppSidebar';
import { TopNavbar } from './components/TopNavbar';
import { LoginPage } from './pages/LoginPage';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { CreateIncidentPage } from './pages/CreateIncidentPage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { AgentDashboard } from './pages/AgentDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ServiceCatalogPage } from './pages/ServiceCatalogPage';
import { MyServiceRequestsPage } from './pages/MyServiceRequestsPage';
import { ManagerApprovalCentrePage } from './pages/ManagerApprovalCentrePage';
import { ChangeManagementPage } from './pages/ChangeManagementPage';
import { ChangeCalendarPage } from './pages/ChangeCalendarPage';
import { AIAssistantPage } from './pages/AIAssistantPage';

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'employee':
      return <EmployeeDashboard />;
    case 'agent':
      return <AgentDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <EmployeeDashboard />;
  }
};

const ProtectedLayout: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Shared Application Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Routes>
            <Route path="/" element={<DashboardRouter />} />
            <Route path="/create-ticket" element={<CreateIncidentPage />} />
            <Route path="/tickets" element={<MyTicketsPage />} />
            <Route path="/knowledge" element={<KnowledgeBasePage />} />
            <Route path="/assigned-tickets" element={<AgentDashboard />} />
            <Route path="/service-catalog" element={<ServiceCatalogPage />} />
            <Route path="/my-requests" element={<MyServiceRequestsPage />} />
            <Route path="/approvals" element={<ManagerApprovalCentrePage />} />
            <Route path="/changes" element={<ChangeManagementPage />} />
            <Route path="/change-calendar" element={<ChangeCalendarPage />} />
            <Route path="/ai-assistant" element={<AIAssistantPage />} />
            <Route path="/problems" element={<ManagerDashboard />} />
            <Route path="/correlation" element={<ManagerDashboard />} />
            <Route path="/automation" element={<ManagerDashboard />} />
            <Route path="/sla-policies" element={<AdminDashboard />} />
            <Route path="/teams" element={<AdminDashboard />} />
            <Route path="/users" element={<AdminDashboard />} />
            <Route path="/departments" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
