import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Voxcast
              </h1>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400 text-sm">Station Console</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">
                {user.firstName || user.emailAddresses[0]?.emailAddress}
              </span>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome to Station Pulse
          </h2>
          <p className="text-slate-400">
            Your AI-powered intelligence platform for cross-department insights.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <span className="text-blue-400 text-lg">📡</span>
              </div>
              <h3 className="font-semibold text-white">Active Signals</h3>
            </div>
            <p className="text-3xl font-bold text-white">0</p>
            <p className="text-sm text-slate-400 mt-1">
              No signals yet - connect integrations to start
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                <span className="text-purple-400 text-lg">🔗</span>
              </div>
              <h3 className="font-semibold text-white">Knowledge Graph</h3>
            </div>
            <p className="text-3xl font-bold text-white">0</p>
            <p className="text-sm text-slate-400 mt-1">
              Entities tracked in institutional memory
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                <span className="text-green-400 text-lg">✓</span>
              </div>
              <h3 className="font-semibold text-white">System Status</h3>
            </div>
            <p className="text-lg font-semibold text-green-400">Operational</p>
            <p className="text-sm text-slate-400 mt-1">
              All systems running normally
            </p>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="font-semibold text-white mb-4">Getting Started</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-slate-300">
              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Configure your station profile</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Connect your first integration (coming soon)</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Review your first Prep Brief (coming soon)</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
