"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DashboardCard } from "../components/DashboardCard";

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

  if (isLoading) return <p>Loading timesheets...</p>;
  if (isError) return <p>Error loading timesheets.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data?.map((ts) => (
        <DashboardCard
          key={ts.id}
          title={`Worker ${ts.worker}${ts.task ? ` - Task ${ts.task}` : ""}`}
          value={`${ts.hours} hrs on ${ts.date}`}
        />
      ))}
    </div>
  );
}
