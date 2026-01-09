"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface Message {
  role: "user" | "assistant";
  content: string;
  agent?: Agent;
  sources?: string[];
}

interface ChatPanelProps {
  stationId: Id<"stations">;
  userId: Id<"users">;
  selectedSourceId: Id<"sources"> | null;
}

type AgentId = "station" | "sarah" | "marcus" | "diana" | "jordan" | "party";

interface Agent {
  id: AgentId;
  name: string;
  role: string;
  emoji: string;
  color: string;
  description: string;
}

const AGENTS: Agent[] = [
  {
    id: "station",
    name: "Station Agent",
    role: "General Consultant",
    emoji: "🎯",
    color: "blue",
    description: "Your strategic advisor for all things station management",
  },
  {
    id: "sarah",
    name: "Sarah",
    role: "Development Director",
    emoji: "❤️",
    color: "pink",
    description: "Expert in fundraising, donor relations, major gifts, and pledge drives",
  },
  {
    id: "marcus",
    name: "Marcus",
    role: "Marketing Director",
    emoji: "📣",
    color: "orange",
    description: "Specialist in campaigns, audience growth, and brand strategy",
  },
  {
    id: "diana",
    name: "Diana",
    role: "Underwriting Director",
    emoji: "💼",
    color: "green",
    description: "Focused on sponsors, underwriting sales, and business partnerships",
  },
  {
    id: "jordan",
    name: "Jordan",
    role: "Program Director",
    emoji: "🎙️",
    color: "purple",
    description: "Expert in programming, shows, content strategy, and on-air talent",
  },
  {
    id: "party",
    name: "Party Mode",
    role: "All Agents",
    emoji: "🎉",
    color: "gradient",
    description: "Collaborative mode with all directors working together",
  },
];

const AGENT_COLORS: Record<string, string> = {
  blue: "from-blue-500 to-blue-600",
  pink: "from-pink-500 to-rose-500",
  orange: "from-orange-500 to-amber-500",
  green: "from-emerald-500 to-green-500",
  purple: "from-purple-500 to-violet-500",
  gradient: "from-pink-500 via-purple-500 to-blue-500",
};

const AGENT_BG_COLORS: Record<string, string> = {
  blue: "bg-blue-500/10 border-blue-500/30",
  pink: "bg-pink-500/10 border-pink-500/30",
  orange: "bg-orange-500/10 border-orange-500/30",
  green: "bg-emerald-500/10 border-emerald-500/30",
  purple: "bg-purple-500/10 border-purple-500/30",
  gradient: "bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 border-purple-500/30",
};

const SUGGESTED_PROMPTS: Record<AgentId, string[]> = {
  station: [
    "What should I focus on today?",
    "Give me a station health check",
    "What are the key trends in my data?",
    "Help me prepare for my board meeting",
  ],
  sarah: [
    "Who are my lapsed major donors?",
    "How's our pledge drive performing?",
    "Identify donors at risk of lapsing",
    "Help me craft a major donor ask",
  ],
  marcus: [
    "What campaigns are performing well?",
    "How can we grow our audience?",
    "Analyze our social media presence",
    "Ideas for our next marketing push",
  ],
  diana: [
    "Which sponsors are up for renewal?",
    "Help me prepare a sponsor proposal",
    "Show me underwriting performance",
    "Find potential new sponsors",
  ],
  jordan: [
    "How are our shows performing?",
    "What content should we feature?",
    "Analyze listener engagement",
    "Programming recommendations for next quarter",
  ],
  party: [
    "Give me a full station briefing",
    "Identify cross-department opportunities",
    "What should leadership know this week?",
    "Help me plan our annual fund drive",
  ],
};

