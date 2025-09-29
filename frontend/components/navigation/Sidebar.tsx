"use client";

import React from "react";
import Link from "next/link";
import { useUser, useRoles, useIsAdmin } from "@/context/AuthContext";

export default function Sidebar() {
  const user = useUser();
  const roles = useRoles();
  const isAdmin = useIsAdmin();

  const canSeeProjects = isAdmin || roles.some((r) => /^(pm|project manager|admin)/i.test(String(r)));
  const canSeeTimesheets = isAdmin || roles.some((r) => /^(worker|pm|project manager|admin)/i.test(String(r)));
  const canSeeAdmin = isAdmin;

  return (
    <aside className="w-64 bg-white border-r p-4 hidden md:block">
      <div className="mb-6">
        <div className="font-semibold">{user?.username ?? "Guest"}</div>
        <div className="text-sm text-gray-500">{user?.email ?? ""}</div>
      </div>

      <nav className="space-y-2">
        <Link href="/dashboard" className="block p-2 rounded hover:bg-gray-100">Dashboard</Link>

        {canSeeProjects && (
          <Link href="/projects" className="block p-2 rounded hover:bg-gray-100">
            Projects
          </Link>
        )}

        <Link href="/materials" className="block p-2 rounded hover:bg-gray-100">Materials</Link>

        <Link href="/materials-po" className="block p-2 rounded hover:bg-gray-100">Materials PO</Link>

        {canSeeTimesheets && (
          <Link href="/timesheets" className="block p-2 rounded hover:bg-gray-100">Timesheets</Link>
        )}

        <Link href="/inspections" className="block p-2 rounded hover:bg-gray-100">Inspections</Link>

        <Link href="/documents" className="block p-2 rounded hover:bg-gray-100">Documents</Link>

        <Link href="/equipment" className="block p-2 rounded hover:bg-gray-100">Equipment</Link>

        <Link href="/invoices" className="block p-2 rounded hover:bg-gray-100">Invoices</Link>

        {canSeeAdmin && (
          <Link href="/admin" className="block p-2 rounded hover:bg-gray-100">Admin</Link>
        )}
      </nav>
    </aside>
  );
}
