"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Project,
  Task,
  fetchProjectById,
  updateProject,
  createTask,
  updateTask,
  deleteTask,
} from "@/lib/api";
import { DashboardCard } from "@/app/components/DashboardCard";
import PMOnly from "@/components/auth/PMOnly";
import AdminOnly from "@/components/auth/AdminOnly";
import { useRouter } from "next/navigation";

// Extend Project type locally so tasks are recognized
type ProjectWithTasks = Project & { tasks?: Task[] };

export default function EditProjectPage() {
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading, isError } = useQuery<ProjectWithTasks>({
    queryKey: ["project", projectId],
    queryFn: () => fetchProjectById(projectId!),
    enabled: !!projectId,
  });

  const [form, setForm] = useState<Omit<Project, "id" | "company" | "created_at"> | null>(null);
  const [newTaskName, setNewTaskName] = useState("");

  useEffect(() => {
    if (data && !form) {
      setForm({
        name: data.name,
        code: data.code,
        description: data.description || "",
        start_date: data.start_date || "",
        end_date: data.end_date || "",
        status: (data.status as "planning" | "active" | "paused" | "completed") || "planning",
      });
    }
  }, [data, form]);

  const projectMutation = useMutation({
    mutationFn: (updated: Omit<Project, "id" | "company" | "created_at">) =>
      updateProject(projectId!, updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      alert("Project updated successfully");
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (task: Omit<Task, "id">) => createTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setNewTaskName("");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: (task: Task) => updateTask(task.id!, task),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
  });

  // Project-level quick actions
  const quickStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "planning" | "active" | "paused" | "completed" }) =>
      updateProject(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/projects");
    },
  });

  if (!projectId) return <p>Project ID missing</p>;
  if (isLoading || !form) return <p>Loading project...</p>;
  if (isError || !data) return <p>Error loading project details.</p>;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(f =>
      f
        ? {
            ...f,
            [name]:
              name === "status"
                ? (value as "planning" | "active" | "paused" | "completed")
                : value,
          }
        : f
    );
  };

  const handleSaveProject = () => {
    if (form) projectMutation.mutate(form);
  };

  const handleAddTask = () => {
    if (!newTaskName.trim()) return;
    createTaskMutation.mutate({ project_id: projectId!, name: newTaskName, status: "todo" });
  };

  const handleDeleteTask = (id: string) => {
    if (confirm("Delete this task?")) deleteTaskMutation.mutate(id);
  };

  const handleArchiveProject = () => {
    if (!confirm("Archive this project?")) return;
    quickStatusMutation.mutate({ id: projectId!, status: "paused" });
  };

  const handleDeleteProject = () => {
    if (!confirm("Delete this project permanently? This cannot be undone.")) return;
    deleteProjectMutation.mutate(projectId!);
  };

  return (
    <PMOnly>
      <AdminOnly>
        <div className="max-w-4xl mx-auto mt-6 space-y-8">
          {/* Header bar */}
          <div
            style={{ background: "linear-gradient(90deg,#071433,#0d3358)" }}
            className="p-4 rounded-2xl text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Edit Project</h1>
                <p className="text-sm text-white/90 mt-1">Update project details and manage tasks</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push("/projects")}
                  className="bg-white/10 text-white px-3 py-1 rounded-lg text-sm hover:bg-white/20 transition"
                >
                  Back to Projects
                </button>

                <button
                  onClick={handleArchiveProject}
                  className="bg-yellow-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-yellow-600 transition"
                >
                  Archive
                </button>

                <button
                  onClick={handleDeleteProject}
                  className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Project Form */}
          <div className="flex flex-col gap-4 bg-white p-6 shadow-lg rounded-2xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
              <input
                name="name"
                placeholder="Project Name"
                value={form.name}
                onChange={handleChange}
                className="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Project Code</label>
              <input
                name="code"
                placeholder="Project Code"
                value={form.code}
                onChange={handleChange}
                className="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                name="description"
                placeholder="Description"
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

            <div className="flex gap-3">
              <button
                onClick={handleSaveProject}
                disabled={projectMutation.isPending}
                className="bg-blue-500 text-white p-3 rounded-2xl hover:bg-blue-600 transition disabled:opacity-50"
              >
                {projectMutation.isPending ? "Saving..." : "Save Project"}
              </button>

              <button
                onClick={() => router.push("/projects")}
                className="border border-slate-200 text-slate-700 p-3 rounded-2xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Tasks Management */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Tasks</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="New Task Name"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                className="border p-2 rounded-lg flex-1 shadow-sm focus:ring-2 focus:ring-green-400 text-slate-900 placeholder:text-slate-400 bg-white"
              />
              <button
                onClick={handleAddTask}
                className="bg-green-500 text-white p-2 rounded-2xl shadow hover:bg-green-600 transition"
                disabled={createTaskMutation.isPending}
              >
                Add
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.tasks && data.tasks.length > 0 ? (
                data.tasks.map((task: Task) => (
                  <DashboardCard
                    key={task.id}
                    title={task.name}
                    value={task.status}
                    actions={
                      <div className="flex gap-2 mt-2">
                        <button
                          className="bg-yellow-500 text-white p-1 rounded text-sm hover:bg-yellow-600 transition"
                          onClick={() => {
                            const newStatus = prompt("Update status", task.status);
                            if (newStatus)
                              updateTaskMutation.mutate({
                                ...task,
                                status: newStatus as "todo" | "in-progress" | "done",
                              });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-500 text-white p-1 rounded text-sm hover:bg-red-600 transition"
                          onClick={() => handleDeleteTask(task.id!)}
                        >
                          Delete
                        </button>
                      </div>
                    }
                  />
                ))
              ) : (
                <div className="col-span-full text-center p-6 bg-white rounded-2xl shadow-sm">
                  <p className="text-gray-600">No tasks added yet.</p>
                  <p className="text-sm text-gray-400">Use the input above to create tasks and organize work.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminOnly>
    </PMOnly>
  );
}
