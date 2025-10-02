 "use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Project, createProject } from "@/lib/api";
import AdminOnly from "@/components/auth/AdminOnly";

export default function CreateProjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<Omit<Project, "id" | "company" | "created_at">>({
    name: "",
    code: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "planning",
  });

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      alert("Project created successfully");
      router.push("/projects");
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <AdminOnly>
      <div className="max-w-md mx-auto mt-12 p-6 bg-white shadow-lg rounded-2xl">
        {/* Gradient header bar */}
        <div
          style={{ background: "linear-gradient(90deg,#071433,#0d3358)" }}
          className="p-4 rounded-xl mb-6"
        >
          <h1 className="text-2xl font-bold mb-0 text-white">Create Project</h1>
          <p className="text-sm text-white/90 mt-1">Add a new project to your workspace</p>
        </div>

        {mutation.isError && (
          <div className="mb-4 text-red-500 text-sm">
            {(mutation.error as any)?.message ?? "Failed to create project."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
            <input
              name="name"
              placeholder="Project Name"
              value={form.name}
              onChange={handleChange}
              className="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Project Code</label>
            <input
              name="code"
              placeholder="e.g. PROJ-001"
              value={form.code}
              onChange={handleChange}
              className="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              name="description"
              placeholder="Short description of the project"
              value={form.description}
              onChange={handleChange}
              className="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                className="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                className="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="bg-green-500 text-white p-3 rounded-2xl shadow hover:bg-green-600 transition disabled:opacity-50 flex-1 text-center"
            >
              {mutation.isPending ? "Creating..." : "Create Project"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/projects")}
              className="border border-slate-200 text-slate-700 p-3 rounded-2xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminOnly>
  );
}
