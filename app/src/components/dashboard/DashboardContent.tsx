"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { StationWorkspace } from "../workspace";
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
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // User setup state (waiting for creation)
  if (userData === null) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <StationWorkspace
      stationId={userData.stationId}
      stationName={userData.station?.name || "Your Station"}
      stationCallLetters={userData.station?.callLetters || "WXYZ"}
      userId={userData._id}
    />
  );
}
