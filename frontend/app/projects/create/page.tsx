"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Project, createProject } from "@/lib/api";

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
    <div className="max-w-lg mx-auto mt-12 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Create New Project</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          name="name"
          placeholder="Project Name"
          value={form.name}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          name="code"
          placeholder="Project Code"
          value={form.code}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="date"
          name="start_date"
          value={form.start_date}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="date"
          name="end_date"
          value={form.end_date}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-green-500 text-white p-2 rounded disabled:opacity-50"
        >
          {mutation.isPending ? "Creating..." : "Create Project"}
        </button>
      </form>
    </div>
  );
}
