"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { fetchProjects, Project } from "@/lib/api"
import { DashboardCard } from "@/app/components/DashboardCard"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import ErrorMessage from "@/components/ui/ErrorMessage"
import AdminOnly from "@/components/auth/AdminOnly"
import Sidebar from "@/components/navigation/Sidebar"

export default function ProjectsPage() {
  const { data, isLoading, isError, isSuccess, error } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  })

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Projects</h1>

          <AdminOnly>
            <Link
              href="/projects/create"
              className="bg-blue-600 text-white px-3 py-2 rounded"
            >
              Create Project
            </Link>
          </AdminOnly>
        </div>

        {isLoading && (
          <div className="py-20">
            <LoadingSpinner message="Loading projects..." />
          </div>
        )}

        {isError && (
          <ErrorMessage
            message={(error as Error)?.message ?? "Failed to load projects."}
          />
        )}

        {isSuccess && data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="block">
                <DashboardCard title={project.name} value={project.status} />
              </Link>
            ))}
          </div>
        )}

        {isSuccess && data && data.length === 0 && (
          <p className="text-gray-500 mt-6">No projects found.</p>
        )}
      </main>
    </div>
  )
}
