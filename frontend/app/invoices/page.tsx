"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchInvoices, deleteInvoice, Invoice } from "@/lib/api";
import { DashboardCard } from "../components/DashboardCard";

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

  if (isLoading) return <p>Loading invoices...</p>;
  if (isError) return <p>Error loading invoices.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data?.map((inv) => (
        <DashboardCard
          key={inv.id}
          title={`${inv.project?.name || "No Project"} - #${inv.number} - $${inv.amount}`}
          value={`${inv.status} (Due: ${inv.due_date})`}
          actions={
            <button
              className="bg-red-500 text-white p-1 rounded text-sm"
              onClick={() => {
                if (confirm("Delete this invoice?")) deleteMutation.mutate(inv.id);
              }}
            >
              Delete
            </button>
          }
        />
      ))}
    </div>
  );
}
