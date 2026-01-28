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

    // Client-side quick check
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
      // Backend error messages are passed through here
      setError(err.message || "An unexpected error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl border border-slate-100">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-user-plus text-white text-3xl"></i>
        </div>
        <h2 className="text-3xl font-bold text-slate-800">Join DidAct AI</h2>
        <p className="text-slate-500 mt-2">Start your learning journey today</p>
      </div>

      {error && (
        <div
          className="mb-4 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2"
          role="alert"
        >
          <i className="fas fa-exclamation-circle text-lg"></i>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2"
            htmlFor="signup-name"
          >
            Full Name
          </label>
          <input
            id="signup-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300"
            placeholder="Alex Smith"
            disabled={loading}
            required
          />
        </div>
        <div>
          <label
            className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2"
            htmlFor="signup-email"
          >
            Email Address
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300"
            placeholder="alex@example.com"
            disabled={loading}
            required
          />
        </div>
        <div>
          <label
            className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2"
            htmlFor="signup-password"
          >
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300"
            placeholder="••••••••"
            disabled={loading}
            required
            minLength={6}
          />
          <p className="text-[10px] text-slate-400 mt-2">
            Minimum 6 characters required.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:translate-y-[-1px] active:translate-y-[1px] disabled:opacity-50 disabled:translate-y-0 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <i className="fas fa-circle-notch fa-spin"></i>
              Creating Profile...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm">
        <span className="text-slate-500 font-medium">Already a member?</span>
        <button
          onClick={onToggle}
          className="ml-2 text-blue-600 font-bold hover:underline decoration-2 underline-offset-4"
          disabled={loading}
        >
          Log In
        </button>
      </div>
    </div>
  );
};

export default Signup;
