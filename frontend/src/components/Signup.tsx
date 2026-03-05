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
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-b from-white to-indigo-50">
      {/* CARD */}
      <div className="w-full max-w-md bg-white p-10 rounded-2xl border border-gray-200 shadow-lg">
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
            +
          </div>

          <h2 className="text-3xl font-semibold text-gray-800">
            Join DidactAI
          </h2>

          <p className="text-gray-500 mt-2 text-sm">
            Begin your intelligent learning journey
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* NAME */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Full Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
              placeholder="Alex Smith"
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              placeholder="alex@example.com"
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />

            <p className="text-xs text-gray-400 mt-2">
              Minimum 6 characters required.
            </p>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* FOOTER */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Already a member?
          <button
            onClick={onToggle}
            disabled={loading}
            className="ml-2 text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
