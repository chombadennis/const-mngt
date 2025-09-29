"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createMaterial, Material } from "@/lib/api";

export default function CreateMaterialPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<Omit<Material, "id" | "company" | "created_at">>({
    sku: "",
    name: "",
    description: "",
    unit: "",
  });

  const mutation = useMutation<Material, Error, typeof form>({
    mutationFn: createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Material created successfully");
      router.push("/materials");
    },
    onError: (err: Error) => {
      toast.error(err?.message ?? "Failed to create material");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Create Material</h1>

      {mutation.isError && (
        <p className="text-red-500 mb-2">
          {mutation.error?.message ?? "An error occurred"}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          name="sku"
          placeholder="SKU"
          value={form.sku}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          name="name"
          placeholder="Material Name"
          value={form.name}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="unit"
          placeholder="Unit (e.g., bag, kg, piece)"
          value={form.unit}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-green-500 text-white p-2 rounded disabled:opacity-50"
        >
          {mutation.isPending ? "Creating..." : "Create"}
        </button>
      </form>
    </div>
  );
}
