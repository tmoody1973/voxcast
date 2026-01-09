"use client";

import { Id } from "../../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";

export interface Correlation {
  _id: Id<"signalCorrelations">;
  stationId: Id<"stations">;
  signalIds: Id<"signals">[];
  correlationType: "temporal" | "entity" | "category" | "collision";
  confidence: number;
  description: string;
  status: "active" | "acknowledged" | "dismissed";
  metadata?: {
    collisionType?: string;
    affectedDepartments?: string[];
    entityKey?: string;
    [key: string]: unknown;
  };
  createdAt: number;
}

interface CorrelationCardProps {
  correlation: Correlation;
  onAcknowledge?: (id: Id<"signalCorrelations">) => void;
  onDismiss?: (id: Id<"signalCorrelations">) => void;
}

const typeConfig = {
  collision: {
    icon: "⚡",
    bg: "bg-orange-600/20",
    border: "border-orange-500/50",
    text: "text-orange-400",
    label: "Collision",
  },
  temporal: {
    icon: "⏱️",
    bg: "bg-blue-600/20",
    border: "border-blue-500/50",
    text: "text-blue-400",
    label: "Temporal",
  },
  entity: {
    icon: "🔗",
    bg: "bg-purple-600/20",
    border: "border-purple-500/50",
    text: "text-purple-400",
    label: "Entity",
  },
  category: {
    icon: "📊",
    bg: "bg-green-600/20",
    border: "border-green-500/50",
    text: "text-green-400",
    label: "Category",
  },
};

export function CorrelationCard({
  correlation,
  onAcknowledge,
  onDismiss,
}: CorrelationCardProps) {
  const config = typeConfig[correlation.correlationType] || typeConfig.entity;

  const confidenceColor =
    correlation.confidence >= 80
      ? "text-green-400"
      : correlation.confidence >= 60
        ? "text-amber-400"
        : "text-slate-400";

  return (
    <div
      className={`${config.bg} border ${config.border} rounded-lg p-4 transition-all hover:scale-[1.01]`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg shrink-0">
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${config.text} bg-slate-800`}
            >
              {config.label}
            </span>
            <span className={`text-xs font-medium ${confidenceColor}`}>
              {correlation.confidence}% confidence
            </span>
            <span className="text-xs text-slate-600">•</span>
            <span className="text-xs text-slate-500">
              {formatDistanceToNow(correlation.createdAt, { addSuffix: true })}
            </span>
          </div>

          <p className="text-sm text-white">{correlation.description}</p>

          {/* Metadata */}
          {correlation.metadata?.affectedDepartments && (
            <div className="flex gap-1.5 mt-2">
              {correlation.metadata.affectedDepartments.map((dept) => (
                <span
                  key={dept}
                  className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded capitalize"
                >
                  {dept}
                </span>
              ))}
            </div>
          )}

          {/* Signal Count & Actions */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-500">
              {correlation.signalIds.length} signals linked
            </span>

            {/* Actions */}
            {(onAcknowledge || onDismiss) && (
              <div className="flex gap-2">
                {onAcknowledge && (
                  <button
                    onClick={() => onAcknowledge(correlation._id)}
                    className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(correlation._id)}
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
