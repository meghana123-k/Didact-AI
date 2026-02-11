import React, { useState } from "react";
import { authService } from "../services/authService";
import { User } from "../types";

interface SignupProps {
  onSuccess: (user: User, token: string) => void;
  onToggle: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSuccess, onToggle }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      return setError("All fields are required.");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);
    setError("");

    try {
      const data = await authService.signup(name, email, password);
      onSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-6">
      <div className="w-full max-w-md bg-[#1e293b] p-8 rounded-2xl border border-slate-700 shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">+</span>
          </div>

          <h2 className="text-3xl font-semibold text-slate-100">
            Join DidactAI
          </h2>

          <p className="text-slate-400 mt-2 text-sm">
            Begin your intelligent learning journey
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400 mb-2">
              Full Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-slate-700 text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
              placeholder="Alex Smith"
              disabled={loading}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400 mb-2">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-slate-700 text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
              placeholder="alex@example.com"
              disabled={loading}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400 mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-slate-700 text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
              placeholder="••••••••"
              disabled={loading}
              required
              minLength={6}
            />

            <p className="text-[10px] text-slate-500 mt-2">
              Minimum 6 characters required.
            </p>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-400">
          Already a member?
          <button
            onClick={onToggle}
            className="ml-2 text-indigo-400 hover:text-indigo-300 font-medium"
            disabled={loading}
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
