"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchEquipment, deleteEquipment, Equipment } from "@/lib/api";
import { DashboardCard } from "../components/DashboardCard";
import AdminOnly from "@/components/auth/AdminOnly";
import PMOnly from "@/components/auth/PMOnly";
import WorkerOnly from "@/components/auth/WorkerOnly";

export default function EquipmentPage() {
  const queryClient = useQueryClient();

  const { data = [], isLoading, isError } = useQuery<Equipment[]>({
    queryKey: ["equipment"],
    queryFn: fetchEquipment,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEquipment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["equipment"] }),
  });

  // Segmented control
  const segments = [
    "All",
    "Operational",
    "Needs Service",
    "Recently Added",
    "Out of Service",
  ] as const;
  const [activeSegment, setActiveSegment] = useState<typeof segments[number]>(
    "All"
  );

  // Helper: safe parsing and basic rules (defensive — fields may be missing)
  const parseDate = (d?: string | null) => {
    if (!d) return null;
    const t = Date.parse(d);
    return Number.isNaN(t) ? null : t;
  };

  const filterBySegment = (segment: typeof segments[number], items: Equipment[]) => {
    switch (segment) {
      case "All":
        return items;
      case "Operational":
        return items.filter((i) => String((i as any).status ?? "").toLowerCase() === "operational");
      case "Needs Service":
        return items.filter((i) => {
          const last = parseDate(i.last_service_date);
          if (!last) return true; // missing service date likely needs attention
          const days = (Date.now() - last) / (1000 * 60 * 60 * 24);
          return days > 180;
        });
      case "Recently Added":
        return items.filter((i) => {
          const p = parseDate(i.purchase_date);
          if (!p) return false;
          return Date.now() - p <= 30 * 24 * 60 * 60 * 1000;
        });
      case "Out of Service":
        return items.filter((i) => String((i as any).status ?? "").toLowerCase() === "out_of_service");
      default:
        return items;
    }
  };

  const countsBySegment = useMemo(() => {
    const map: Record<string, number> = {};
    for (const seg of segments) {
      map[seg] = filterBySegment(seg, data).length;
    }
    return map;
  }, [data]);

  const filteredData = useMemo(() => filterBySegment(activeSegment, data), [activeSegment, data]);

  // Truncate but preserve file extension/key identifier when present.
  const truncatePreserveExt = (name?: string) => {
    const raw = String(name ?? "Unnamed Equipment");
    if (raw.length <= 48) return raw;
    const lastDot = raw.lastIndexOf(".");
    if (lastDot > 0 && raw.length - lastDot <= 8) {
      const ext = raw.slice(lastDot);
      const keep = 48 - ext.length - 3;
      return raw.slice(0, Math.max(0, keep)) + "..." + ext;
    }
    return raw.slice(0, 45) + "...";
  };

  if (isLoading)
    return (
      <div className="min-h-screen p-6 bg-gradient-to-b from-[#071433] to-[#0d3358] text-white">
        <p>Loading equipment...</p>
      </div>
    );
  if (isError)
    return (
      <div className="min-h-screen p-6 bg-gradient-to-b from-[#071433] to-[#0d3358] text-white">
        <p>Error loading equipment.</p>
      </div>
    );

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-[#071433] to-[#0d3358] text-white">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Equipment</h1>
            <p className="text-sm text-gray-200 mt-1">
              View and manage company equipment. Use filters to quickly find items.
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <PMOnly>
              <Link
                href="/equipment/create"
                className="inline-flex items-center whitespace-nowrap px-3 py-2 rounded shadow-sm text-sm font-medium bg-white text-[#071433] hover:opacity-95"
              >
                Add Equipment
              </Link>
            </PMOnly>
          </div>
        </header>

        {/* Segmented control */}
        <div className="flex items-center gap-4 mb-4">
          <div className="inline-flex rounded-lg bg-white/5 p-1" role="tablist" aria-label="Equipment filters">
            {segments.map((seg) => {
              const active = seg === activeSegment;
              return (
                <button
                  key={seg}
                  onClick={() => setActiveSegment(seg)}
                  className={`text-sm px-3 py-1 rounded-md transition-all ${
                    active
                      ? "bg-white text-[#071433] font-medium"
                      : "text-white/80 hover:bg-white/10"
                  }`}
                  aria-pressed={active}
                  role="tab"
                >
                  <span className="inline-flex items-center gap-2">
                    <span>{seg}</span>
                    <span className="text-xs inline-block bg-white/10 px-2 py-0.5 rounded text-white/90">{countsBySegment[seg]}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-sm text-gray-200">
            {filteredData.length} of {data.length} items
          </div>
        </div>

        {/* Grid */}
        {filteredData.length === 0 ? (
          <div className="rounded-lg bg-white/5 p-8 border border-white/10">
            <h2 className="text-lg font-semibold">No equipment found</h2>
            <p className="text-sm text-gray-200 mt-2">
              There are no items matching this filter. You can add new equipment or change filters.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <PMOnly>
                <Link
                  href="/equipment/create"
                  className="inline-flex px-4 py-2 rounded text-sm bg-white text-[#071433] font-medium"
                >
                  Add Equipment
                </Link>
              </PMOnly>

              <div className="text-sm text-gray-300">
                <WorkerOnly>
                  <span>Viewing as worker — you can view details but not add or edit equipment.</span>
                </WorkerOnly>
                <AdminOnly>
                  <span>Admins: you can manage equipment.</span>
                </AdminOnly>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredData.map((eq) => (
              <DashboardCard
                key={eq.id}
                title={truncatePreserveExt(eq.name)}
                value={`SN: ${eq.serial_number ?? "—"} | Purchased: ${eq.purchase_date ?? "—"} | Last Service: ${eq.last_service_date ?? "—"}`}
                actions={
                  <div className="flex gap-2 flex-wrap items-center">
                    <Link
                      href={`/equipment/${eq.id}`}
                      className="inline-block whitespace-nowrap px-3 py-1 rounded text-sm font-medium bg-white text-[#071433]"
                    >
                      View
                    </Link>

                    <PMOnly
                      fallback={<span className="text-sm text-gray-300">You don’t have permission to edit.</span>}
                    >
                      <Link
                        href={`/equipment/${eq.id}/edit`}
                        className="inline-block whitespace-nowrap px-3 py-1 rounded text-sm font-medium bg-[#0d3358] text-white"
                      >
                        Edit
                      </Link>
                    </PMOnly>

                    <AdminOnly>
                      <button
                        className="inline-block whitespace-nowrap px-3 py-1 rounded text-sm font-medium bg-red-600 text-white"
                        onClick={() => {
                          if (confirm("Delete this equipment? This action cannot be undone.")) {
                            if (eq.id) deleteMutation.mutate(eq.id);
                          }
                        }}
                        aria-label={`Delete equipment ${eq.name}`}
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
    </div>
  );
}
