"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPurchaseOrders, deletePurchaseOrder, PurchaseOrder } from "@/lib/api";
import { DashboardCard } from "@/app/components/DashboardCard";
import { useRouter } from "next/navigation";
import AdminOnly from "@/components/auth/AdminOnly";
import PMOnly from "@/components/auth/PMOnly";
import WorkerOnly from "@/components/auth/WorkerOnly";

export default function MaterialsPOPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const { data, isLoading, isError } = useQuery<PurchaseOrder[]>({
    queryKey: ["purchase-orders"],
    queryFn: getPurchaseOrders,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePurchaseOrder(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      alert("PO deleted successfully");
    },
  });

  const handleDelete = (id?: number) => {
    if (!id) return;
    if (confirm("Are you sure you want to delete this PO?")) {
      deleteMutation.mutate(id);
    }
  };

  const statuses = ["All", "Pending", "Approved", "Rejected", "Completed"];

  const filtered = useMemo(() => {
    if (!data) return [];
    if (statusFilter === "All") return data;
    return data.filter((po) => String(po.status ?? "").toLowerCase() === statusFilter.toLowerCase());
  }, [data, statusFilter]);

  const total = data?.length ?? 0;
  const visible = filtered.length;

  const truncateTitle = (s?: string) => {
    if (!s) return "Unnamed Supplier";
    const str = String(s);
    if (str.length <= 48) return str;
    const extMatch = str.match(/(\.[^.]{1,10})$/);
    if (extMatch) {
      const ext = extMatch[1];
      const keep = Math.max(0, 48 - ext.length - 3);
      return str.slice(0, keep) + "..." + ext;
    }
    return str.slice(0, 45) + "...";
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Page header with navy gradient */}
      <header
        className="rounded-2xl p-6 mb-6"
        style={{ background: "linear-gradient(90deg, #071433, #0d3358)" }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Purchase Orders</h1>
            <p className="text-sm text-white/85 mt-1">Manage purchase orders for your company</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-white/80 mr-4 hidden sm:block">{visible} of {total}</div>

            <PMOnly
              fallback={
                <div className="text-sm text-white/70">You don’t have permission to create purchase orders</div>
              }
            >
              <button
                onClick={() => router.push("/materials-po/create")}
                className="bg-green-500 text-white px-3 py-2 rounded-md font-medium whitespace-nowrap hover:bg-green-600 transition"
                aria-label="Create Purchase Order"
              >
                Create New PO
              </button>
            </PMOnly>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="inline-flex rounded bg-white/5 p-1">
            {statuses.map((s) => {
              const active = s === statusFilter;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded text-sm font-medium transition whitespace-nowrap ${active ? "bg-white text-slate-900" : "text-white/90"}`}
                  aria-pressed={active}
                >
                  {s}
                </button>
              );
            })}
          </div>

          <div className="text-sm text-white/80">{visible} of {total} purchase orders</div>
        </div>
      </header>

      {/* Content */}
      <section>
        {isLoading ? (
          <div className="rounded-2xl bg-white p-8 shadow flex flex-col items-center gap-4">
            <h2 className="text-xl font-bold text-slate-900">Loading purchase orders...</h2>
            <p className="text-sm text-slate-600">Please wait while we fetch your data.</p>
          </div>
        ) : isError ? (
          <div className="rounded-2xl bg-white p-8 shadow flex flex-col items-center gap-4">
            <h2 className="text-xl font-bold text-red-600">Error loading purchase orders</h2>
            <p className="text-sm text-slate-600 text-center max-w-lg">
              Something went wrong while fetching purchase orders. Please try again later.
            </p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["purchase-orders"] })}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Retry
            </button>
          </div>
        ) : total === 0 ? (
          <div className="rounded-2xl bg-white p-8 shadow flex flex-col items-center gap-4">
            <h2 className="text-xl font-bold text-slate-900">No purchase orders yet</h2>
            <p className="text-sm text-slate-600 text-center max-w-lg">
              You currently have no purchase orders. Create a new purchase order to get started. Purchase orders help track supplier orders, costs and status across your projects.
            </p>

            <PMOnly fallback={<div className="text-sm text-red-500">You don’t have permission to create purchase orders</div>}>
              <button
                onClick={() => router.push("/materials-po/create")}
                className="bg-green-500 text-white px-4 py-2 rounded-md mt-2 hover:bg-green-600 transition"
              >
                Create New Purchase Order
              </button>
            </PMOnly>
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map((po) => (
                <div key={po.id} className="min-h-[150px]">
                  <DashboardCard
                    key={po.id}
                    title={truncateTitle(po.supplier ?? "Unnamed Supplier")}
                    value={`${po.status ?? "Unknown"} · Total: $${po.total ?? 0}`}
                    actions={
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button
                          onClick={() => router.push(`/materials-po/${po.id}`)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm whitespace-nowrap hover:bg-blue-700 transition"
                          aria-label={`View PO ${po.id}`}
                        >
                          View
                        </button>

                        <PMOnly
                          fallback={<span className="text-xs text-red-300 self-center">You don’t have permission to edit</span>}
                        >
                          <button
                            onClick={() => router.push(`/materials-po/${po.id}/edit`)}
                            className="bg-yellow-500 text-white px-3 py-1 rounded text-sm whitespace-nowrap hover:bg-yellow-600 transition"
                            aria-label={`Edit PO ${po.id}`}
                          >
                            Edit
                          </button>
                        </PMOnly>

                        <AdminOnly
                          fallback={<span className="text-xs text-red-300 self-center">You don’t have permission to delete</span>}
                        >
                          <button
                            onClick={() => handleDelete(po.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm whitespace-nowrap hover:bg-red-600 transition"
                            aria-label={`Delete PO ${po.id}`}
                          >
                            Delete
                          </button>
                        </AdminOnly>
                      </div>
                    }
                  />
                </div>
              ))}
            </div>

            {/* Simple pager or summary */}
            <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
              <div>{visible} of {total} purchase orders</div>
              <div className="hidden sm:block">Showing filtered results</div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
