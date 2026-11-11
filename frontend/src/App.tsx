import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { VideoPreviewPage } from './pages/VideoPreviewPage';
import { CourtCalibrationPage } from './pages/CourtCalibrationPage';
import { ProcessingPage } from './pages/ProcessingPage';
import { MatchAnalysisPage } from './pages/MatchAnalysisPage';
import { MovementAnalysisPage } from './pages/MovementAnalysisPage';
import { ShotAnalysisPage } from './pages/ShotAnalysisPage';
import { RallyAnalysisPage } from './pages/RallyAnalysisPage';
import { PerformanceInsightsPage } from './pages/PerformanceInsightsPage';
import { MatchHistoryPage } from './pages/MatchHistoryPage';
import { MatchComparisonPage } from './pages/MatchComparisonPage';
import { PdfReportsPage } from './pages/PdfReportsPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { SharedMatchPage } from './pages/SharedMatchPage';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { OfflineBanner } from './components/ui/OfflineBanner';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080d1a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <OfflineBanner />
          <BrowserRouter>
            <Routes>
            <Route element={<AppLayout />}>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/shared/match/:shareToken" element={<SharedMatchPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matches/:id/preview"
              element={
                <ProtectedRoute>
                  <VideoPreviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matches/:id/calibrate"
              element={
                <ProtectedRoute>
                  <CourtCalibrationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matches/:id/processing"
              element={
                <ProtectedRoute>
                  <ProcessingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matches/:id/analysis"
              element={
                <ProtectedRoute>
                  <MatchAnalysisPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matches/:id/movement"
              element={
                <ProtectedRoute>
                  <MovementAnalysisPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matches/:id/shots"
              element={
                <ProtectedRoute>
                  <ShotAnalysisPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matches/:id/rallies"
              element={
                <ProtectedRoute>
                  <RallyAnalysisPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matches/:id/insights"
              element={
                <ProtectedRoute>
                  <PerformanceInsightsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <MatchHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/compare"
              element={
                <ProtectedRoute>
                  <MatchComparisonPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <PdfReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/privacy"
              element={
                <ProtectedRoute>
                  <PrivacyPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
