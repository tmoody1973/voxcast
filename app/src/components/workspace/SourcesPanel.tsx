"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { AddSourceModal } from "./AddSourceModal";
import { SocialConnector } from "./SocialConnector";

interface SourcesPanelProps {
  stationId: Id<"stations">;
  collapsed: boolean;
  onToggleCollapse: () => void;
  selectedSourceId: Id<"sources"> | null;
  onSelectSource: (id: Id<"sources"> | null) => void;
}

const SOURCE_TYPE_ICONS: Record<string, string> = {
  document: "📄",
  spreadsheet: "📊",
  url: "🔗",
  note: "📝",
  audio: "🎧",
  video: "🎬",
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  document: "Documents",
  spreadsheet: "Data Files",
  url: "Web Links",
  note: "Notes & Intel",
  audio: "Audio",
  video: "Video",
};

export function SourcesPanel({
  stationId,
  collapsed,
  onToggleCollapse,
  selectedSourceId,
  onSelectSource,
}: SourcesPanelProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSocialConnectorOpen, setIsSocialConnectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);

  const sources = useQuery(api.sources.list, { stationId });
  const socialConnections = useQuery(api.socialConnections.getStatusSummary, { stationId });

  const filteredSources = sources?.filter((source) => {
    const matchesSearch =
      !searchQuery ||
      source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !filterType || source.type === filterType;
    return matchesSearch && matchesType;
  });

  // Group sources by type
  const groupedSources = filteredSources?.reduce(
    (acc, source) => {
      if (!acc[source.type]) acc[source.type] = [];
      acc[source.type].push(source);
      return acc;
    },
    {} as Record<string, typeof filteredSources>
  );

  if (collapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Expand Sources"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="mt-4 flex flex-col gap-2">
          {Object.entries(SOURCE_TYPE_ICONS).map(([type, icon]) => (
            <button
              key={type}
              onClick={() => {
                onToggleCollapse();
                setFilterType(type);
              }}
              className="p-2 text-lg hover:bg-slate-800 rounded-lg transition-colors"
              title={SOURCE_TYPE_LABELS[type]}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Sources</h2>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Add Sources Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-white font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add sources
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-slate-700/50">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sources..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <button
            onClick={() => setFilterType(null)}
            className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
              filterType === null
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            All
          </button>
          {Object.entries(SOURCE_TYPE_LABELS).map(([type, label]) => (
            <button
              key={type}
              onClick={() => setFilterType(type === filterType ? null : type)}
              className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                filterType === type
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {SOURCE_TYPE_ICONS[type]} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto">
        {sources === undefined ? (
          <div className="p-4 text-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : !filteredSources?.length ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center">
              <span className="text-2xl">📁</span>
            </div>
            <p className="text-slate-400 text-sm mb-1">
              {searchQuery || filterType ? "No matching sources" : "No sources yet"}
            </p>
            <p className="text-slate-500 text-xs">
              {searchQuery || filterType
                ? "Try adjusting your search or filter"
                : "Add PDFs, spreadsheets, URLs, or notes"}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {Object.entries(groupedSources || {}).map(([type, typeSources]) => (
              <div key={type} className="mb-4">
                <h3 className="px-2 py-1 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {SOURCE_TYPE_ICONS[type]} {SOURCE_TYPE_LABELS[type]} ({typeSources?.length || 0})
                </h3>
                <div className="space-y-1">
                  {typeSources?.map((source) => (
                    <button
                      key={source._id}
                      onClick={() =>
                        onSelectSource(source._id === selectedSourceId ? null : source._id)
                      }
                      className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                        source._id === selectedSourceId
                          ? "bg-blue-600/20 border border-blue-500/30"
                          : "hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg flex-shrink-0">{SOURCE_TYPE_ICONS[source.type]}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white font-medium truncate">{source.name}</p>
                          {source.description && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {source.description}
                            </p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(source._creationTime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Social Connections Section */}
      <div className="border-t border-slate-700">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <span>🔗</span>
              <span>Connected Data</span>
            </h3>
            <button
              onClick={() => setIsSocialConnectorOpen(true)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Manage
            </button>
          </div>

          {socialConnections === undefined ? (
            <div className="py-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : socialConnections.total === 0 ? (
            <button
              onClick={() => setIsSocialConnectorOpen(true)}
              className="w-full p-3 bg-slate-800/50 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-slate-600 rounded-lg transition-all text-center group"
            >
              <div className="flex justify-center gap-2 mb-2">
                <span className="text-lg opacity-60 group-hover:opacity-100 transition-opacity">📘</span>
                <span className="text-lg opacity-60 group-hover:opacity-100 transition-opacity">📸</span>
                <span className="text-lg opacity-60 group-hover:opacity-100 transition-opacity">📊</span>
              </div>
              <p className="text-xs text-slate-400 group-hover:text-slate-300">
                Connect social & analytics
              </p>
            </button>
          ) : (
            <div className="space-y-1.5">
              {socialConnections.platforms.map((platform) => (
                <div
                  key={platform.platform}
                  className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg"
                >
                  <span className="text-sm">
                    {platform.platform === "facebook" && "📘"}
                    {platform.platform === "instagram" && "📸"}
                    {platform.platform === "linkedin" && "💼"}
                    {platform.platform === "twitter" && "🐦"}
                    {platform.platform === "youtube" && "📺"}
                    {platform.platform === "google_analytics" && "📊"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{platform.accountName}</p>
                    <p className="text-[10px] text-slate-500">
                      {platform.lastSyncAt
                        ? `Synced ${new Date(platform.lastSyncAt).toLocaleDateString()}`
                        : "Not synced"}
                    </p>
                  </div>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      platform.status === "active"
                        ? "bg-green-500"
                        : platform.status === "error"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                    }`}
                  />
                </div>
              ))}
              <button
                onClick={() => setIsSocialConnectorOpen(true)}
                className="w-full p-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                + Connect more
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Source Modal */}
      <AddSourceModal
        stationId={stationId}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Social Connector Modal */}
      <SocialConnector
        stationId={stationId}
        isOpen={isSocialConnectorOpen}
        onClose={() => setIsSocialConnectorOpen(false)}
      />
    </div>
  );
}
