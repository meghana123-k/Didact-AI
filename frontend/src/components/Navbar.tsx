import React from "react";
import { User } from "../types";

interface NavbarProps {
  user: User;
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  user,
  currentView,
  onViewChange,
  onLogout,
}) => {
  const navItems = [
    { id: "DASHBOARD", label: "Dashboard" },
    { id: "TOPICS", label: "Summaries" },
    { id: "QUIZ_GEN", label: "Assessments" },
    { id: "ANALYTICS", label: "Analytics" },
    { id: "CERTIFICATES", label: "Certificates" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#1e293b] border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div
          onClick={() => onViewChange("DASHBOARD")}
          className="cursor-pointer text-lg font-semibold text-indigo-400"
        >
          DidactAI
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`transition-colors ${
                currentView === item.id
                  ? "text-indigo-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm text-slate-200 font-medium">{user.name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>

          <button
            onClick={onLogout}
            className="px-3 py-2 text-xs rounded-xl bg-slate-700 hover:bg-red-600 hover:text-white transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
