"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface AddSignalModalProps {
  stationId: Id<"stations">;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const INTEL_TYPES = [
  { value: "competitor_activity", label: "Competitor News", description: "Something a competitor is doing" },
  { value: "market_intelligence", label: "Market Insight", description: "Something happening in your market" },
  { value: "sales_intel", label: "Sales Tip", description: "Info from sales team or client conversations" },
  { value: "audience_feedback", label: "Listener Feedback", description: "What you're hearing from the audience" },
  { value: "internal_alert", label: "Internal Note", description: "Something staff should know" },
  { value: "donor.activity", label: "Donor Update", description: "News about a donor" },
  { value: "sponsor.activity", label: "Advertiser Update", description: "News about a sponsor or advertiser" },
  { value: "programming.change", label: "Programming Note", description: "Something about programming/content" },
];

const AREAS = [
  { value: "programming", label: "Programming" },
  { value: "sponsor", label: "Sales/Sponsors" },
  { value: "donor", label: "Development/Donors" },
  { value: "marketing", label: "Marketing" },
  { value: "membership", label: "Membership" },
  { value: "event", label: "Events" },
  { value: "grant", label: "Grants" },
] as const;

const PRIORITY_LEVELS = [
  { value: "high", label: "Urgent", color: "bg-red-500", description: "Act on this today" },
  { value: "medium", label: "Important", color: "bg-orange-500", description: "Review this week" },
  { value: "low", label: "Notable", color: "bg-yellow-500", description: "Good to know" },
  { value: "info", label: "FYI", color: "bg-blue-500", description: "For awareness only" },
] as const;

type Category = typeof AREAS[number]["value"];
type Severity = typeof PRIORITY_LEVELS[number]["value"];

export function AddSignalModal({ stationId, isOpen, onClose, onSuccess }: AddSignalModalProps) {
  const [type, setType] = useState(INTEL_TYPES[0].value);
  const [category, setCategory] = useState<Category>("programming");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const emitSignal = useMutation(api.signals.emit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await emitSignal({
        stationId,
        type,
        category,
        severity,
        title,
        description,
        sourceAgent: "system",
        metadata: source ? { source } : { source: "manual_entry" },
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        // Reset form
        setTitle("");
        setDescription("");
        setSource("");
        onSuccess?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create signal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setSuccess(false);
    setTitle("");
    setDescription("");
    setSource("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <h2 className="text-lg font-semibold text-white">Share Intel</h2>
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

        {/* Success State */}
        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Got it!</h3>
            <p className="text-slate-400 mb-6">Your intel has been logged and will appear in your next briefing.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleAddAnother}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Add Another
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">What is this about?</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {INTEL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                {INTEL_TYPES.find((t) => t.value === type)?.description}
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Area</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {AREAS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
              <div className="grid grid-cols-4 gap-2">
                {PRIORITY_LEVELS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSeverity(s.value)}
                    className={`p-2 rounded-lg border transition-all ${
                      severity === s.value
                        ? "border-white bg-slate-800"
                        : "border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${s.color} mx-auto mb-1`} />
                    <span className="text-xs text-slate-300">{s.label}</span>
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {PRIORITY_LEVELS.find((s) => s.value === severity)?.description}
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Quick Summary *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What happened in one line?"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Details *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you observe? Include relevant context..."
                required
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Source (Optional) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Source (Optional)</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Where did this info come from?"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title || !description}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Add Signal"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
