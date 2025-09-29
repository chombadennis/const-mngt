"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getMaterialById, updateMaterial, Material } from "@/lib/api";

export default function EditMaterialPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const materialId = Number(params?.id);

  const [form, setForm] = useState<Omit<Material, "id" | "company" | "created_at">>({
    sku: "",
    name: "",
    description: "",
    unit: "",
  });

  const { data, isLoading, isError } = useQuery<Material>({
    queryKey: ["materials", materialId],
    queryFn: () => getMaterialById(materialId),
    enabled: !!materialId,
  });

  useEffect(() => {
    if (data) {
      setForm({
        sku: data.sku,
        name: data.name,
        description: data.description,
        unit: data.unit,
      });
    }
  }, [data]);

  const mutation = useMutation<Material, Error, typeof form>({
    mutationFn: (updated) => updateMaterial(materialId, updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Material updated successfully");
      router.push("/materials");
    },
    onError: (err: Error) => {
      toast.error(err?.message ?? "Failed to update material");
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

  if (isLoading) return <p>Loading material...</p>;
  if (isError) return <p>Error loading material.</p>;

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Edit Material</h1>

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
          className="bg-blue-500 text-white p-2 rounded disabled:opacity-50"
        >
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
