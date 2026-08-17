import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from '@/store/useAppStore';

// Layout
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/components/pages/LoginPage';

// Pages
import Dashboard from '@/components/pages/Dashboard';
import StudentsPage from '@/components/pages/StudentsPage';
import TeachersPage from '@/components/pages/TeachersPage';
import ClassesPage from '@/components/pages/ClassesPage';
import SubjectsPage from '@/components/pages/SubjectsPage';
import AttendancePage from '@/components/pages/AttendancePage';
import TimetablePage from '@/components/pages/TimetablePage';
import DocumentAIPage from '@/components/pages/DocumentAIPage';
import AIPaperCorrectionPage from '@/components/pages/AIPaperCorrectionPage';
import AIAssistantPage from '@/components/pages/AIAssistantPage';
import ResourcePredictionPage from '@/components/pages/ResourcePredictionPage';
import AnalyticsPage from '@/components/pages/AnalyticsPage';
import NotificationsPage from '@/components/pages/NotificationsPage';
import ReportsPage from '@/components/pages/ReportsPage';
import SettingsPage from '@/components/pages/SettingsPage';
import AuditLogPage from '@/components/pages/AuditLogPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const theme = useAppStore(s => s.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="teachers" element={<TeachersPage />} />
            <Route path="classes" element={<ClassesPage />} />
            <Route path="subjects" element={<SubjectsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="timetable" element={<TimetablePage />} />
            <Route path="document-ai" element={<DocumentAIPage />} />
            <Route path="ai-paper-correction" element={<AIPaperCorrectionPage />} />
            <Route path="ai-assistant" element={<AIAssistantPage />} />
            <Route path="resource-prediction" element={<ResourcePredictionPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
            fontSize: '14px',
          },
        }}
      />
    </QueryClientProvider>
  );
}
