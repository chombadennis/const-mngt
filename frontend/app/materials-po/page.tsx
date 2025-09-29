"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPurchaseOrders, deletePurchaseOrder, PurchaseOrder } from "@/lib/api";
import { DashboardCard } from "@/app/components/DashboardCard";
import { useRouter } from "next/navigation";

export default function MaterialsPOPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

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

  if (isLoading) return <p>Loading purchase orders...</p>;
  if (isError) return <p>Error loading purchase orders.</p>;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-bold mb-2">Purchase Orders</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((po) => (
            <DashboardCard
              key={po.id}
              title={`Supplier: ${po.supplier}`}
              value={`${po.status} - Total: $${po.total ?? 0}`}
              actions={
                <div className="flex gap-2 mt-2">
                  <button
                    className="bg-yellow-500 text-white p-1 rounded text-sm"
                    onClick={() => router.push(`/materials-po/${po.id}`)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white p-1 rounded text-sm"
                    onClick={() => handleDelete(po.id)}
                  >
                    Delete
                  </button>
                </div>
              }
            />
          ))}
        </div>
        <button
          className="mt-4 bg-green-500 text-white p-2 rounded"
          onClick={() => router.push("/materials-po/create")}
        >
          Create New PO
        </button>
      </section>
    </div>
  );
}
