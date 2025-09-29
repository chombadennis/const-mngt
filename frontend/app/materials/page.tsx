"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Material, getMaterials, deleteMaterial } from "@/lib/api";
import { DashboardCard } from "../components/DashboardCard";

export default function MaterialsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<Material[]>({
    queryKey: ["materials"],
    queryFn: getMaterials,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMaterial(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["materials"] }),
  });

  if (isLoading) return <p>Loading materials...</p>;
  if (isError) return <p>Error loading materials.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data?.map((material) => (
        <DashboardCard
          key={material.id}
          title={material.name}
          value={`SKU: ${material.sku} | Unit: ${material.unit}`}
          actions={
            <button
              className="bg-red-500 text-white p-1 rounded text-sm"
              onClick={() => {
                if (confirm("Delete this material?")) deleteMutation.mutate(material.id);
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
