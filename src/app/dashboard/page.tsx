"use client";

import Sidebar from "@/components/Sidebar";
import { useState } from "react";
import { LayoutDashboard, Users, BarChart, Zap } from "lucide-react";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen w-full">
      <div className="flex h-full w-full overflow-hidden bg-white">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-8 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="p-6 border rounded-2xl bg-white shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                  <Zap className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-foreground/60">Total Generations</span>
              </div>
              <span className="text-3xl font-bold">1,284</span>
            </div>
            <div className="p-6 border rounded-2xl bg-white shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-foreground/60">Active Users</span>
              </div>
              <span className="text-3xl font-bold">452</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
