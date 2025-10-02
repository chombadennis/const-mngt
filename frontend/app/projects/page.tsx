"use client"

import React, { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { fetchProjects, Project, updateProject } from "@/lib/api"
import { DashboardCard } from "@/app/components/DashboardCard"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import ErrorMessage from "@/components/ui/ErrorMessage"
import AdminOnly from "@/components/auth/AdminOnly"
import PMOnly from "@/components/auth/PMOnly"
import Sidebar from "@/components/navigation/Sidebar"

export default function ProjectsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading, isError, isSuccess, error } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  })

  // Filter state
  const [filter, setFilter] = useState<"all" | "planning" | "active" | "paused" | "completed">("all")

  const filtered = useMemo(() => {
    if (!data) return []
    if (filter === "all") return data
    return data.filter((p) => String(p.status).toLowerCase() === filter)
  }, [data, filter])

  const total = data?.length ?? 0
  const shown = filtered.length

  // Mutations for quick actions (archive -> set paused, restore -> planning)
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "planning" | "active" | "paused" | "completed" }) =>
      updateProject(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete project")
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  })

  const handleArchive = (project: Project) => {
    if (!confirm(`Archive project "${project.name}"? You can restore it later by changing status.`)) return
    statusMutation.mutate({ id: project.id!, status: "paused" })
  }

  const handleRestore = (project: Project) => {
    statusMutation.mutate({ id: project.id!, status: "planning" })
  }

  const handleDelete = (id?: string) => {
    if (!id) return
    if (!confirm("Delete this project permanently? This action cannot be undone.")) return
    deleteMutation.mutate(id)
  }

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "linear-gradient(180deg, rgba(7,20,51,0.02) 0%, #ffffff 100%)" }}
    >
      <Sidebar />

      <main className="flex-1 p-6">
        {/* Gradient header bar */}
        <div className="rounded-2xl overflow-hidden mb-6">
          <div
            style={{ background: "linear-gradient(90deg,#071433,#0d3358)" }}
            className="p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Projects</h1>
                <p className="text-sm text-white/90 mt-1">Manage and track your projects with clarity</p>
              </div>

              <AdminOnly>
                <Link
                  href="/projects/create"
                  className="ml-4 inline-block bg-green-500 text-white px-4 py-2 rounded-2xl shadow hover:bg-green-600 transition font-medium"
                >
                  Create Project
                </Link>
              </AdminOnly>
            </div>
          </div>
        </div>

        {/* Top controls: filters + summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex rounded bg-white/5 p-1">
            {["all", "planning", "active", "paused", "completed"].map((s) => {
              const active = filter === (s as any)
              const label =
                s === "all" ? "All" : s[0].toUpperCase() + String(s).slice(1)
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s as any)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${active ? "bg-white text-slate-900" : "text-white/90 hover:bg-white/5"
                    }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div className="text-sm text-slate-700">
            <span className="text-sm text-slate-600">{shown}</span>
            {" of "}
            <span className="text-sm text-slate-600">{total}</span>
            {" projects shown"}
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <LoadingSpinner message="Loading projects..." />
          </div>
        )}

        {isError && (
          <ErrorMessage
            message={(error as Error)?.message ?? "Failed to load projects."}
          />
        )}

        {isSuccess && data && (
          <PMOnly
            fallback={
              <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow text-center">
                <p className="text-lg font-medium text-gray-800">You don&apos;t have permission to view projects.</p>
                <p className="text-sm text-gray-500 mt-2">Contact your administrator if you believe this is an error.</p>
              </div>
            }
          >
            {data.length > 0 ? (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filtered.map((project) => (
                    <div key={project.id} className="block">
                      <DashboardCard
                        title={String(project.name).length > 48 ? String(project.name).slice(0, 48) + "…" : project.name}
                        value={project.status}
                        actions={
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Link
                              href={`/projects/${project.id}/edit`}
                              className="inline-block bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                            >
                              View
                            </Link>

                            <Link
                              href={`/projects/${project.id}/edit`}
                              className="inline-block border border-white/10 text-white px-3 py-1 rounded text-sm hover:bg-white/5 transition"
                            >
                              Edit
                            </Link>

                            {String(project.status).toLowerCase() === "paused" ? (
                              <button
                                className="inline-block bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 transition"
                                onClick={(e) => {
                                  e.preventDefault()
                                  handleRestore(project)
                                }}
                              >
                                Restore
                              </button>
                            ) : (
                              <button
                                className="inline-block bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition"
                                onClick={(e) => {
                                  e.preventDefault()
                                  handleArchive(project)
                                }}
                              >
                                Archive
                              </button>
                            )}

                            <button
                              className="inline-block bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                              onClick={(e) => {
                                e.preventDefault()
                                handleDelete(project.id)
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                <p className="text-xl font-medium mb-2">No projects available</p>
                <p className="text-sm text-slate-500 mb-4">
                  Projects will appear here once they are created
                </p>
                <AdminOnly>
                  <Link
                    href="/projects/create"
                    className="bg-green-500 text-white px-4 py-2 rounded-2xl shadow hover:bg-green-600 transition"
                  >
                    Create your first project
                  </Link>
                </AdminOnly>
              </div>
            )}
          </PMOnly>
        )}
      </main>
    </div>
  )
}
