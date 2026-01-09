"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { BriefingDashboard } from "./BriefingDashboard";
import { useEffect, useState } from "react";

interface DashboardContentProps {
  clerkId: string;
  email: string;
  name: string;
}

export function DashboardContent({ clerkId, email, name }: DashboardContentProps) {
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Get user with station
  const userData = useQuery(api.users.getByClerkId, { clerkId });
  const createDemoSetup = useMutation(api.users.createDemoSetup);

  // Auto-create demo setup if user doesn't exist
  useEffect(() => {
    if (userData === null && !isSettingUp) {
      setIsSettingUp(true);
      createDemoSetup({ clerkId, email, name })
        .then(() => setIsSettingUp(false))
        .catch(() => setIsSettingUp(false));
    }
  }, [userData, clerkId, email, name, createDemoSetup, isSettingUp]);

  // Loading state
  if (userData === undefined || isSettingUp) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // User setup state (waiting for creation)
  if (userData === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Station Header */}
      <div className="mb-6 pb-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            {userData.station?.callLetters?.slice(0, 2) || "??"}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {userData.station?.name || "Your Station"}
            </h2>
            <p className="text-sm text-slate-400">
              {userData.station?.callLetters} • {userData.station?.market}
            </p>
          </div>
        </div>
      </div>

      {/* Briefing Dashboard */}
      <BriefingDashboard stationId={userData.stationId} userId={userData._id} />
    </div>
  );
}
