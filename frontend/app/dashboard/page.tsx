"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import Sidebar from "@/components/navigation/Sidebar";
import { DashboardCard } from "@/app/components/DashboardCard";
import { User } from "@/types/User";
import { useRouter } from "next/navigation";
import AdminOnly from "@/components/auth/AdminOnly";
import PMOnly from "@/components/auth/PMOnly";
import WorkerOnly from "@/components/auth/WorkerOnly";

export default function DashboardPage() {
  const router = useRouter();

  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery<User>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const res = await api.get<User>("/auth/me/");
        return res.data;
      } catch (err: any) {
        if (err?.response?.status === 401) {
          router.push("/auth/login");
        }
        throw err;
      }
    },
    retry: false,
  });

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#071433] to-[#0d3358] text-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Dashboard
          </h1>
        </div>

        {/* Filters Section */}
        <div className="mb-6 inline-flex rounded bg-white/5 p-1">
          <button className="px-4 py-2 rounded bg-white text-slate-900 font-medium">
            Overview
          </button>
          <button className="px-4 py-2 text-white/90 hover:text-white">
            Projects
          </button>
          <button className="px-4 py-2 text-white/90 hover:text-white">
            Materials
          </button>
          <button className="px-4 py-2 text-white/90 hover:text-white">
            Timesheets
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-200 animate-pulse text-lg">
              Loading profile...
            </p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-xl shadow-md mb-6">
            <p>Failed to load profile: {(error as Error)?.message}</p>
          </div>
        )}

        {/* User Data */}
        {user && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* User Info Card */}
            <div className="hover:scale-[1.03] transition-transform duration-300">
              <DashboardCard
                title="User Profile"
                value={user.username}
                actions={
                  <p className="text-sm text-gray-200 truncate">
                    {user.email}
                  </p>
                }
              />
            </div>

            {/* Projects Section */}
            <PMOnly>
              <Link
                href="/projects"
                className="block transform hover:scale-[1.03] transition"
              >
                <DashboardCard
                  title="Projects"
                  value="View Projects"
                  actions={
                    <p className="text-sm text-gray-200">
                      Manage all your projects
                    </p>
                  }
                />
              </Link>

              <Link
                href="/projects/create"
                className="block transform hover:scale-[1.03] transition"
              >
                <DashboardCard
                  title="Create Project"
                  value="New"
                  actions={
                    <p className="text-sm text-gray-200">
                      Start a new project
                    </p>
                  }
                />
              </Link>
            </PMOnly>

            {/* Materials Section */}
            <Link
              href="/materials"
              className="block transform hover:scale-[1.03] transition"
            >
              <DashboardCard
                title="Materials"
                value="View Inventory"
                actions={
                  <p className="text-sm text-gray-200">Manage materials</p>
                }
              />
            </Link>

            <Link
              href="/materials-po"
              className="block transform hover:scale-[1.03] transition"
            >
              <DashboardCard
                title="Materials PO"
                value="Purchase Orders"
                actions={
                  <p className="text-sm text-gray-200">
                    Track material orders
                  </p>
                }
              />
            </Link>

            {/* Timesheets Section */}
            <WorkerOnly>
              <Link
                href="/timesheets"
                className="block transform hover:scale-[1.03] transition"
              >
                <DashboardCard
                  title="Timesheets"
                  value="View & Submit"
                  actions={
                    <p className="text-sm text-gray-200">Track work hours</p>
                  }
                />
              </Link>
            </WorkerOnly>

            {/* Inspections */}
            <Link
              href="/inspections"
              className="block transform hover:scale-[1.03] transition"
            >
              <DashboardCard
                title="Inspections"
                value="View Inspections"
                actions={
                  <p className="text-sm text-gray-200">
                    Monitor site inspections
                  </p>
                }
              />
            </Link>

            {/* Documents */}
            <Link
              href="/documents"
              className="block transform hover:scale-[1.03] transition"
            >
              <DashboardCard
                title="Documents"
                value="Manage Docs"
                actions={
                  <p className="text-sm text-gray-200">
                    Project documentation
                  </p>
                }
              />
            </Link>

            {/* Equipment */}
            <Link
              href="/equipment"
              className="block transform hover:scale-[1.03] transition"
            >
              <DashboardCard
                title="Equipment"
                value="Manage Equipment"
                actions={
                  <p className="text-sm text-gray-200">Track site equipment</p>
                }
              />
            </Link>

            {/* Invoices */}
            <Link
              href="/invoices"
              className="block transform hover:scale-[1.03] transition"
            >
              <DashboardCard
                title="Invoices"
                value="View & Pay"
                actions={
                  <p className="text-sm text-gray-200">Invoice management</p>
                }
              />
            </Link>

            {/* Admin Section */}
            <AdminOnly>
              <Link
                href="/admin"
                className="block transform hover:scale-[1.03] transition"
              >
                <DashboardCard
                  title="Admin Panel"
                  value="Manage Users & Roles"
                  actions={
                    <p className="text-sm text-gray-200">
                      Admin privileges only
                    </p>
                  }
                />
              </Link>
            </AdminOnly>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && !user && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-200">
            <p className="text-2xl font-semibold mb-2">No data available</p>
            <p className="text-gray-300 mb-4">
              Your dashboard will show info here once loaded
            </p>
            <Link
              href="/projects/create"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition"
            >
              Create your first project
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
