"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInspection, Inspection } from "@/lib/api";
import Image from "next/image";

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
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fakeUrl = URL.createObjectURL(file);
    setForm(f => ({ ...f, photo_url: fakeUrl }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="max-w-lg mx-auto mt-12 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Create Inspection</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          name="project"
          placeholder="Project ID"
          value={form.project}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="date"
          name="date"
          value={form.date.split("T")[0]}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="border p-2 rounded"
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
        <button
          type="submit"
          className="bg-green-500 text-white p-2 rounded disabled:opacity-50"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Creating..." : "Create Inspection"}
        </button>
      </form>
    </div>
  );
}
