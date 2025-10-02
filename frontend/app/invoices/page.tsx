"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchInvoices, deleteInvoice, Invoice } from "@/lib/api";
import { DashboardCard } from "../components/DashboardCard";
import AdminOnly from "@/components/auth/AdminOnly";
import PMOnly from "@/components/auth/PMOnly";
import WorkerOnly from "@/components/auth/WorkerOnly";
import Link from "next/link";
import { useState } from "react";

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const { data, isLoading, isError } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: fetchInvoices,
  });

  const [filter, setFilter] = useState("all");

  const filteredData = data?.filter((inv) =>
    filter === "all" ? true : inv.status.toLowerCase() === filter
  );

  if (isLoading) return <p className="text-center mt-12 text-gray-600">Loading invoices...</p>;
  if (isError) return <p className="text-center mt-12 text-red-600">Error loading invoices.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 p-6">
      {/* Header */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-[#071433] to-[#0d3358] text-white shadow-md mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <PMOnly>
          <Link
            href="/invoices/create"
            className="bg-white text-[#071433] px-4 py-2 rounded-lg font-medium shadow hover:bg-gray-200 transition"
          >
            Create New
          </Link>
        </PMOnly>
      </div>

      {/* Filters */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-white/5 rounded-lg overflow-hidden">
          {["all", "draft", "issued", "paid", "overdue"].map((f) => {
            const count = data?.filter((inv) => f === "all" ? true : inv.status.toLowerCase() === f).length || 0;
            const total = data?.length || 0;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-medium transition ${
                  filter === f
                    ? "bg-white text-[#071433]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} ({count} of {total})
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {filteredData && filteredData.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredData.map((inv) => (
            <DashboardCard
              key={inv.id}
              title={`${(inv.project?.name || "No Project").slice(0, 48)} - #${inv.number}`}
              value={`${inv.status} | $${inv.amount} | Due: ${inv.due_date}`}
              actions={
                <div className="flex flex-wrap gap-2 mt-2">
                  <Link
                    href={`/invoices/${inv.id}/edit`}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition"
                  >
                    View
                  </Link>
                  <PMOnly>
                    <Link
                      href={`/invoices/${inv.id}/edit`}
                      className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition"
                    >
                      Edit
                    </Link>
                  </PMOnly>
                  <AdminOnly>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                      onClick={() => {
                        if (confirm("Delete this invoice?")) deleteMutation.mutate(inv.id);
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
          <p className="text-gray-600 mb-4">No invoices found in this category.</p>
          <PMOnly>
            <Link
              href="/invoices/create"
              className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
            >
              Create New Invoice
            </Link>
          </PMOnly>
        </div>
      )}
    </div>
  );
}
