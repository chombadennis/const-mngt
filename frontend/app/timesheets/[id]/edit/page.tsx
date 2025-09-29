"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

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

  if (isFetching) return <p>Loading timesheet...</p>;
  if (isError) return <p>Error loading timesheet.</p>;

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4">
      <label className="block mb-2">Project ID</label>
      <input
        type="number"
        name="project"
        value={form.project}
        onChange={handleChange}
        className="input-field"
      />

      <label className="block mb-2 mt-4">Worker ID</label>
      <input
        type="number"
        name="worker"
        value={form.worker}
        onChange={handleChange}
        className="input-field"
      />

      <label className="block mb-2 mt-4">Date</label>
      <input
        type="date"
        name="date"
        value={form.date}
        onChange={handleChange}
        className="input-field"
      />

      <label className="block mb-2 mt-4">Hours</label>
      <input
        type="number"
        name="hours"
        value={form.hours}
        onChange={handleChange}
        className="input-field"
      />

      <label className="block mb-2 mt-4">Description</label>
      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        className="input-field"
      />

      <button type="submit" className="btn mt-4" disabled={mutation.isPending}>
        {mutation.isPending ? "Updating..." : "Update Timesheet"}
      </button>
    </form>
  );
}
