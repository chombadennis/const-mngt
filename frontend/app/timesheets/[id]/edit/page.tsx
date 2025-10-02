"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import PMOnly from "@/components/auth/PMOnly";
import WorkerOnly from "@/components/auth/WorkerOnly";
import AdminOnly from "@/components/auth/AdminOnly";
import Link from "next/link";

interface Timesheet {
  id?: string;
  project: number;
  worker: number;
  date: string;
  hours: number;
  description: string;
}

const getTimesheetById = async (id: string): Promise<Timesheet> => {
  const res = await api.get(`/timesheets/${id}/`);
  return res.data as Timesheet;
};

const updateTimesheet = async (
  id: string,
  ts: Timesheet
): Promise<Timesheet> => {
  const res = await api.put(`/timesheets/${id}/`, ts);
  return res.data as Timesheet;
};

export default function EditTimesheetPage() {
  const params = useParams();
  const tsId = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isFetching, isError } = useQuery<Timesheet>({
    queryKey: ["timesheet", tsId],
    queryFn: () => getTimesheetById(tsId),
    enabled: !!tsId,
  });

  const [form, setForm] = useState<Timesheet>({
    project: 0,
    worker: 0,
    date: "",
    hours: 0,
    description: "",
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const mutation = useMutation<Timesheet, Error, Timesheet>({
    mutationFn: (updated: Timesheet) => updateTimesheet(tsId, updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      alert("Timesheet updated successfully");
      router.push("/timesheets");
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value =
      e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [e.target.name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (isFetching)
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gradient-to-br from-[#071433] to-[#0d3358]">
        <p>Loading timesheet...</p>
      </div>
    );
  if (isError)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400 bg-gradient-to-br from-[#071433] to-[#0d3358]">
        <p>Error loading timesheet.</p>
      </div>
    );

  return (
    <PMOnly fallback={<WorkerOnly fallback={<p className="text-center mt-20 text-white">You don’t have permission to edit this timesheet.</p>}>
      <></>
    </WorkerOnly>}>
      <div className="min-h-screen bg-gradient-to-br from-[#071433] to-[#0d3358] p-6">
        <div className="max-w-lg mx-auto bg-white/10 rounded-2xl shadow-md p-6">
          {/* Header */}
          <div className="rounded-2xl p-6 bg-gradient-to-r from-[#071433] to-[#0d3358] text-white shadow-md mb-6">
            <h1 className="text-2xl font-bold">Edit Timesheet</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-white">Project ID</label>
              <input
                type="number"
                name="project"
                value={form.project}
                onChange={handleChange}
                placeholder="Enter project ID"
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block mb-1 text-white">Worker ID</label>
              <input
                type="number"
                name="worker"
                value={form.worker}
                onChange={handleChange}
                placeholder="Enter worker ID"
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block mb-1 text-white">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block mb-1 text-white">Hours</label>
              <input
                type="number"
                name="hours"
                value={form.hours}
                onChange={handleChange}
                placeholder="Enter number of hours"
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block mb-1 text-white">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter description of work done"
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Updating..." : "Update Timesheet"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/timesheets"
              className="text-blue-300 hover:underline text-sm"
            >
              Back to Timesheets
            </Link>
          </div>
        </div>
      </div>
    </PMOnly>
  );
}
