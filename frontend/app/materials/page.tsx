"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Material, getMaterials, deleteMaterial } from "@/lib/api";
import { DashboardCard } from "../components/DashboardCard";
import Link from "next/link";
import AdminOnly from "@/components/auth/AdminOnly";
import PMOnly from "@/components/auth/PMOnly";
import WorkerOnly from "@/components/auth/WorkerOnly";
import { useState } from "react";

export default function MaterialsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "withDescription" | "withoutDescription">("all");

  const { data, isLoading, isError } = useQuery<Material[]>({
    queryKey: ["materials"],
    queryFn: getMaterials,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMaterial(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["materials"] }),
  });

  if (isLoading) return <p className="text-center text-white mt-8">Loading materials...</p>;
  if (isError) return <p className="text-center text-red-500 mt-8">Error loading materials.</p>;

  const filteredData =
    filter === "all"
      ? data
      : filter === "withDescription"
      ? data?.filter((m) => m.description)
      : data?.filter((m) => !m.description);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#071433] to-[#0d3358] text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Materials</h1>
        <PMOnly>
          <Link
            href="/materials/create"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow"
          >
            + Create Material
          </Link>
        </PMOnly>
      </div>

      {/* Segmented Filter */}
      <div className="inline-flex rounded bg-white/5 p-1 mb-6">
        {["all", "withDescription", "withoutDescription"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-1 rounded ${
              filter === f ? "bg-white text-slate-900" : "text-white/90 hover:text-white"
            }`}
          >
            {f === "all" ? "All" : f === "withDescription" ? "With Description" : "Without Description"}
          </button>
        ))}
      </div>

      {filteredData && filteredData.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredData.map((material) => (
            <DashboardCard
              key={material.id}
              title={material.name.length > 48 ? material.name.slice(0, 45) + "..." : material.name}
              value={`SKU: ${material.sku} | Unit: ${material.unit}`}
              actions={
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/materials/${material.id}/edit`}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm"
                  >
                    Edit
                  </Link>
                  <AdminOnly>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                      onClick={() => {
                        if (confirm("Delete this material?")) deleteMutation.mutate(material.id);
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
      ) : (
        <div className="text-center mt-12">
          <p className="text-lg mb-4">No materials found.</p>
          <PMOnly>
            <Link
              href="/materials/create"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow"
            >
              Create Material
            </Link>
          </PMOnly>
        </div>
      )}
    </div>
  );
}
