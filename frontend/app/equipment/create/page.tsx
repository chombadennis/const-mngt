"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEquipment, Equipment } from "@/lib/api";

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
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="max-w-lg mx-auto mt-12 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Create Equipment</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
  name="name"
  placeholder="Equipment Name"
  value={form.name}
  onChange={handleChange}
  className="border p-2 rounded"
  required
/>
<input
  name="serial_number"
  placeholder="Serial Number"
  value={form.serial_number}
  onChange={handleChange}
  className="border p-2 rounded"
/>
<input
  type="date"
  name="purchase_date"
  value={form.purchase_date}
  onChange={handleChange}
  className="border p-2 rounded"
/>
<input
  type="date"
  name="last_service_date"
  value={form.last_service_date}
  onChange={handleChange}
  className="border p-2 rounded"
/>
        <button
          type="submit"
          className="bg-green-500 text-white p-2 rounded disabled:opacity-50"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Creating..." : "Create Equipment"}
        </button>
      </form>
    </div>
  );
}
