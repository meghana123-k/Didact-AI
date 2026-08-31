import React, { ReactNode } from "react";

interface CollapsibleSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  title: string;
  children: ReactNode;
}

const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  isOpen,
  onToggle,
  title,
  children,
}) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative
          z-50 md:z-auto
          left-0 top-0 md:top-auto
          h-full md:h-auto
          bg-white
          border-r border-gray-200
          shadow-lg md:shadow-none
          overflow-hidden
          transition-all duration-300 ease-in-out

          ${
            isOpen
              ? "w-72 translate-x-0"
              : "w-0 -translate-x-full md:translate-x-0"
          }
        `}
      >
        <div className="w-72 h-full p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm uppercase tracking-wide text-gray-400">
              {title}
            </h3>

            <button
              onClick={onToggle}
              className="
                p-2 rounded-lg
                text-gray-500
                hover:bg-gray-100
                transition
              "
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="h-[calc(100vh-80px)] overflow-y-auto">
            {children}
          </div>
        </div>
      </aside>

      {/* Open button */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="
            fixed left-4 top-20 z-30
            p-3
            bg-white
            border border-gray-200
            rounded-xl
            shadow-md
            text-gray-700
            hover:bg-gray-50
            transition
          "
          aria-label="Open sidebar"
        >
          ☰
        </button>
      )}
    </>
  );
};

export default CollapsibleSidebar;