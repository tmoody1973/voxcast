"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface StudioPanelProps {
  stationId: Id<"stations">;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

// Agent types that can generate outputs
type AgentId = "station" | "sarah" | "marcus" | "diana" | "jordan" | "party";

interface OutputType {
  id: string;
  icon: string;
  label: string;
  description: string;
  defaultPrompt: string;
  available: boolean;
  agent: AgentId; // Which agent generates this
  category: "standard" | "development" | "marketing" | "underwriting" | "programming";
}

// Agent info for display
const AGENTS: Record<AgentId, { name: string; emoji: string; color: string; role: string }> = {
  station: { name: "Station Agent", emoji: "🎯", color: "blue", role: "General" },
  sarah: { name: "Sarah", emoji: "❤️", color: "pink", role: "Development" },
  marcus: { name: "Marcus", emoji: "📣", color: "orange", role: "Marketing" },
  diana: { name: "Diana", emoji: "💼", color: "green", role: "Underwriting" },
  jordan: { name: "Jordan", emoji: "🎙️", color: "purple", role: "Programming" },
  party: { name: "All Agents", emoji: "🎉", color: "gradient", role: "Collaborative" },
};

const AGENT_BADGE_COLORS: Record<string, string> = {
  blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  pink: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  green: "bg-green-500/20 text-green-400 border-green-500/30",
  purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  gradient: "bg-gradient-to-r from-pink-500/20 to-blue-500/20 text-purple-400 border-purple-500/30",
};