export function ChatPanel({ stationId, userId, selectedSourceId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent>(AGENTS[0]);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sources = useQuery(api.sources.list, { stationId });
  const selectedSource = selectedSourceId
    ? sources?.find((s) => s._id === selectedSourceId)
    : null;

  const chat = useAction(api.agent.chat);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    // Add agent context to the message
    const agentContext = selectedAgent.id !== "station"
      ? `[Agent: ${selectedAgent.name} - ${selectedAgent.role}]\n\n`
      : "";

    const sourceContext = selectedSource
      ? `[Context: User is viewing source "${selectedSource.name}"]\n\n`
      : "";

    setMessages((prev) => [...prev, { role: "user", content: userMessage, agent: selectedAgent }]);
    setIsLoading(true);

    try {
      const response = await chat({
        stationId,
        messages: [
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: agentContext + sourceContext + userMessage },
        ],
      });

      setMessages((prev) => [...prev, { role: "assistant", content: response, agent: selectedAgent }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I encountered an error processing your request. Please try again.",
          agent: selectedAgent,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowAgentPicker(false);
    // Clear messages when switching agents for a fresh context
    if (messages.length > 0) {
      setMessages([]);
    }
  };

  const hasNoSources = sources && sources.length === 0;
  const currentPrompts = SUGGESTED_PROMPTS[selectedAgent.id];

  return (
    <div className="h-full flex flex-col">
      {/* Header with Agent Selector */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {/* Agent Selector Button */}
          <button
            onClick={() => setShowAgentPicker(!showAgentPicker)}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-all ${
              AGENT_BG_COLORS[selectedAgent.color]
            } hover:opacity-80`}
          >
            <div
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                AGENT_COLORS[selectedAgent.color]
              } flex items-center justify-center text-white`}
            >
              <span>{selectedAgent.emoji}</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">{selectedAgent.name}</p>
              <p className="text-xs text-slate-400">{selectedAgent.role}</p>
            </div>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform ${
                showAgentPicker ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Source Focus & Clear */}
          <div className="flex items-center gap-2">
            {selectedSource && (
              <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg">
                Focused: {selectedSource.name}
              </span>
            )}
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Agent Picker Dropdown */}
        {showAgentPicker && (
          <div className="mt-3 p-2 bg-slate-800 rounded-xl border border-slate-700 space-y-1">
            {AGENTS.map((agent) => (
              <button
                key={agent.id}
                onClick={() => handleAgentSelect(agent)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  selectedAgent.id === agent.id
                    ? AGENT_BG_COLORS[agent.color]
                    : "hover:bg-slate-700"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                    AGENT_COLORS[agent.color]
                  } flex items-center justify-center text-white flex-shrink-0`}
                >
                  <span className="text-lg">{agent.emoji}</span>
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{agent.name}</p>
                  <p className="text-xs text-slate-400">{agent.role}</p>
                  <p className="text-xs text-slate-500 truncate">{agent.description}</p>
                </div>
                {selectedAgent.id === agent.id && (
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="max-w-md text-center">
              {hasNoSources ? (
                <>
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Add sources to get started
                  </h3>
                  <p className="text-slate-400 mb-6">
                    Upload documents, spreadsheets, or notes to build your knowledge base.
                    Then {selectedAgent.name} can help you make sense of it all.
                  </p>
                </>
              ) : (
                <>
                  <div
                    className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br ${
                      AGENT_COLORS[selectedAgent.color]
                    } flex items-center justify-center`}
                  >
                    <span className="text-4xl">{selectedAgent.emoji}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {selectedAgent.id === "party"
                      ? "Party Mode Activated!"
                      : `Chat with ${selectedAgent.name}`}
                  </h3>
                  <p className="text-slate-400 mb-6">{selectedAgent.description}</p>
                  <div className="space-y-2">
                    {currentPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestedPrompt(prompt)}
                        className="block w-full text-left px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl text-sm text-slate-300 transition-all"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex items-start gap-2 max-w-[85%]`}>
                  {message.role === "assistant" && message.agent && (
                    <div
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                        AGENT_COLORS[message.agent.color]
                      } flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="text-sm">{message.agent.emoji}</span>
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-100"
                    }`}
                  >
                    {message.role === "assistant" && message.agent && (
                      <p className="text-xs text-slate-400 mb-1 font-medium">
                        {message.agent.name}
                      </p>
                    )}
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-700/50">
                        <p className="text-xs text-slate-400">
                          Sources: {message.sources.join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2">
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                      AGENT_COLORS[selectedAgent.color]
                    } flex items-center justify-center flex-shrink-0`}
                  >
                    <span className="text-sm">{selectedAgent.emoji}</span>
                  </div>
                  <div className="bg-slate-800 rounded-2xl px-4 py-3">
                    <p className="text-xs text-slate-400 mb-1 font-medium">{selectedAgent.name}</p>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-700">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedSource
                ? `Ask ${selectedAgent.name} about "${selectedSource.name}"...`
                : `Ask ${selectedAgent.name}...`
            }
            disabled={isLoading}
            rows={1}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`absolute right-2 bottom-2 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${
              AGENT_COLORS[selectedAgent.color]
            } text-white`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-2 text-center">
          {selectedAgent.id === "party"
            ? "All directors are collaborating on your question"
            : `Talking to ${selectedAgent.name} • Enter to send`}
        </p>
      </div>
    </div>
  );
}
