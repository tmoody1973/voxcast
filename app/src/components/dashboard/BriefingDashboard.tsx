"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { BriefingSection } from "./BriefingSection";
import { CorrelationCard, Correlation } from "./CorrelationCard";
import { Signal } from "./SignalCard";
import { format } from "date-fns";
import { useState } from "react";

interface BriefingDashboardProps {
  stationId: Id<"stations">;
  userId: Id<"users">;
}

export function BriefingDashboard({ stationId, userId }: BriefingDashboardProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Fetch latest briefing or by date
  const latestBriefing = useQuery(api.briefings.getLatest, { stationId });
  const briefingByDate = useQuery(
    api.briefings.getByDate,
    selectedDate ? { stationId, date: selectedDate } : "skip"
  );

  const briefing = selectedDate ? briefingByDate : latestBriefing;

  // Fetch recent briefings for history
  const recentBriefings = useQuery(api.briefings.listRecent, {
    stationId,
    limit: 7
  });

  // Mutations
  const markViewed = useMutation(api.briefings.markViewed);
  const acknowledgeSignal = useMutation(api.signals.acknowledge);
  const dismissSignal = useMutation(api.signals.dismiss);
  const acknowledgeCorrelation = useMutation(api.correlations.acknowledge);
  const dismissCorrelation = useMutation(api.correlations.dismiss);

  // Mark as viewed when loaded
  if (briefing && !briefing.viewedAt) {
    markViewed({ briefingId: briefing._id, userId });
  }

  // Handlers
  const handleAcknowledgeSignal = async (signalId: Id<"signals">) => {
    await acknowledgeSignal({ signalId, userId });
  };

  const handleDismissSignal = async (signalId: Id<"signals">) => {
    await dismissSignal({ signalId });
  };

  const handleAcknowledgeCorrelation = async (correlationId: Id<"signalCorrelations">) => {
    await acknowledgeCorrelation({ correlationId });
  };

  const handleDismissCorrelation = async (correlationId: Id<"signalCorrelations">) => {
    await dismissCorrelation({ correlationId, reason: "Dismissed from briefing" });
  };

  if (!briefing) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-3xl mb-4">
          📋
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Briefing Yet</h3>
        <p className="text-slate-400 text-center max-w-md">
          Your daily briefing will be generated when signals are detected.
          Check back later or connect integrations to start receiving intelligence.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Daily Briefing
          </h2>
          <p className="text-slate-400">
            {format(new Date(briefing.date), "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedDate || ""}
            onChange={(e) => setSelectedDate(e.target.value || null)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Latest</option>
            {recentBriefings?.map((b) => (
              <option key={b._id} value={b.date}>
                {format(new Date(b.date), "MMM d, yyyy")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Total Signals</p>
          <p className="text-2xl font-bold text-white mt-1">{briefing.stats.totalSignals}</p>
        </div>
        <div className="bg-red-600/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-xs text-red-400 uppercase tracking-wider">Urgent</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{briefing.stats.highSeverity}</p>
        </div>
        <div className="bg-orange-600/10 border border-orange-500/30 rounded-lg p-4">
          <p className="text-xs text-orange-400 uppercase tracking-wider">Collisions</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">{briefing.stats.collisionsDetected}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Generated</p>
          <p className="text-sm font-medium text-slate-300 mt-1">
            {format(briefing.generatedAt, "h:mm a")}
          </p>
        </div>
      </div>

      {/* Urgent Section */}
      <BriefingSection
        title="Urgent"
        icon="🚨"
        signals={(briefing.urgentSignals || []) as Signal[]}
        accentColor="red"
        defaultExpanded={true}
        onAcknowledge={handleAcknowledgeSignal}
        onDismiss={handleDismissSignal}
      />

      {/* Collisions & Correlations */}
      {briefing.correlationDetails && briefing.correlationDetails.length > 0 && (
        <div className="bg-orange-600/10 border border-orange-500/30 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-orange-500/30">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <h3 className="font-semibold text-orange-400">Collisions & Correlations</h3>
              <span className="bg-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {briefing.correlationDetails.length}
              </span>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {(briefing.correlationDetails as Correlation[]).map((correlation) => (
              <CorrelationCard
                key={correlation._id}
                correlation={correlation}
                onAcknowledge={handleAcknowledgeCorrelation}
                onDismiss={handleDismissCorrelation}
              />
            ))}
          </div>
        </div>
      )}

      {/* Watch Section */}
      <BriefingSection
        title="Watch"
        icon="👁️"
        signals={(briefing.watchSignals || []) as Signal[]}
        accentColor="amber"
        defaultExpanded={true}
        onAcknowledge={handleAcknowledgeSignal}
        onDismiss={handleDismissSignal}
      />

      {/* Momentum Section */}
      <BriefingSection
        title="Momentum"
        icon="🚀"
        signals={(briefing.momentumSignals || []) as Signal[]}
        accentColor="green"
        defaultExpanded={false}
        onAcknowledge={handleAcknowledgeSignal}
        onDismiss={handleDismissSignal}
      />

      {/* FYI Section */}
      <BriefingSection
        title="FYI"
        icon="📌"
        signals={(briefing.fyiSignals || []) as Signal[]}
        accentColor="blue"
        defaultExpanded={false}
        onAcknowledge={handleAcknowledgeSignal}
        onDismiss={handleDismissSignal}
      />

      {/* Footer */}
      {briefing.viewedAt && (
        <div className="text-center text-sm text-slate-500 pt-4 border-t border-slate-800">
          First viewed {format(briefing.viewedAt, "MMM d 'at' h:mm a")}
        </div>
      )}
    </div>
  );
}