const OUTPUT_TYPES: OutputType[] = [
  // Standard Formats (any agent can help)
  {
    id: "create-your-own",
    icon: "✏️",
    label: "Create Your Own",
    description: "Craft reports your way by specifying structure, style, and tone",
    defaultPrompt: "",
    available: true,
    agent: "station",
    category: "standard",
  },
  {
    id: "briefing-doc",
    icon: "📋",
    label: "Briefing Doc",
    description: "Overview of your sources featuring key insights and quotes",
    defaultPrompt: "Create a comprehensive briefing document that synthesizes the main themes and ideas from the sources. Start with a concise Executive Summary that presents the most critical takeaways upfront. The body of the document must provide a detailed and thorough examination of the main themes, evidence, and conclusions found in the sources. This analysis should be structured logically with headings and bullet points to ensure clarity. The tone must be objective and incisive.",
    available: true,
    agent: "station",
    category: "standard",
  },
  {
    id: "executive-summary",
    icon: "📊",
    label: "Executive Summary",
    description: "High-level overview for leadership and board members",
    defaultPrompt: "Create a concise executive summary suitable for board members or station leadership. Focus on the most important findings, strategic implications, and recommended actions. Keep it brief but comprehensive.",
    available: true,
    agent: "station",
    category: "standard",
  },

  // Sarah's Outputs (Development Director)
  {
    id: "donor-report",
    icon: "❤️",
    label: "Donor Report",
    description: "Major donor updates and cultivation strategies",
    defaultPrompt: "Create a donor report highlighting major gift prospects, recent giving patterns, and cultivation opportunities. Include donor engagement metrics, upcoming stewardship activities, and recommendations for deepening relationships with key supporters.",
    available: true,
    agent: "sarah",
    category: "development",
  },
  {
    id: "grant-proposal",
    icon: "📝",
    label: "Grant Proposal",
    description: "Foundation application draft with impact metrics",
    defaultPrompt: "Draft a grant proposal that articulates our station's mission, the specific program or initiative seeking funding, measurable outcomes, and organizational capacity. Include relevant audience data and community impact metrics.",
    available: true,
    agent: "sarah",
    category: "development",
  },
  {
    id: "pledge-drive-plan",
    icon: "📻",
    label: "Pledge Drive Plan",
    description: "On-air fundraising strategy and talking points",
    defaultPrompt: "Create a pledge drive planning document including campaign themes, goal breakdowns, on-air talking points, premium offers, and host briefing materials. Include best practices for drive pacing and listener engagement.",
    available: true,
    agent: "sarah",
    category: "development",
  },
  {
    id: "thank-you-letter",
    icon: "💌",
    label: "Thank You Letter",
    description: "Personalized donor acknowledgment templates",
    defaultPrompt: "Create donor thank you letter templates that feel personal and meaningful. Include variations for different giving levels and types (sustaining members, major donors, legacy society). Emphasize impact and connection to mission.",
    available: true,
    agent: "sarah",
    category: "development",
  },

  // Marcus's Outputs (Marketing Director)
  {
    id: "audience-analysis",
    icon: "👥",
    label: "Audience Analysis",
    description: "Listener demographics and engagement trends",
    defaultPrompt: "Create an audience analysis report covering listener demographics, listening habits, platform preferences, and engagement trends. Include insights on audience growth opportunities and competitive positioning in the market.",
    available: true,
    agent: "marcus",
    category: "marketing",
  },
  {
    id: "campaign-brief",
    icon: "📣",
    label: "Campaign Brief",
    description: "Marketing initiative strategy and messaging",
    defaultPrompt: "Create a marketing campaign brief including objectives, target audience, key messages, channels, timeline, and success metrics. Ensure alignment with station brand and strategic priorities.",
    available: true,
    agent: "marcus",
    category: "marketing",
  },
  {
    id: "community-guide",
    icon: "🤝",
    label: "Community Guide",
    description: "Engagement strategies and event planning",
    defaultPrompt: "Create a community engagement guide outlining strategies for deepening connections with listeners. Include event ideas, partnership opportunities, listener advisory councils, and ways to amplify community voices.",
    available: true,
    agent: "marcus",
    category: "marketing",
  },
  {
    id: "social-content",
    icon: "📱",
    label: "Social Content",
    description: "Platform-specific content calendar",
    defaultPrompt: "Create a social media content plan with platform-specific posts, engagement tactics, and a content calendar. Include best practices for each platform and ways to drive listening and membership.",
    available: true,
    agent: "marcus",
    category: "marketing",
  },

  // Diana's Outputs (Underwriting Director)
  {
    id: "sponsor-proposal",
    icon: "💼",
    label: "Sponsor Proposal",
    description: "Underwriting pitch deck for prospects",
    defaultPrompt: "Create a compelling underwriting proposal for a prospective sponsor. Include audience demographics, program alignment opportunities, sponsorship packages, pricing, and case studies of successful partnerships.",
    available: true,
    agent: "diana",
    category: "underwriting",
  },
  {
    id: "rate-card",
    icon: "💰",
    label: "Rate Card",
    description: "Underwriting pricing and packages",
    defaultPrompt: "Create an underwriting rate card with pricing for different dayparts, programs, and package options. Include value-adds, digital opportunities, and event sponsorship options.",
    available: true,
    agent: "diana",
    category: "underwriting",
  },
  {
    id: "partnership-report",
    icon: "📈",
    label: "Partnership Report",
    description: "Sponsor performance and renewal strategy",
    defaultPrompt: "Create a partnership report for an existing underwriter showing campaign performance, audience reach, and ROI metrics. Include recommendations for renewal and opportunities to expand the partnership.",
    available: true,
    agent: "diana",
    category: "underwriting",
  },

  // Jordan's Outputs (Program Director)
  {
    id: "programming-brief",
    icon: "🎙️",
    label: "Programming Brief",
    description: "Show performance and schedule analysis",
    defaultPrompt: "Create a programming brief analyzing show performance, audience flow, and schedule optimization opportunities. Include ratings trends, competitive analysis, and recommendations for schedule changes.",
    available: true,
    agent: "jordan",
    category: "programming",
  },
  {
    id: "content-calendar",
    icon: "📅",
    label: "Content Calendar",
    description: "Editorial planning and special coverage",
    defaultPrompt: "Create a content calendar for upcoming editorial priorities, special coverage, and seasonal programming. Include local story opportunities, network coordination, and cross-platform content strategy.",
    available: true,
    agent: "jordan",
    category: "programming",
  },
  {
    id: "show-analysis",
    icon: "📉",
    label: "Show Analysis",
    description: "Deep dive on specific program performance",
    defaultPrompt: "Create a detailed analysis of a specific show's performance including audience metrics, listener feedback, competitive positioning, and recommendations for improvement or growth.",
    available: true,
    agent: "jordan",
    category: "programming",
  },
];

