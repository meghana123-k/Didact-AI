import React, { useState, useEffect } from "react";
import { User } from "./types";

import { logoutUser } from "./services/storageService";
import { authService } from "./services/authService";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import UploadTopic from "./pages/UploadTopic";
import QuizPage from "./pages/QuizPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import CertificatePage from "./pages/CertificatePage";

import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

export enum View {
  LOGIN = "LOGIN",
  SIGNUP = "SIGNUP",
  DASHBOARD = "DASHBOARD",
  TOPICS = "TOPICS",
  QUIZ_GEN = "QUIZ_GEN",
  ANALYTICS = "ANALYTICS",
  CERTIFICATES = "CERTIFICATES",
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.LOGIN);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      authService
        .getMe(token)
        .then((user) => {
          setCurrentUser(user);
          setCurrentView(View.DASHBOARD);
        })
        .catch(() => {
          localStorage.removeItem("token");
          setCurrentView(View.LOGIN);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleAuthSuccess = (user: User, token: string) => {
    localStorage.setItem("token", token);
    setCurrentUser(user);
    setCurrentView(View.DASHBOARD);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    logoutUser();
    setCurrentUser(null);
    setCurrentView(View.LOGIN);
  };

  // =========================
  // Dark Loading Screen
  // =========================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-slate-200">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Initializing DidactAI...</p>
        </div>
      </div>
    );
  }

  const renderAuth = () =>
    currentView === View.SIGNUP ? (
      <Signup
        onSuccess={handleAuthSuccess}
        onToggle={() => setCurrentView(View.LOGIN)}
      />
    ) : (
      <Login
        onSuccess={handleAuthSuccess}
        onToggle={() => setCurrentView(View.SIGNUP)}
      />
    );

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-slate-100">
      {/* =========================
          Navbar (Only if logged in)
      ========================= */}
      {currentUser && (
        <Navbar
          user={currentUser}
          currentView={currentView}
          onViewChange={(v) => setCurrentView(v as View)}
          onLogout={handleLogout}
        />
      )}

      {/* =========================
          Full Width Main Content
      ========================= */}
      <main className="flex-1 w-full bg-[#0f172a]">
        <ProtectedRoute isAuthenticated={!!currentUser} fallback={renderAuth()}>
          {currentView === View.DASHBOARD && <Dashboard />}
          {currentView === View.TOPICS && <UploadTopic user={currentUser!} />}
          {currentView === View.QUIZ_GEN && (
            <QuizPage
              user={currentUser!}
              onNavigate={(view) => setCurrentView(view)}
            />
          )}

          {currentView === View.ANALYTICS && (
            <AnalyticsPage user={currentUser!} />
          )}
          {currentView === View.CERTIFICATES && <CertificatePage />}
        </ProtectedRoute>
      </main>

      {/* =========================
          Footer (Dark)
      ========================= */}
      {currentUser && (
        <footer className="bg-[#0f172a] border-t border-slate-800 py-6 text-center text-slate-500 text-sm">
          © 2026 DidactAI — Intelligent Learning Insights Platform
        </footer>
      )}
    </div>
  );
};

export default App;
