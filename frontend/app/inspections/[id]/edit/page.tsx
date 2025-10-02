"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Inspection, updateInspection, fetchInspection } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import PMOnly from "@/components/auth/PMOnly";

export default function EditInspectionPage() {
  const params = useParams();
  const inspectionId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<Inspection>({
    queryKey: ["inspection", inspectionId],
    queryFn: () => fetchInspection(inspectionId!),
    enabled: !!inspectionId,
  });

  const mutation = useMutation({
    mutationFn: (inspection: Omit<Inspection, "id" | "created_at">) =>
      updateInspection(inspectionId!, inspection),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
      alert("Inspection updated");
      router.push("/inspections");
    },
  });

  const [form, setForm] = useState<Omit<Inspection, "id" | "created_at">>({
    project: "",
    notes: "",
    date: "",
    photo_url: "",
  });

  useEffect(() => {
    if (data) {
      setForm((f) => ({
        ...f,
        ...data,
        photo_url: data.photo ? `${data.photo_url || ""}` : undefined,
      }));
    }
  }, [data]);

  if (!inspectionId)
    return (
      <div className="min-h-screen p-6 bg-gradient-to-b from-[#071433] to-[#0d3358] text-white">
        <p>Inspection ID missing</p>
      </div>
    );
  if (isLoading)
    return (
      <div className="min-h-screen p-6 bg-gradient-to-b from-[#071433] to-[#0d3358] text-white">
        <p>Loading inspection...</p>
      </div>
    );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fakeUrl = URL.createObjectURL(file);
    setForm((f) => ({ ...f, photo_url: fakeUrl }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <PMOnly
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#071433] to-[#0d3358] text-white">
          <p>You don’t have permission to edit inspections.</p>
        </div>
      }
    >
      <div className="min-h-screen p-6 bg-gradient-to-b from-[#071433] to-[#0d3358] text-white">
        <div className="max-w-lg mx-auto mt-12 p-6 bg-white/5 border border-white/10 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Edit Inspection</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              name="project"
              placeholder="Project ID"
              value={form.project}
              onChange={handleChange}
              className="border border-white/10 bg-white/10 p-2 rounded placeholder:text-gray-300 text-white"
              required
            />
            <input
              type="date"
              name="date"
              value={form.date.split("T")[0]}
              onChange={handleChange}
              className="border border-white/10 bg-white/10 p-2 rounded text-white"
              required
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="border border-white/10 bg-white/10 p-2 rounded text-white"
            />
            {form.photo_url && (
              <Image
                src={form.photo_url}
                alt="Preview"
                className="mt-2 max-h-48 rounded"
                width={400}
                height={300}
              />
            )}
            <div className="flex items-center gap-3 mt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded text-sm bg-blue-500 text-white font-medium disabled:opacity-50"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Saving..." : "Save Inspection"}
              </button>
              <Link
                href="/inspections"
                className="px-3 py-2 rounded text-sm bg-white/10 text-white"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </PMOnly>
  );
}
