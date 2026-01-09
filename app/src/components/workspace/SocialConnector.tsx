"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface SocialConnectorProps {
  stationId: Id<"stations">;
  isOpen: boolean;
  onClose: () => void;
}

type Platform = "facebook" | "instagram" | "linkedin" | "twitter" | "youtube" | "google_analytics";

const PLATFORM_CONFIG: Record<Platform, { name: string; icon: string; description: string; color: string }> = {
  facebook: {
    name: "Facebook",
    icon: "📘",
    description: "Page insights, post performance, audience demographics",
    color: "bg-blue-600",
  },
  instagram: {
    name: "Instagram",
    icon: "📸",
    description: "Engagement metrics, stories, reels performance",
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
  },
  linkedin: {
    name: "LinkedIn",
    icon: "💼",
    description: "Company page analytics, post engagement",
    color: "bg-blue-700",
  },
  twitter: {
    name: "X (Twitter)",
    icon: "🐦",
    description: "Tweet analytics, follower growth, engagement",
    color: "bg-slate-800",
  },
  youtube: {
    name: "YouTube",
    icon: "📺",
    description: "Channel stats, video performance, audience retention",
    color: "bg-red-600",
  },
  google_analytics: {
    name: "Google Analytics",
    icon: "📊",
    description: "Website traffic, user behavior, conversions",
    color: "bg-orange-500",
  },
};

