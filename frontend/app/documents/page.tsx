"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDocuments, deleteDocument, Document } from "@/lib/api";
import { DashboardCard } from "../components/DashboardCard";
import AdminOnly from "@/components/auth/AdminOnly";
import PMOnly from "@/components/auth/PMOnly";
import WorkerOnly from "@/components/auth/WorkerOnly";
import { useUser } from "@/context/AuthContext";

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const user = useUser();

  const { data, isLoading, isError } = useQuery<Document[]>({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDocument(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  const [search, setSearch] = useState<string>("");
  const [filter, setFilter] = useState<"all" | "mine" | "project" | "admin">("all");

  const truncateName = (name?: string, max = 48) => {
    if (!name) return "";
    if (name.length <= max) return name;
    const idx = name.lastIndexOf(".");
    if (idx > -1 && name.length - idx <= 8) {
      const ext = name.slice(idx);
      const base = name.slice(0, max - ext.length - 3);
      return `${base}...${ext}`;
    }
    return name.slice(0, max - 3) + "...";
  };

  const filtered = useMemo(() => {
    const list = data ?? [];
    let out = list;

    // search by filename
    if (search.trim()) {
      out = out.filter((d) =>
        String(d.filename ?? "").toLowerCase().includes(search.trim().toLowerCase())
      );
    }

    // apply simple client-side filters (best-effort; falls back if doc lacks fields)
    if (filter === "mine") {
      const userId = (user as any)?.id ?? (user as any)?.pk ?? (user as any)?.user_id ?? null;
      out = out.filter((d: any) => {
        const uploaderId =
          d.uploaded_by?.id ?? d.uploader?.id ?? d.owner?.id ?? d.uploader_id ?? d.owner_id ?? d.user_id ?? null;
        return userId && uploaderId ? String(uploaderId) === String(userId) : false;
      });
    } else if (filter === "project") {
      out = out.filter((d: any) => Boolean(d.project || d.project_name || d.project_id));
    } else if (filter === "admin") {
      // admin filter simply shows all but is presented as an admin action — server-side admin filters would be more robust
      out = out;
    }

    return out;
  }, [data, search, filter, user]);

  if (isLoading)
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse mb-3 h-4 w-48 bg-gradient-to-r from-slate-200 to-slate-300 rounded" />
          <p className="mt-2 text-sm text-slate-600">Loading documents...</p>
        </div>
      </div>
    );

  if (isError)
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-rose-600">Error</h3>
          <p className="mt-1 text-sm text-slate-600">There was an issue loading documents.</p>
          <Link href="/documents" className="inline-block mt-4 px-4 py-2 bg-slate-700 text-white rounded">
            Retry
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen p-6">
      {/* Header / Hero */}
      <div className="rounded-2xl p-6 mb-6 bg-gradient-to-r from-[#071433] to-[#0d3358] text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="text-sm opacity-90 max-w-xl">
              Manage uploaded documents — policies, drawings, contracts and more. Use the search and quick actions to view, edit or manage files.
            </p>
            <div className="mt-3 text-xs text-slate-200">
              <span className="font-medium">{filtered.length}</span> of <span className="font-medium">{data?.length ?? 0}</span> documents shown
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/documents/create"
              className="inline-flex items-center gap-2 bg-[linear-gradient(90deg,#0b3b6c,#0f4e86)] hover:opacity-95 px-4 py-2 rounded text-white font-medium shadow"
              aria-label="Create new document"
            >
              + New Document
            </Link>
            <Link
              href="/documents"
              className="inline-flex items-center gap-2 border border-white/20 text-white px-3 py-2 rounded text-sm"
            >
              Refresh
            </Link>
          </div>
        </div>

        {/* Search / segmented filters */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search filename, type or date (e.g. site-plan.pdf)"
              className="w-full md:max-w-lg px-4 py-2 rounded-md border border-white/20 bg-white/5 placeholder:text-slate-200 text-white outline-none"
            />
            <div className="mt-2 text-xs text-slate-300">
              Showing <strong>{filtered.length}</strong> results {data ? `from ${data.length}` : ""} • Filter: <strong>{filter}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Segmented control: All / My uploads / Project docs / Admin (if admin) */}
            <div role="tablist" aria-label="Document filters" className="inline-flex rounded bg-white/5 p-1">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 text-sm rounded ${filter === "all" ? "bg-white text-slate-900" : "text-white/90"}`}
              >
                All
              </button>

              <WorkerOnly>
                <button
                  onClick={() => setFilter("mine")}
                  className={`px-3 py-1 text-sm rounded ${filter === "mine" ? "bg-white text-slate-900" : "text-white/90"}`}
                  title="Show documents you uploaded"
                >
                  My uploads
                </button>
              </WorkerOnly>

              <PMOnly>
                <button
                  onClick={() => setFilter("project")}
                  className={`px-3 py-1 text-sm rounded ${filter === "project" ? "bg-white text-slate-900" : "text-white/90"}`}
                  title="Show documents attached to projects"
                >
                  Project docs
                </button>
              </PMOnly>

              <AdminOnly>
                <button
                  onClick={() => setFilter("admin")}
                  className={`px-3 py-1 text-sm rounded ${filter === "admin" ? "bg-white text-slate-900" : "text-white/90"}`}
                  title="Admin tools and filters"
                >
                  Admin tools
                </button>
              </AdminOnly>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main grid */}
        <main className="lg:col-span-2">
          {/* Empty state */}
          {filtered.length === 0 ? (
            <div className="p-8 bg-white rounded-lg shadow flex flex-col items-center text-center">
              <svg width="104" height="104" viewBox="0 0 24 24" fill="none" className="mb-4 opacity-80">
                <rect x="3" y="6" width="18" height="12" rx="2" stroke="#0f3b66" strokeWidth="1.5" />
                <path d="M7 10h10" stroke="#0f3b66" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M7 14h6" stroke="#0f3b66" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <h3 className="text-lg font-semibold text-slate-800">No documents found</h3>
              <p className="mt-2 text-sm text-slate-600 max-w-md">
                It looks quiet here. Upload documents from the Create page to make them available to the team. You can upload PDFs, images or office files.
              </p>
              <div className="mt-4 flex gap-3">
                <Link href="/documents/create" className="px-4 py-2 bg-blue-600 text-white rounded">Upload document</Link>
                <Link href="/documents" className="px-4 py-2 border rounded">Explore templates</Link>
              </div>

              <div className="mt-6 w-full text-left text-xs text-slate-500">
                <strong>Pro tip:</strong> Use the <em>+ New Document</em> button at the top for quick uploads.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map((doc) => (
                <DashboardCard
                  key={doc.id}
                  title={truncateName(doc.filename)}
                  value={`Uploaded: ${doc.created_at}`}
                  actions={
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={doc.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded text-sm bg-slate-700 text-white"
                      >
                        View
                      </a>

                      <Link
                        href={`/documents/${doc.id}/edit`}
                        className="px-3 py-1 rounded text-sm bg-white border text-slate-700"
                      >
                        Edit
                      </Link>

                      <a
                        href={doc.file}
                        download
                        className="px-3 py-1 rounded text-sm bg-white/80 border text-slate-700"
                      >
                        Download
                      </a>

                      <AdminOnly>
                        <button
                          className="px-3 py-1 rounded text-sm bg-red-600 text-white"
                          onClick={() => {
                            if (confirm("Delete this document?")) deleteMutation.mutate(doc.id!);
                          }}
                          aria-label={`Delete ${doc.filename}`}
                        >
                          Delete
                        </button>
                      </AdminOnly>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
