export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center space-y-8 p-8">
        {/* Logo */}
        <div className="space-y-2">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Voxcast
          </h1>
          <p className="text-xl text-slate-400">
            Station Console
          </p>
        </div>

        {/* Tagline */}
        <p className="text-slate-300 max-w-md mx-auto">
          AI-powered intelligence platform for public radio stations.
          Your Chief of Staff for cross-department insights.
        </p>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          <span className="text-sm text-slate-400">Development Build</span>
        </div>

        {/* Quick Links */}
        <div className="flex gap-4 justify-center pt-4">
          <a
            href="/sign-in"
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Sign In
          </a>
          <a
            href="/sign-up"
            className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
          >
            Get Started
          </a>
        </div>

        {/* Tech Stack */}
        <div className="pt-8 text-xs text-slate-500 space-y-1">
          <p>Built with Next.js 15 + Convex + Clerk</p>
          <p>Station Pulse Architecture v1.0</p>
        </div>
      </div>
    </div>
  );
}