interface GenerateModalProps {
  output: OutputType | null;
  onClose: () => void;
  onGenerate: (config: GenerationConfig) => void;
}

interface GenerationConfig {
  outputId: string;
  agentId: AgentId;
  prompt: string;
}

function GenerateModal({ output, onClose, onGenerate }: GenerateModalProps) {
  const [prompt, setPrompt] = useState(output?.defaultPrompt || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [view, setView] = useState<"formats" | "customize">(output?.id === "create-your-own" ? "customize" : "formats");
  const [selectedFormat, setSelectedFormat] = useState<OutputType | null>(output);

  if (!output) return null;

  const agent = AGENTS[output.agent];
  const badgeColor = AGENT_BADGE_COLORS[agent.color];

  const handleGenerate = () => {
    if (!selectedFormat) return;
    setIsGenerating(true);
    onGenerate({
      outputId: selectedFormat.id,
      agentId: selectedFormat.agent,
      prompt,
    });
  };

  const handleSelectFormat = (format: OutputType) => {
    setSelectedFormat(format);
    setPrompt(format.defaultPrompt);
    setView("customize");
  };

  // Get related formats (same category or standard)
  const relatedFormats = OUTPUT_TYPES.filter(
    (o) => o.available && (o.category === output.category || o.category === "standard") && o.id !== output.id
  ).slice(0, 3);

  // Format selection view
  if (view === "formats" && output.id !== "create-your-own") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-2xl mx-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Create report</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {/* Format Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-400 mb-3">Format</h4>
              <div className="grid grid-cols-2 gap-3">
                {/* Selected format highlighted */}
                <button
                  onClick={() => handleSelectFormat(output)}
                  className="p-4 rounded-xl bg-slate-800 border border-slate-600 text-left hover:border-slate-500 transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xl">{output.icon}</span>
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-white mb-1">{output.label}</p>
                  <p className="text-xs text-slate-400 line-clamp-2">{output.description}</p>
                </button>

                {/* Standard formats */}
                {OUTPUT_TYPES.filter(o => o.category === "standard" && o.id !== output.id && o.id !== "create-your-own").slice(0, 1).map((format) => (
                  <button
                    key={format.id}
                    onClick={() => handleSelectFormat(format)}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-left hover:border-slate-600 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xl">{format.icon}</span>
                      <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-white mb-1">{format.label}</p>
                    <p className="text-xs text-slate-400 line-clamp-2">{format.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Suggested Formats */}
            {relatedFormats.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <h4 className="text-sm font-medium text-slate-400">Suggested Format</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {relatedFormats.map((format) => {
                    const formatAgent = AGENTS[format.agent];
                    return (
                      <button
                        key={format.id}
                        onClick={() => handleSelectFormat(format)}
                        className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-left hover:border-slate-600 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xl">{format.icon}</span>
                          <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-white mb-1">{format.label}</p>
                        <p className="text-xs text-slate-400 line-clamp-2">{format.description}</p>
                        <div className="mt-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${AGENT_BADGE_COLORS[formatAgent.color]}`}>
                            {formatAgent.emoji} {formatAgent.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Customize view
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            {output.id !== "create-your-own" && (
              <button
                onClick={() => setView("formats")}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Create report</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Selected Format Display */}
          {selectedFormat && selectedFormat.id !== "create-your-own" && (
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedFormat.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{selectedFormat.label}</p>
                  <p className="text-xs text-slate-400">{selectedFormat.description}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded border ${badgeColor}`}>
                  {agent.emoji} {agent.name}
                </span>
              </div>
            </div>
          )}

          {/* Description/Instructions */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Describe the report you want to create
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Create a comprehensive briefing document that synthesizes the main themes and ideas from the sources..."
              rows={6}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function StudioPanel({ stationId, collapsed, onToggleCollapse }: StudioPanelProps) {
  const [selectedOutput, setSelectedOutput] = useState<OutputType | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Get existing outputs/briefings
  const briefings = useQuery(api.briefings.listRecent, { stationId, limit: 5 });

  const handleGenerateClick = (output: OutputType) => {
    if (!output.available) return;
    setSelectedOutput(output);
  };

  const handleGenerate = (config: GenerationConfig) => {
    setGeneratingId(config.outputId);
    setSelectedOutput(null);

    // TODO: Call actual generation action with agent context
    console.log("Generating:", config);
    setTimeout(() => {
      setGeneratingId(null);
    }, 3000);
  };

  const categories = [
    { id: "standard", label: "Standard Formats", icon: "📄" },
    { id: "development", label: "Sarah · Development", icon: "❤️", agentColor: "pink" },
    { id: "marketing", label: "Marcus · Marketing", icon: "📣", agentColor: "orange" },
    { id: "underwriting", label: "Diana · Underwriting", icon: "💼", agentColor: "green" },
    { id: "programming", label: "Jordan · Programming", icon: "🎙️", agentColor: "purple" },
  ];

  if (collapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Expand Studio"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="mt-4 flex flex-col gap-2">
          {OUTPUT_TYPES.filter((o) => o.available && o.category === "standard").map((output) => (
            <button
              key={output.id}
              onClick={() => {
                onToggleCollapse();
                handleGenerateClick(output);
              }}
              className="p-2 text-lg rounded-lg hover:bg-slate-800 transition-colors"
              title={output.label}
            >
              {output.icon}
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
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Studio</h2>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1">Generate reports from your sources</p>
      </div>

      {/* Output Types by Agent Category */}
      <div className="flex-1 overflow-y-auto">
        {categories.map((category) => {
          const outputs = OUTPUT_TYPES.filter((o) => o.category === category.id);
          if (outputs.length === 0) return null;

          return (
            <div key={category.id} className="p-3 border-b border-slate-700/50">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </h3>
              <div className="space-y-1">
                {outputs.map((output) => {
                  const agent = AGENTS[output.agent];
                  return (
                    <button
                      key={output.id}
                      onClick={() => handleGenerateClick(output)}
                      disabled={!output.available || generatingId === output.id}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                        output.available
                          ? generatingId === output.id
                            ? "bg-blue-600/20 border border-blue-500/30"
                            : "hover:bg-slate-800 border border-transparent"
                          : "opacity-40 cursor-not-allowed border border-transparent"
                      }`}
                    >
                      <span className="text-xl flex-shrink-0">
                        {generatingId === output.id ? (
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          output.icon
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium flex items-center gap-2">
                          {output.label}
                          {!output.available && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded">
                              Soon
                            </span>
                          )}
                        </p>
                        {generatingId === output.id ? (
                          <p className="text-xs text-blue-400">Generating with {agent.name}...</p>
                        ) : (
                          <p className="text-xs text-slate-500 truncate">{output.description}</p>
                        )}
                      </div>
                      {output.available && generatingId !== output.id && (
                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Outputs */}
      <div className="border-t border-slate-700">
        <div className="p-3">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Recent
          </h3>

          {briefings === undefined ? (
            <div className="text-center py-3">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : briefings.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-slate-500 text-xs">No outputs yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {briefings.slice(0, 3).map((briefing) => (
                <button
                  key={briefing._id}
                  className="w-full text-left p-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📋</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-medium truncate">
                        Daily Briefing
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {briefing.date}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Generate Modal */}
      {selectedOutput && (
        <GenerateModal
          output={selectedOutput}
          onClose={() => setSelectedOutput(null)}
          onGenerate={handleGenerate}
        />
      )}
    </div>
  );
}