const SYNC_FREQUENCIES = [
  { value: "hourly", label: "Every hour" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
] as const;

export function SocialConnector({ stationId, isOpen, onClose }: SocialConnectorProps) {
  const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<Id<"socialConnections"> | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const connections = useQuery(api.socialConnections.list, { stationId });
  const availablePlatforms = useQuery(api.socialConnections.getAvailablePlatforms);

  const generateAuthUrl = useAction(api.socialConnections.generateAuthUrl);
  const disconnect = useMutation(api.socialConnections.disconnect);
  const updateSyncSettings = useMutation(api.socialConnections.updateSyncSettings);
  const syncPlatformData = useAction(api.socialConnections.syncPlatformData);

  const handleConnect = async (platform: Platform) => {
    setConnectingPlatform(platform);
    setConnectionError(null);
    try {
      const authUrl = await generateAuthUrl({
        stationId,
        platform,
        redirectUri: `${window.location.origin}/api/oauth/callback`,
      });
      // Open OAuth popup
      const popup = window.open(authUrl, "oauth", "width=600,height=700");

      // Listen for OAuth completion
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === "oauth_complete" && event.data.platform === platform) {
          popup?.close();
          window.removeEventListener("message", handleMessage);
          setConnectingPlatform(null);
        }
      };
      window.addEventListener("message", handleMessage);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect";
      setConnectionError(errorMessage);
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (connectionId: Id<"socialConnections">) => {
    if (confirm("Are you sure you want to disconnect this account?")) {
      await disconnect({ connectionId });
      setSelectedConnection(null);
    }
  };

  const handleSyncNow = async (connectionId: Id<"socialConnections">) => {
    try {
      await syncPlatformData({ connectionId });
    } catch (error) {
      console.error("Sync failed:", error);
    }
  };

  const handleUpdateSyncFrequency = async (
    connectionId: Id<"socialConnections">,
    syncFrequency: "hourly" | "daily" | "weekly"
  ) => {
    await updateSyncSettings({ connectionId, syncFrequency });
  };

  if (!isOpen) return null;

  const connectedPlatforms = new Set(connections?.map((c) => c.platform) || []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Connect Data Sources</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Link your social media and analytics accounts
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-8rem)]">
          {/* Connected Accounts */}
          {connections && connections.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Connected Accounts</h3>
              <div className="space-y-2">
                {connections.map((connection) => {
                  const config = PLATFORM_CONFIG[connection.platform as Platform];
                  const isSelected = selectedConnection === connection._id;

                  return (
                    <div key={connection._id}>
                      <button
                        onClick={() => setSelectedConnection(isSelected ? null : connection._id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          isSelected
                            ? "bg-slate-800 border border-slate-600"
                            : "bg-slate-800/50 hover:bg-slate-800 border border-transparent"
                        }`}
                      >
                        <span className="text-xl">{config.icon}</span>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-white">{connection.accountName}</p>
                          <p className="text-xs text-slate-400">{config.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              connection.status === "active"
                                ? "bg-green-500"
                                : connection.status === "error"
                                  ? "bg-red-500"
                                  : connection.status === "expired"
                                    ? "bg-yellow-500"
                                    : "bg-slate-500"
                            }`}
                          />
                          <svg
                            className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Expanded Settings */}
                      {isSelected && (
                        <div className="mt-2 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 space-y-4">
                          {/* Status */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">Status</span>
                            <span
                              className={`text-sm font-medium ${
                                connection.status === "active"
                                  ? "text-green-400"
                                  : connection.status === "error"
                                    ? "text-red-400"
                                    : "text-yellow-400"
                              }`}
                            >
                              {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
                            </span>
                          </div>

                          {/* Last Sync */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">Last synced</span>
                            <span className="text-sm text-white">
                              {connection.lastSyncAt
                                ? new Date(connection.lastSyncAt).toLocaleString()
                                : "Never"}
                            </span>
                          </div>

                          {/* Sync Frequency */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">Sync frequency</span>
                            <select
                              value={connection.syncFrequency}
                              onChange={(e) =>
                                handleUpdateSyncFrequency(
                                  connection._id,
                                  e.target.value as "hourly" | "daily" | "weekly"
                                )
                              }
                              className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {SYNC_FREQUENCIES.map((freq) => (
                                <option key={freq.value} value={freq.value}>
                                  {freq.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => handleSyncNow(connection._id)}
                              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              Sync Now
                            </button>
                            <button
                              onClick={() => handleDisconnect(connection._id)}
                              className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-lg transition-colors border border-red-600/30"
                            >
                              Disconnect
                            </button>
                          </div>

                          {connection.lastError && (
                            <div className="p-2 bg-red-900/20 border border-red-800/30 rounded-lg">
                              <p className="text-xs text-red-400">{connection.lastError}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Platforms */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3">
              {connections?.length ? "Add More Connections" : "Available Platforms"}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((platform) => {
                const config = PLATFORM_CONFIG[platform];
                const isConnected = connectedPlatforms.has(platform);
                const isConnecting = connectingPlatform === platform;

                return (
                  <button
                    key={platform}
                    onClick={() => !isConnected && !isConnecting && handleConnect(platform)}
                    disabled={isConnected || isConnecting}
                    className={`relative p-4 rounded-lg border transition-all ${
                      isConnected
                        ? "bg-slate-800/30 border-slate-700/50 cursor-default opacity-60"
                        : isConnecting
                          ? "bg-slate-800 border-blue-500/50 cursor-wait"
                          : "bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{config.icon}</span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-white">{config.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{config.description}</p>
                      </div>
                    </div>

                    {isConnected && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Connected
                        </span>
                      </div>
                    )}

                    {isConnecting && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-lg">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Display */}
          {connectionError && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-800/30 rounded-lg">
              <div className="flex gap-3">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm text-red-400 font-medium">Configuration Required</p>
                  <p className="text-xs text-red-300/80 mt-1">{connectionError}</p>
                  <button
                    onClick={() => setConnectionError(null)}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg">
            <div className="flex gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-sm text-white font-medium">How it works</p>
                <p className="text-xs text-slate-400 mt-1">
                  Connected accounts sync data automatically based on your frequency settings.
                  Your AI agents will use this data to provide insights about your social media
                  performance, audience engagement, and marketing opportunities.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {connections?.length || 0} account{connections?.length !== 1 ? "s" : ""} connected
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
