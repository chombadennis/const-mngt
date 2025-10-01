"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { fetchProjects, Project } from "@/lib/api"
import { DashboardCard } from "@/app/components/DashboardCard"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import ErrorMessage from "@/components/ui/ErrorMessage"
import AdminOnly from "@/components/auth/AdminOnly"
import PMOnly from "@/components/auth/PMOnly"
import Sidebar from "@/components/navigation/Sidebar"

export default function ProjectsPage() {
  const { data, isLoading, isError, isSuccess, error } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  })

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">Projects</h1>

          <AdminOnly>
            <Link
              href="/projects/create"
              className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
            >
              Create Project
            </Link>
          </AdminOnly>
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
          <PMOnly>
            {data.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}/edit`}
                    className="block"
                  >
                    <DashboardCard
                      title={project.name}
                      value={project.status}
                      actions={
                        <p className="text-sm text-gray-500">
                          Click to view or edit project
                        </p>
                      }
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <p className="text-xl font-medium mb-2">No projects available</p>
                <p className="text-gray-400">
                  Projects will appear here once they are created
                </p>
              </div>
            )}
          </PMOnly>
        )}
      </main>
    </div>
  )
}
