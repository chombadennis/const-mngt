"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchEquipmentById, updateEquipment, Equipment } from "@/lib/api";
import AdminOnly from "@/components/auth/AdminOnly";
import PMOnly from "@/components/auth/PMOnly";
import WorkerOnly from "@/components/auth/WorkerOnly";

export default function EditEquipmentPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id ?? "");

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<Equipment | null>({
    queryKey: ["equipment", id],
    queryFn: () => fetchEquipmentById(id),
    enabled: Boolean(id),
  });

  const [form, setForm] = useState<Equipment>({
    id: "",
    name: "",
    serial_number: "",
    purchase_date: "",
    last_service_date: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        id: data.id ?? "",
        name: data.name ?? "",
        serial_number: data.serial_number ?? "",
        purchase_date: data.purchase_date ?? "",
        last_service_date: data.last_service_date ?? "",
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: updateEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      alert("Equipment updated successfully");
      router.push("/equipment");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (isLoading)
    return (
      <div className="min-h-screen p-6 bg-gradient-to-b from-[#071433] to-[#0d3358] text-white">
        <p>Loading equipment...</p>
      </div>
    );
  if (isError)
    return (
      <div className="min-h-screen p-6 bg-gradient-to-b from-[#071433] to-[#0d3358] text-white">
        <p>Error loading equipment.</p>
      </div>
    );

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-[#071433] to-[#0d3358] text-white">
      <div className="max-w-lg mx-auto mt-12 p-6 bg-white/5 border border-white/10 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Edit Equipment</h1>
            <p className="text-sm text-gray-200 mt-1">Update equipment details below.</p>
          </div>
          <Link href="/equipment" className="text-sm text-gray-200 hover:underline">
            Back to list
          </Link>
        </div>

        <PMOnly
          fallback={
            <div className="p-6 rounded bg-white/3">
              <p className="text-sm">
                You don’t have permission to edit equipment. Contact an administrator if you need access.
              </p>
              <div className="mt-4">
                <WorkerOnly>
                  <Link href="/equipment" className="inline-block px-3 py-2 rounded bg-white/10 text-sm">
                    Back to equipment
                  </Link>
                </WorkerOnly>
              </div>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col">
              <span className="text-sm text-gray-200 mb-1">Equipment Name</span>
              <input
                name="name"
                placeholder="Equipment name"
                value={form.name}
                onChange={handleChange}
                className="border border-white/10 bg-white/3 p-2 rounded placeholder:text-gray-400 text-white"
                required
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-200 mb-1">Serial Number</span>
              <input
                name="serial_number"
                placeholder="Serial number or asset tag"
                value={form.serial_number}
                onChange={handleChange}
                className="border border-white/10 bg-white/3 p-2 rounded placeholder:text-gray-400 text-white"
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-200 mb-1">Purchase Date</span>
              <input
                type="date"
                name="purchase_date"
                value={form.purchase_date}
                onChange={handleChange}
                className="border border-white/10 bg-white/3 p-2 rounded placeholder:text-gray-400 text-white"
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-200 mb-1">Last Service Date</span>
              <input
                type="date"
                name="last_service_date"
                value={form.last_service_date}
                onChange={handleChange}
                className="border border-white/10 bg-white/3 p-2 rounded placeholder:text-gray-400 text-white"
              />
            </label>

            <div className="flex items-center gap-3 mt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded text-sm bg-white text-[#071433] font-medium disabled:opacity-50"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Saving..." : "Save"}
              </button>

              <AdminOnly>
                <button
                  type="button"
                  className="px-3 py-2 rounded text-sm bg-red-600 text-white"
                  onClick={() => {
                    if (confirm("Delete this equipment? This action cannot be undone.")) {
                      if (form.id) {
                        alert("Please delete from the equipment list. Navigating back.");
                        router.push("/equipment");
                      }
                    }
                  }}
                >
                  Delete
                </button>
              </AdminOnly>

              <Link href="/equipment" className="px-3 py-2 rounded text-sm bg-white/5">
                Cancel
              </Link>
            </div>
          </form>
        </PMOnly>
      </div>
    </div>
  );
}
