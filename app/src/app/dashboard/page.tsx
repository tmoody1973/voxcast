import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Voxcast
              </h1>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400 text-sm">Station Pulse</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400 hidden sm:block">
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
        <DashboardContent
          clerkId={user.id}
          email={user.emailAddresses[0]?.emailAddress || ""}
          name={user.firstName || user.emailAddresses[0]?.emailAddress || "User"}
        />
      </main>
    </div>
  );
}
