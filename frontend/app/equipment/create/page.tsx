"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEquipment, Equipment } from "@/lib/api";
import AdminOnly from "@/components/auth/AdminOnly";
import PMOnly from "@/components/auth/PMOnly";
import WorkerOnly from "@/components/auth/WorkerOnly";

export default function CreateEquipmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<Equipment>({
    id: "",
    name: "",
    serial_number: "",
    purchase_date: "",
    last_service_date: "",
  });

  const mutation = useMutation({
    mutationFn: createEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      alert("Equipment created successfully");
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

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-[#071433] to-[#0d3358] text-white">
      <div className="max-w-lg mx-auto mt-12 p-6 bg-white/5 border border-white/10 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Create Equipment</h1>
            <p className="text-sm text-gray-200 mt-1">Add a new equipment record for your company.</p>
          </div>
          <Link href="/equipment" className="text-sm text-gray-200 hover:underline">
            Back to list
          </Link>
        </div>

        <PMOnly
          fallback={
            <div className="p-6 rounded bg-white/3">
              <p className="text-sm">You don’t have permission to create equipment. Contact an administrator if you need access.</p>
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
                placeholder="e.g., Caterpillar 320 Excavator"
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
                {mutation.isPending ? "Creating..." : "Create"}
              </button>

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
