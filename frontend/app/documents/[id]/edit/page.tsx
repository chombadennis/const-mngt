"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Document, fetchSingleDocument, updateDocument } from "@/lib/api";
import AdminOnly from "@/components/auth/AdminOnly";
import PMOnly from "@/components/auth/PMOnly";
import { useRoles, useIsAdmin } from "@/context/AuthContext";

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

  // role checks to adjust UI behavior
  const roles = useRoles();
  const isAdmin = useIsAdmin();
  const canEdit =
    isAdmin ||
    roles?.some((r) =>
      /^(pm|project manager|project_manager)$/i.test(String(r))
    );

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
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        {/* Gradient header */}
        <div className="mb-6 rounded-2xl p-6 bg-gradient-to-r from-[#071433] to-[#0d3358] text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Edit Document</h1>
              <p className="text-sm opacity-90 mt-1">
                Update filename and metadata. Changes will be visible to the
                team after saving.
              </p>
              <div className="text-xs mt-2 text-slate-200">
                <strong>Uploaded:</strong> {data?.created_at ?? "—"}
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Link
                href="/documents"
                className="px-3 py-2 bg-white/10 rounded text-white text-sm"
              >
                Back
              </Link>
              <AdminOnly>
                <button
                  className="px-3 py-2 bg-red-600 text-white rounded text-sm"
                  onClick={() => {
                    if (
                      confirm(
                        "Want to delete this document? You will be redirected to the documents list."
                      )
                    ) {
                      router.push("/documents");
                    }
                  }}
                >
                  Delete
                </button>
              </AdminOnly>
            </div>
          </div>
        </div>

        {/* Card container */}
        <div className="bg-white rounded-2xl shadow p-6 dark:bg-gray-900 dark:text-white">
          {!canEdit && (
            <div className="mb-4 p-3 rounded border bg-yellow-50 text-sm text-slate-700 dark:bg-yellow-100 dark:text-slate-900">
              You can view this document but you do not have permission to edit
              it. Contact a Project Manager or Admin to request changes.
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Document Filename"
              className="border p-3 rounded text-sm text-slate-900 dark:text-white dark:bg-gray-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!canEdit || mutation.isPending}
            />

            <div className="flex items-center gap-3 flex-wrap">
              <PMOnly>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Saving..." : "Save Document"}
                </button>
              </PMOnly>

              <Link
                href="/documents"
                className="px-3 py-2 border rounded text-sm dark:border-slate-600"
              >
                Cancel
              </Link>
            </div>

            <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              <div className="truncate">
                <strong>File URL:</strong>{" "}
                <a
                  href={data?.file}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {data?.file ?? "—"}
                </a>
              </div>
              <div className="mt-2">
                <strong>Content type:</strong> {data?.content_type ?? "—"}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
