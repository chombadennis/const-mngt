"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getMaterialById, updateMaterial, Material } from "@/lib/api";
import PMOnly from "@/components/auth/PMOnly";
import Link from "next/link";

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

  if (isLoading) return <p className="text-center text-white mt-8">Loading material...</p>;
  if (isError) return <p className="text-center text-red-500 mt-8">Error loading material.</p>;

  return (
    <PMOnly fallback={<p className="text-center mt-12 text-white">You don’t have permission to edit materials.</p>}>
      <div className="min-h-screen bg-gradient-to-b from-[#071433] to-[#0d3358] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#071433] to-[#0d3358] p-4">
            <h1 className="text-2xl font-bold text-white">Edit Material</h1>
          </div>
          <div className="p-6">
            {mutation.isError && (
              <p className="text-red-500 mb-2">
                {mutation.error?.message ?? "An error occurred"}
              </p>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">SKU</label>
                <input
                  type="text"
                  name="sku"
                  placeholder="SKU"
                  value={form.sku}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Material Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Material Name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  name="description"
                  placeholder="Description"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Unit</label>
                <input
                  type="text"
                  name="unit"
                  placeholder="Unit (e.g., bag, kg, piece)"
                  value={form.unit}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg disabled:opacity-50"
              >
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </button>
              <Link
                href="/materials"
                className="text-blue-600 hover:underline text-sm text-center"
              >
                Back to Materials
              </Link>
            </form>
          </div>
        </div>
      </div>
    </PMOnly>
  );
}
