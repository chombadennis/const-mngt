"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDocuments, deleteDocument, Document } from "@/lib/api";
import { DashboardCard } from "../components/DashboardCard";

export default function DocumentsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<Document[]>({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
  });

  const deleteMutation = useMutation({
  mutationFn: (id: number) => deleteDocument(id),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
});


  if (isLoading) return <p>Loading documents...</p>;
  if (isError) return <p>Error loading documents.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data?.map((doc) => (
            <DashboardCard
      key={doc.id}
      title={doc.filename}
      value={`Uploaded: ${doc.created_at}`}
      actions={
        <div className="flex gap-2">
          <a
            href={doc.file}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-500 text-white p-1 rounded text-sm"
          >
            View
          </a>
          <button
            className="bg-red-500 text-white p-1 rounded text-sm"
            onClick={() => {
              if (confirm("Delete this document?")) deleteMutation.mutate(doc.id!);
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
