"use client";

import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { SourcesPanel } from "./SourcesPanel";
import { ChatPanel } from "./ChatPanel";
import { StudioPanel } from "./StudioPanel";

interface StationWorkspaceProps {
  stationId: Id<"stations">;
  stationName: string;
  stationCallLetters: string;
  userId: Id<"users">;
}

export function StationWorkspace({
  stationId,
  stationName,
  stationCallLetters,
  userId,
}: StationWorkspaceProps) {
  const [selectedSourceId, setSelectedSourceId] = useState<Id<"sources"> | null>(null);
  const [sourcesCollapsed, setSourcesCollapsed] = useState(false);
  const [studioCollapsed, setStudioCollapsed] = useState(false);

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sources Panel - Left */}
      <div
        className={`${
          sourcesCollapsed ? "w-12" : "w-80"
        } flex-shrink-0 border-r border-slate-700 transition-all duration-300 flex flex-col bg-slate-900/50`}
      >
        <SourcesPanel
          stationId={stationId}
          collapsed={sourcesCollapsed}
          onToggleCollapse={() => setSourcesCollapsed(!sourcesCollapsed)}
          selectedSourceId={selectedSourceId}
          onSelectSource={setSelectedSourceId}
        />
      </div>

      {/* Chat Panel - Center */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
        <ChatPanel
          stationId={stationId}
          userId={userId}
          selectedSourceId={selectedSourceId}
        />
      </div>

      {/* Studio Panel - Right */}
      <div
        className={`${
          studioCollapsed ? "w-12" : "w-72"
        } flex-shrink-0 border-l border-slate-700 transition-all duration-300 flex flex-col bg-slate-900/50`}
      >
        <StudioPanel
          stationId={stationId}
          collapsed={studioCollapsed}
          onToggleCollapse={() => setStudioCollapsed(!studioCollapsed)}
        />
      </div>
    </div>
  );
}
