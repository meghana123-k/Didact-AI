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
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* ===== LOGO ===== */}
        <div
          onClick={() => onViewChange("DASHBOARD")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          {/* Logo Icon */}
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
            <i className="fas fa-book-open text-white text-sm"></i>
          </div>

          {/* Logo Text */}
          <div className="text-lg font-semibold tracking-tight">
            <span className="text-gray-800 group-hover:text-indigo-600 transition">
              Didact
            </span>
            <span className="text-indigo-600 font-bold ml-1">AI</span>
          </div>
        </div>

        {/* ===== NAV LINKS ===== */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`relative transition-colors ${
                currentView === item.id
                  ? "text-indigo-600"
                  : "text-gray-600 hover:text-indigo-600"
              }`}
            >
              {item.label}

              {/* Active underline */}
              {currentView === item.id && (
                <span className="absolute left-0 -bottom-2 w-full h-[2px] bg-indigo-600 rounded-full"></span>
              )}
            </button>
          ))}
        </div>

        {/* ===== USER SECTION ===== */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm text-gray-800 font-semibold">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>

          <button
            onClick={onLogout}
            className="px-4 py-2 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-red-500 hover:text-white hover:border-red-500 transition"
          >
            Logout <i className="ml-1 fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
