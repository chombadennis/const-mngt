"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchEquipment, deleteEquipment, Equipment } from "@/lib/api";
import { DashboardCard } from "../components/DashboardCard";

export default function EquipmentPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<Equipment[]>({
    queryKey: ["equipment"],
    queryFn: fetchEquipment,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEquipment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["equipment"] }),
  });

  if (isLoading) return <p>Loading equipment...</p>;
  if (isError) return <p>Error loading equipment.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data?.map((eq) => (
        <DashboardCard
          key={eq.id}
          title={eq.name}
          value={`SN: ${eq.serial_number} | Purchased: ${eq.purchase_date} | Last Service: ${eq.last_service_date}`}
          actions={
            <div className="flex gap-2">
              <button
                className="bg-red-500 text-white p-1 rounded text-sm"
                onClick={() => {
                  if (confirm("Delete this equipment?")) deleteMutation.mutate(eq.id!);
                }}
              >
                Delete
              </button>
            </div>
          }
        />
      ))}
    </div>
  );
}
