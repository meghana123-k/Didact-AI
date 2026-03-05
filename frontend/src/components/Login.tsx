import React, { useState } from "react";
import { authService } from "../services/authService";
import { User } from "../types";

interface LoginProps {
  onSuccess: (user: User, token: string) => void;
  onToggle: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess, onToggle }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await authService.login(email, password);
      onSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-b from-white to-indigo-50">
      {/* CARD */}
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-10 shadow-lg">
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
            AI
          </div>

          <h2 className="text-3xl font-semibold text-gray-800">Welcome Back</h2>

          <p className="text-gray-500 mt-2 text-sm">
            Sign in to continue your learning journey
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Email Address
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Password</label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        {/* FOOTER */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Don’t have an account?
          <button
            onClick={onToggle}
            className="ml-2 text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
