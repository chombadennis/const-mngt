"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Project {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
}

const fetchProject = async (id: string): Promise<Project> => {
  const res = await api.get(`/projects/${id}/`);
  return res.data as Project;
};

const updateProject = async (project: Project): Promise<Project> => {
  const res = await api.put(`/projects/${project.id}/`, project);
  return res.data as Project;
};

export default function ProjectEditPage() {
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  // Hooks are always called
  const { data, isLoading } = useQuery<Project>({
    queryKey: ["project", projectId] as const,
    queryFn: () => fetchProject(projectId!),
    enabled: !!projectId,
  });

  const mutation = useMutation<Project, Error, Project>({
    mutationFn: updateProject,
    onSuccess: () => {
  if (projectId) queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  router.push("/projects");
}
    },
  );

  const [form, setForm] = useState<Project>({
    id: projectId || "",
    name: "",
    description: "",
    start_date: "",
    end_date: "",
  });

  // Functional update avoids exhaustive-deps warning
  useEffect(() => {
    if (data) setForm(f => ({ ...f, ...data }));
  }, [data]);

  if (!projectId) return <p>Project ID missing</p>;
  if (isLoading) return <p>Loading project...</p>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4">
      <label className="block mb-2">Project Name</label>
      <input name="name" value={form.name} onChange={handleChange} className="input-field" />

      <label className="block mb-2 mt-4">Description</label>
      <textarea name="description" value={form.description} onChange={handleChange} className="input-field" />

      <label className="block mb-2 mt-4">Start Date</label>
      <input type="date" name="start_date" value={form.start_date} onChange={handleChange} className="input-field" />

      <label className="block mb-2 mt-4">End Date</label>
      <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className="input-field" />

      <button type="submit" className="btn mt-4">Save Project</button>
    </form>
  );
}
