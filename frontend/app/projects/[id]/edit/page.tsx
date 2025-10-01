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

// Extend Project type locally so tasks are recognized
type ProjectWithTasks = Project & { tasks?: Task[] };

export default function EditProjectPage() {
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const queryClient = useQueryClient();

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
        status: data.status,
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

  if (!projectId) return <p>Project ID missing</p>;
  if (isLoading || !form) return <p>Loading project...</p>;
  if (isError || !data) return <p>Error loading project details.</p>;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(f => (f ? { ...f, [name]: value } : f));
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

  return (
    <PMOnly>
      <AdminOnly>
        <div className="max-w-4xl mx-auto mt-6 space-y-8">
          <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>

          {/* Project Form */}
          <div className="flex flex-col gap-4 bg-white p-6 shadow-lg rounded-lg">
            <input
              name="name"
              placeholder="Project Name"
              value={form.name}
              onChange={handleChange}
              className="border p-3 rounded shadow-sm focus:ring-2 focus:ring-blue-500"
            />
            <input
              name="code"
              placeholder="Project Code"
              value={form.code}
              onChange={handleChange}
              className="border p-3 rounded shadow-sm focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              className="border p-3 rounded shadow-sm focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              className="border p-3 rounded shadow-sm focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              className="border p-3 rounded shadow-sm focus:ring-2 focus:ring-blue-500"
            />
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="border p-3 rounded shadow-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
            <button
              onClick={handleSaveProject}
              disabled={projectMutation.isPending}
              className="bg-blue-500 text-white p-3 rounded shadow hover:bg-blue-600 transition disabled:opacity-50"
            >
              {projectMutation.isPending ? "Saving..." : "Save Project"}
            </button>
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
                className="border p-2 rounded flex-1 shadow-sm focus:ring-2 focus:ring-green-400"
              />
              <button
                onClick={handleAddTask}
                className="bg-green-500 text-white p-2 rounded shadow hover:bg-green-600 transition"
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
                              updateTaskMutation.mutate({ ...task, status: newStatus });
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
                <p className="text-gray-500 col-span-full text-center">
                  No tasks added yet. Use the input above to add tasks.
                </p>
              )}
            </div>
          </div>
        </div>
      </AdminOnly>
    </PMOnly>
  );
}
