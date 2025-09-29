"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Timesheet {
  id?: string;
  project: number; // ForeignKey id
  worker: number;  // ForeignKey id
  date: string;
  hours: number;
  description: string;
}

const createTimesheet = async (ts: Timesheet): Promise<Timesheet> => {
  const res = await api.post("/timesheets/", ts);
  return res.data as Timesheet;
};

export default function TimesheetCreatePage() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<Timesheet>({
    project: 0,
    worker: 0,
    date: "",
    hours: 0,
    description: "",
  });

  const mutation = useMutation<Timesheet, Error, Timesheet>({
    mutationFn: createTimesheet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      setForm({
        project: 0,
        worker: 0,
        date: "",
        hours: 0,
        description: "",
      });
      alert("Timesheet created successfully");
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
        {mutation.isPending ? "Submitting..." : "Submit Timesheet"}
      </button>
    </form>
  );
}
