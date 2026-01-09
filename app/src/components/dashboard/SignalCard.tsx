"use client";

import { Id } from "../../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";

export interface Signal {
  _id: Id<"signals">;
  stationId: Id<"stations">;
  type: string;
  category: string;
  sourceAgent: string;
  severity: "info" | "low" | "medium" | "high";
  title: string;
  description: string;
  recommendedAction?: string;
  status: string;
  entityType?: string;
  entityId?: string;
  createdAt: number;
}

interface SignalCardProps {
  signal: Signal;
  onAcknowledge?: (id: Id<"signals">) => void;
  onDismiss?: (id: Id<"signals">) => void;
  compact?: boolean;
}

const severityConfig = {
  high: {
    bg: "bg-red-600/20",
    border: "border-red-500/50",
    text: "text-red-400",
    badge: "bg-red-600",
    label: "Urgent",
  },
  medium: {
    bg: "bg-amber-600/20",
    border: "border-amber-500/50",
    text: "text-amber-400",
    badge: "bg-amber-600",
    label: "Watch",
  },
  low: {
    bg: "bg-blue-600/20",
    border: "border-blue-500/50",
    text: "text-blue-400",
    badge: "bg-blue-600",
    label: "Low",
  },
  info: {
    bg: "bg-slate-600/20",
    border: "border-slate-500/50",
    text: "text-slate-400",
    badge: "bg-slate-600",
    label: "Info",
  },
};

const categoryIcons: Record<string, string> = {
  donor: "💰",
  programming: "🎙️",
  membership: "👥",
  underwriting: "📢",
  marketing: "📣",
  events: "🎪",
  digital: "💻",
  grants: "📋",
  engineering: "⚙️",
  default: "📡",
};

export function SignalCard({
  signal,
  onAcknowledge,
  onDismiss,
  compact = false,
}: SignalCardProps) {
  const config = severityConfig[signal.severity] || severityConfig.info;
  const icon = categoryIcons[signal.category] || categoryIcons.default;

  return (
    <div
      className={`${config.bg} border ${config.border} rounded-lg p-4 transition-all hover:scale-[1.01] cursor-pointer`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg shrink-0">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${config.badge} text-white`}
            >
              {config.label}
            </span>
            <span className="text-xs text-slate-500 capitalize">
              {signal.category}
            </span>
            <span className="text-xs text-slate-600">•</span>
            <span className="text-xs text-slate-500">
              {formatDistanceToNow(signal.createdAt, { addSuffix: true })}
            </span>
          </div>

          <h4 className="font-medium text-white truncate">{signal.title}</h4>

          {!compact && (
            <>
              <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                {signal.description}
              </p>

              {signal.recommendedAction && (
                <div className="mt-2 p-2 bg-slate-800/50 rounded border border-slate-700">
                  <p className="text-xs text-slate-500 mb-0.5">
                    Recommended Action
                  </p>
                  <p className="text-sm text-slate-300">
                    {signal.recommendedAction}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Source */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-500">
              via {signal.sourceAgent.replace("Agent", "")}
            </span>

            {/* Actions */}
            {!compact && (onAcknowledge || onDismiss) && (
              <div className="flex gap-2">
                {onAcknowledge && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAcknowledge(signal._id);
                    }}
                    className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
                {onDismiss && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismiss(signal._id);
                    }}
                    className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
