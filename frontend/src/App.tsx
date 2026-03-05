import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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
import AboutDidactAI from "./pages/AboutDidactAI";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    authService
      .getMe(token)
      .then((user) => {
        setCurrentUser(user);
      })
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAuthSuccess = (user: User, token: string) => {
    localStorage.setItem("token", token);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    logoutUser();
    setCurrentUser(null);
  };

  /* Loading screen */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-indigo-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Initializing DidactAI...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-indigo-50 text-gray-800">
        {/* Navbar */}
        {currentUser && <Navbar user={currentUser} onLogout={handleLogout} />}

        {/* Main Content */}
        <main className="flex-1 w-full">
          <Routes>
            {/* Public routes */}

            <Route
              path="/login"
              element={
                currentUser ? (
                  <Navigate to="/" />
                ) : (
                  <Login onSuccess={handleAuthSuccess} />
                )
              }
            />

            <Route
              path="/signup"
              element={
                currentUser ? (
                  <Navigate to="/" />
                ) : (
                  <Signup onSuccess={handleAuthSuccess} />
                )
              }
            />

            {/* Protected routes */}

            <Route
              path="/"
              element={
                <ProtectedRoute isAuthenticated={!!currentUser}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/summaries"
              element={
                <ProtectedRoute isAuthenticated={!!currentUser}>
                  <UploadTopic user={currentUser!} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/assessments"
              element={
                <ProtectedRoute isAuthenticated={!!currentUser}>
                  <QuizPage user={currentUser!} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <ProtectedRoute isAuthenticated={!!currentUser}>
                  <AnalyticsPage user={currentUser!} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/certificates"
              element={
                <ProtectedRoute isAuthenticated={!!currentUser}>
                  <CertificatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/about"
              element={
                <ProtectedRoute isAuthenticated={!!currentUser}>
                  <AboutDidactAI />
                </ProtectedRoute>
              }
            />
            {/* fallback */}

            <Route
              path="*"
              element={<Navigate to={currentUser ? "/" : "/login"} />}
            />
          </Routes>
        </main>

        {/* Footer */}

        {currentUser && (
          <footer className="border-t border-gray-200 py-6 text-center text-gray-500 text-sm bg-white">
            © 2026 DidactAI — Intelligent Learning Insights Platform
          </footer>
        )}
      </div>
    </BrowserRouter>
  );
};

export default App;
