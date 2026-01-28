import React from "react";
import { User } from "../types";

interface NavbarProps {
  user: User;
  currentView: string;
  onViewChange: (view: any) => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  user,
  currentView,
  onViewChange,
  onLogout,
}) => {
  const navItems = [
    { id: "DASHBOARD", label: "Courses", icon: "fa-book" },
    { id: "TOPICS", label: "Summaries", icon: "fa-file-alt" },
    { id: "QUIZ_GEN", label: "Assessments", icon: "fa-tasks" },
    { id: "ANALYTICS", label: "Analytics", icon: "fa-chart-line" },
    { id: "CERTIFICATES", label: "Certificates", icon: "fa-award" },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onViewChange("DASHBOARD")}
        >
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <i className="fas fa-graduation-cap text-white text-lg"></i>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            DidAct AI
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={
                currentView === item.id
                  ? "text-blue-600 font-bold underline decoration-2 underline-offset-8"
                  : "hover:text-blue-600"
              }
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
