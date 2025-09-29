"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Document, fetchSingleDocument, updateDocument } from "@/lib/api";

export default function EditDocumentPage() {
  const params = useParams();
  const documentId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<Document>({
    queryKey: ["documents", documentId],
    queryFn: () => fetchSingleDocument(documentId!),
    enabled: !!documentId,
  });

  const mutation = useMutation({
    mutationFn: (updatedData: Partial<Document>) =>
      updateDocument(documentId!, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      alert("Document updated");
      router.push("/documents");
    },
  });

  const [filename, setFilename] = useState("");

  useEffect(() => {
    if (data) {
      setFilename(data.filename || "");
    }
  }, [data]);

  if (!documentId) return <p>Document ID missing</p>;
  if (isLoading) return <p>Loading document...</p>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ filename });
  };

  return (
    <div className="max-w-lg mx-auto mt-12 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Edit Document</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="Document Filename"
          className="border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded disabled:opacity-50"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving..." : "Save Document"}
        </button>
      </form>
    </div>
  );
}
