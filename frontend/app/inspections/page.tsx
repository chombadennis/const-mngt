"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Inspection, fetchInspections, deleteInspection } from "@/lib/api";
import { DashboardCard } from "../components/DashboardCard";
import Image from "next/image";
import Link from "next/link";
import AdminOnly from "@/components/auth/AdminOnly";
import PMOnly from "@/components/auth/PMOnly";
import WorkerOnly from "@/components/auth/WorkerOnly";

export default function InspectionsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data, isLoading, isError } = useQuery<Inspection[]>({
    queryKey: ["inspections"],
    queryFn: fetchInspections,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInspection(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inspections"] }),
  });

  if (isLoading)
    return (
      <div className="min-h-screen p-6 bg-gradient-to-b from-[#071433] to-[#0d3358] text-white">
        <p>Loading inspections...</p>
      </div>
    );
  if (isError)
    return (
      <div className="min-h-screen p-6 bg-gradient-to-b from-[#071433] to-[#0d3358] text-white">
        <p>Error loading inspections.</p>
      </div>
    );

  const total = data?.length ?? 0;
  const filtered = data ?? [];

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-[#071433] to-[#0d3358] text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Inspections</h1>
        <PMOnly
          fallback={
            <span className="text-sm text-gray-300">You don’t have permission to create inspections</span>
          }
        >
          <Link
            href="/inspections/create"
            className="px-4 py-2 rounded-lg bg-white text-[#071433] font-medium hover:bg-gray-200 transition"
          >
            + New Inspection
          </Link>
        </PMOnly>
      </div>

      {/* Filter control */}
      <div className="inline-flex bg-white/5 rounded-lg overflow-hidden mb-6">
        {["all", "recent", "with-photo", "without-photo", "notes"].map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`px-4 py-2 text-sm font-medium ${
              filter === opt
                ? "bg-white text-[#071433]"
                : "text-white/80 hover:text-white"
            }`}
          >
            {opt === "all" ? "All" : opt.replace("-", " ")}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-200 mb-4">
        {filtered.length} of {total} inspections
      </p>

      {filtered.length === 0 ? (
        <div className="p-6 rounded-lg bg-white/5 text-center">
          <p className="text-gray-200 mb-2">No inspections found.</p>
          <PMOnly>
            <Link
              href="/inspections/create"
              className="inline-block px-4 py-2 rounded bg-white text-[#071433] font-medium"
            >
              Create your first inspection
            </Link>
          </PMOnly>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((insp) => (
            <DashboardCard
              key={insp.id}
              title={(insp.project_name || "Unknown Project").slice(0, 48)}
              value={insp.notes || insp.date || "No notes"}
              actions={
                <div className="flex gap-2 flex-wrap items-center">
                  {insp.photo_url && (
                    <Image
                      src={insp.photo_url}
                      alt="Inspection Photo"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded"
                    />
                  )}
                  <Link
                    href={`/inspections/${insp.id}/edit`}
                    className="px-3 py-1 rounded bg-blue-500 text-white text-sm"
                  >
                    View / Edit
                  </Link>
                  <AdminOnly
                    fallback={
                      <span className="text-xs text-gray-300">You don’t have permission to delete</span>
                    }
                  >
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                      onClick={() => {
                        if (confirm("Delete this inspection?")) deleteMutation.mutate(insp.id!);
                      }}
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
    </div>
  );
}
