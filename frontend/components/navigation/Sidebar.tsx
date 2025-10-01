"use client";

import React from "react";
import Link from "next/link";
import { useUser, useRoles, useIsAdmin, useAuth } from "@/context/AuthContext";
import AdminOnly from "@/components/auth/AdminOnly";
import PMOnly from "@/components/auth/PMOnly";
import WorkerOnly from "@/components/auth/WorkerOnly";

export default function Sidebar() {
  const user = useUser();
  const roles = useRoles();
  const isAdmin = useIsAdmin();
  const { logout } = useAuth();

  const canSeeProjects = isAdmin || roles.some((r) => /^(pm|project manager|admin)/i.test(String(r)));
  const canSeeTimesheets = isAdmin || roles.some((r) => /^(worker|pm|project manager|admin)/i.test(String(r)));
  const canSeeAdmin = isAdmin;

  return (
    <aside className="w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-6 hidden md:flex flex-col justify-between rounded-r-2xl shadow-xl">
      <div>
        <div className="mb-8">
          <div className="font-bold text-lg text-white">{user?.username ?? "Guest"}</div>
          <div className="text-sm text-gray-400">{user?.email ?? ""}</div>
        </div>

        <nav className="space-y-2">
          <Link href="/dashboard" className="block px-3 py-2 rounded-lg hover:bg-gray-700 text-gray-200 hover:text-white transition">
            Dashboard
          </Link>

          <PMOnly>
            {canSeeProjects && (
              <Link href="/projects" className="block px-3 py-2 rounded-lg hover:bg-gray-700 text-gray-200 hover:text-white transition">
                Projects
              </Link>
            )}
          </PMOnly>

          <Link href="/materials" className="block px-3 py-2 rounded-lg hover:bg-gray-700 text-gray-200 hover:text-white transition">
            Materials
          </Link>

          <Link href="/materials-po" className="block px-3 py-2 rounded-lg hover:bg-gray-700 text-gray-200 hover:text-white transition">
            Materials PO
          </Link>

          <WorkerOnly>
            {canSeeTimesheets && (
              <Link href="/timesheets" className="block px-3 py-2 rounded-lg hover:bg-gray-700 text-gray-200 hover:text-white transition">
                Timesheets
              </Link>
            )}
          </WorkerOnly>

          <Link href="/inspections" className="block px-3 py-2 rounded-lg hover:bg-gray-700 text-gray-200 hover:text-white transition">
            Inspections
          </Link>

          <Link href="/documents" className="block px-3 py-2 rounded-lg hover:bg-gray-700 text-gray-200 hover:text-white transition">
            Documents
          </Link>

          <Link href="/equipment" className="block px-3 py-2 rounded-lg hover:bg-gray-700 text-gray-200 hover:text-white transition">
            Equipment
          </Link>

          <Link href="/invoices" className="block px-3 py-2 rounded-lg hover:bg-gray-700 text-gray-200 hover:text-white transition">
            Invoices
          </Link>

          <AdminOnly>
            {canSeeAdmin && (
              <Link href="/admin" className="block px-3 py-2 rounded-lg hover:bg-gray-700 text-gray-200 hover:text-white transition">
                Admin
              </Link>
            )}
          </AdminOnly>
        </nav>
      </div>

      {/* 🔹 Logout button at bottom */}
      <button
        onClick={logout}
        className="mt-6 w-full px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-medium"
      >
        Logout
      </button>
    </aside>
  );
}
