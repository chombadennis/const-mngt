"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { DashboardCard } from "../components/DashboardCard";
import AdminOnly from "@/components/auth/AdminOnly";
import PMOnly from "@/components/auth/PMOnly";
import WorkerOnly from "@/components/auth/WorkerOnly";
import { useState } from "react";

export interface Timesheet {
  id: string;
  worker: string; // worker id
  task: string | null; // task id or null
  hours: number;
  date: string;
  notes?: string;
  created_at: string;
}

// --- Fetch Timesheets ---
export const fetchTimesheets = async (): Promise<Timesheet[]> => {
  const res = await api.get<Timesheet[]>("/timesheets/");
  return res.data;
};

export default function TimesheetsPage() {
  const { data, isLoading, isError } = useQuery<Timesheet[]>({
    queryKey: ["timesheets"],
    queryFn: fetchTimesheets,
  });

  const [filter, setFilter] = useState("all");

  if (isLoading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#071433] to-[#0d3358] flex items-center justify-center text-white">
        <p className="text-lg">Loading timesheets...</p>
      </div>
    );

  if (isError)
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#071433] to-[#0d3358] flex items-center justify-center text-red-400">
        <p>Error loading timesheets.</p>
      </div>
    );

  const filtered = data ?? [];
  const shownCount = filtered.length;
  const totalCount = data?.length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071433] to-[#0d3358] p-6 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Timesheets</h1>
        <WorkerOnly>
          <Link
            href="/timesheets/create"
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition text-white font-medium mt-4 md:mt-0"
          >
            + Create Timesheet
          </Link>
        </WorkerOnly>
      </div>

      {/* Segmented Filters */}
      <div className="inline-flex rounded bg-white/5 p-1 mb-4">
        {["all", "this_week", "pending"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded transition ${
              filter === f
                ? "bg-white text-slate-900"
                : "text-white/90 hover:text-white"
            }`}
          >
            {f === "all"
              ? "All"
              : f === "this_week"
              ? "This Week"
              : "Pending Approval"}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-300 mb-6">
        {shownCount} of {totalCount} timesheets shown
      </p>

      {/* Timesheet Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-lg shadow-md">
          <p className="text-lg font-medium mb-2">No timesheets yet</p>
          <WorkerOnly>
            <Link
              href="/timesheets/create"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition text-white font-medium"
            >
              Create one now
            </Link>
          </WorkerOnly>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((ts) => (
            <div
              key={ts.id}
              className="bg-white/5 rounded-xl p-4 shadow-md flex flex-col justify-between"
            >
              <DashboardCard
                title={`Worker ${ts.worker}${
                  ts.task ? ` - Task ${ts.task}` : ""
                }`}
                value={`${ts.hours} hrs on ${ts.date}`}
              />
              <div className="flex space-x-2 mt-4">
                <Link
                  href={`/timesheets/${ts.id}/edit`}
                  className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-sm"
                >
                  Edit
                </Link>
                <AdminOnly>
                  <button className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-sm">
                    Delete
                  </button>
                </AdminOnly>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
