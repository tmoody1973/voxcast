"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();

  const handleComplete = () => {
    // TODO: Save onboarding completion to database
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="max-w-lg w-full mx-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
          {/* Welcome Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Welcome to Voxcast
            </h1>
            <p className="text-slate-400">
              {user?.firstName
                ? `Great to have you, ${user.firstName}!`
                : "Let's get your station set up."}
            </p>
          </div>

          {/* Info Cards */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-lg">
              <span className="text-2xl">📡</span>
              <div>
                <h3 className="font-semibold text-white">Station Pulse</h3>
                <p className="text-sm text-slate-400">
                  Real-time signals from across your station, surfacing what
                  matters most.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-lg">
              <span className="text-2xl">📋</span>
              <div>
                <h3 className="font-semibold text-white">Prep Briefs</h3>
                <p className="text-sm text-slate-400">
                  AI-generated summaries tailored to each role, delivered when
                  you need them.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-lg">
              <span className="text-2xl">🔮</span>
              <div>
                <h3 className="font-semibold text-white">Consequence Preview</h3>
                <p className="text-sm text-slate-400">
                  See the ripple effects of decisions before you make them.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleComplete}
            className="w-full py-3 px-6 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Enter Station Console
          </button>

          <p className="text-center text-xs text-slate-500 mt-4">
            Station setup and integrations coming in future updates
          </p>
        </div>
      </div>
    </div>
  );
}
