"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPurchaseOrder, PurchaseOrder, PurchaseOrderLine } from "@/lib/api";

export default function CreatePOPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<PurchaseOrder>({
    supplier: "",
    order_date: new Date().toISOString().split("T")[0],
    status: "Pending",
    lines: [
      {
        material: 0, // material id
        description: "",
        quantity: 0,
        unit_price: 0,
      },
    ],
  });

  const mutation = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      alert("Purchase order created successfully");
      router.push("/materials-po");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value } = e.target;

  if (name.startsWith("line_")) {
    const field = name.replace("line_", "") as
      | "material"
      | "description"
      | "quantity"
      | "unit_price";

    setForm((prev) => {
      const updatedLine: PurchaseOrderLine = {
        ...prev.lines?.[0],
        material: prev.lines?.[0]?.material ?? 0, // always ensure number
        description: prev.lines?.[0]?.description ?? "",
        quantity: prev.lines?.[0]?.quantity ?? 0,
        unit_price: prev.lines?.[0]?.unit_price ?? 0,
        [field]: field === "quantity" || field === "unit_price" || field === "material"
          ? Number(value)
          : value,
      };

      return {
        ...prev,
        lines: [updatedLine],
      };
    });
  } else {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }
};


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Create Purchase Order</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          name="supplier"
          placeholder="Supplier"
          value={form.supplier}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="date"
          name="order_date"
          value={form.order_date}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        >
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>

        {/* Single line item */}
        <input
          type="number"
          name="line_material"
          placeholder="Material ID"
          value={form.lines?.[0]?.material || 0}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          name="line_description"
          placeholder="Description"
          value={form.lines?.[0]?.description || ""}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="number"
          name="line_quantity"
          placeholder="Quantity"
          value={form.lines?.[0]?.quantity || 0}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="number"
          step="0.01"
          name="line_unit_price"
          placeholder="Unit Price"
          value={form.lines?.[0]?.unit_price || 0}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />

        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-green-500 text-white p-2 rounded disabled:opacity-50"
        >
          {mutation.isPending ? "Creating..." : "Create PO"}
        </button>
      </form>
    </div>
  );
}
