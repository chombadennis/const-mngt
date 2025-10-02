"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInspection, Inspection } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import PMOnly from "@/components/auth/PMOnly";

export default function CreateInspectionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<Omit<Inspection, "id" | "created_at">>({
    project: "",
    notes: "",
    date: "",
    photo_url: "",
  });

  const mutation = useMutation({
    mutationFn: (data: Omit<Inspection, "id" | "created_at">) => createInspection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
      alert("Inspection created successfully");
      router.push("/inspections");
    },
  });

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
          <p>You don’t have permission to create inspections.</p>
        </div>
      }
    >
      <div className="min-h-screen p-6 bg-gradient-to-b from-[#071433] to-[#0d3358] text-white">
        <div className="max-w-lg mx-auto mt-12 p-6 bg-white/5 border border-white/10 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Create Inspection</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              name="project"
              placeholder="Project ID"
              value={form.project}
              onChange={handleChange}
              className="border border-white/10 bg-white/5 p-3 rounded placeholder:text-slate-200 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4e86]"
              required
            />
            <input
              type="date"
              name="date"
              value={form.date.split("T")[0]}
              onChange={handleChange}
              placeholder="YYYY-MM-DD"
              className="border border-white/10 bg-white/5 p-3 rounded text-white text-sm placeholder:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f4e86]"
              required
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="border border-white/10 bg-white/5 p-3 rounded text-white text-sm"
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
                className="px-4 py-2 rounded text-sm bg-green-500 text-white font-medium disabled:opacity-50"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Creating..." : "Create Inspection"}
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
