"use client";

interface ChatFabProps {
  onClick: () => void;
  isOpen: boolean;
}

export function ChatFab({ onClick, isOpen }: ChatFabProps) {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all z-40 flex items-center justify-center group"
      aria-label="Open Station Agent"
    >
      <span className="text-2xl group-hover:scale-110 transition-transform">🤖</span>

      {/* Pulse effect */}
      <span className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-20" />

      {/* Tooltip */}
      <span className="absolute right-full mr-3 px-3 py-1.5 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Ask Station Agent
      </span>
    </button>
  );
}
