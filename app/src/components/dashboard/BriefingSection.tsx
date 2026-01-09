"use client";

import { useState } from "react";
import { Signal, SignalCard } from "./SignalCard";
import { Id } from "../../../convex/_generated/dataModel";

interface BriefingSectionProps {
  title: string;
  icon: string;
  signals: Signal[];
  defaultExpanded?: boolean;
  accentColor: "red" | "amber" | "blue" | "purple" | "green";
  onAcknowledge?: (id: Id<"signals">) => void;
  onDismiss?: (id: Id<"signals">) => void;
}

const accentStyles = {
  red: {
    bg: "bg-red-600/10",
    border: "border-red-500/30",
    text: "text-red-400",
    badge: "bg-red-600",
    hover: "hover:bg-red-600/20",
  },
  amber: {
    bg: "bg-amber-600/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    badge: "bg-amber-600",
    hover: "hover:bg-amber-600/20",
  },
  blue: {
    bg: "bg-blue-600/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    badge: "bg-blue-600",
    hover: "hover:bg-blue-600/20",
  },
  purple: {
    bg: "bg-purple-600/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
    badge: "bg-purple-600",
    hover: "hover:bg-purple-600/20",
  },
  green: {
    bg: "bg-green-600/10",
    border: "border-green-500/30",
    text: "text-green-400",
    badge: "bg-green-600",
    hover: "hover:bg-green-600/20",
  },
};

export function BriefingSection({
  title,
  icon,
  signals,
  defaultExpanded = true,
  accentColor,
  onAcknowledge,
  onDismiss,
}: BriefingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const styles = accentStyles[accentColor];

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-xl overflow-hidden`}>
      {/* Header - clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-4 ${styles.hover} transition-colors`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h3 className={`font-semibold ${styles.text}`}>{title}</h3>
          <span
            className={`${styles.badge} text-white text-xs font-bold px-2 py-0.5 rounded-full`}
          >
            {signals.length}
          </span>
        </div>
        <svg
          className={`w-5 h-5 ${styles.text} transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          {signals.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">
              No signals in this section
            </p>
          ) : (
            signals.map((signal) => (
              <SignalCard
                key={signal._id}
                signal={signal}
                onAcknowledge={onAcknowledge}
                onDismiss={onDismiss}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
