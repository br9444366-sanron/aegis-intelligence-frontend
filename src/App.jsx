import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { DataProvider }          from './context/DataContext.jsx';
import { NotificationProvider }  from './context/NotificationContext.jsx';
import Layout         from './components/Layout.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import AuthPage       from './pages/AuthPage.jsx';

const Home        = lazy(() => import('./pages/Home.jsx'));
const Goals       = lazy(() => import('./pages/Goals.jsx'));
const Schedule    = lazy(() => import('./pages/Schedule.jsx'));
const Diary       = lazy(() => import('./pages/Diary.jsx'));
const ActivityLog = lazy(() => import('./pages/ActivityLog.jsx'));
const Events      = lazy(() => import('./pages/Events.jsx'));
const Scores      = lazy(() => import('./pages/Scores.jsx'));
const AIMemory    = lazy(() => import('./pages/AIMemory.jsx'));
const YouTube     = lazy(() => import('./pages/YouTube.jsx'));
const Settings    = lazy(() => import('./pages/Settings.jsx'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen message="Initializing Aegis..." />;
  if (!user)   return <Navigate to="/auth" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen message="Initializing Aegis..." />;
  if (user)    return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <NotificationProvider>
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#111118',
                  color: '#f1f5f9',
                  border: '1px solid rgba(110,80,190,0.25)',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontFamily: "'Inter',sans-serif",
                },
                success: { iconTheme: { primary: '#34d399', secondary: '#111118' } },
                error:   { iconTheme: { primary: '#f87171', secondary: '#111118' } },
              }}
            />
            <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
              <Routes>
                <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index             element={<Home />} />
                  <Route path="goals"      element={<Goals />} />
                  <Route path="schedule"   element={<Schedule />} />
                  <Route path="diary"      element={<Diary />} />
                  <Route path="activity"   element={<ActivityLog />} />
                  <Route path="events"     element={<Events />} />
                  <Route path="scores"     element={<Scores />} />
                  <Route path="ai-memory"  element={<AIMemory />} />
                  <Route path="youtube"    element={<YouTube />} />
                  <Route path="settings"   element={<Settings />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </NotificationProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
