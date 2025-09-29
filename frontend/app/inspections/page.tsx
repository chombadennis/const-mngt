"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Inspection, fetchInspections, deleteInspection } from "@/lib/api";
import { DashboardCard } from "../components/DashboardCard";
import Image from "next/image";

export default function InspectionsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<Inspection[]>({
    queryKey: ["inspections"],
    queryFn: fetchInspections,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInspection(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inspections"] }),
  });

  if (isLoading) return <p>Loading inspections...</p>;
  if (isError) return <p>Error loading inspections.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data?.map((insp) => (
        <DashboardCard
          key={insp.id}
          title={`Project: ${insp.project_name || "Unknown"}`}
          value={insp.notes || "No notes"}
          actions={
            <div className="flex gap-2">
              {insp.photo_url && (
                <Image
                  src={insp.photo_url}
                  alt="Inspection Photo"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded"
                />
              )}
              <button
                className="bg-red-500 text-white p-1 rounded text-sm"
                onClick={() => {
                  if (confirm("Delete this inspection?")) deleteMutation.mutate(insp.id!);
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
