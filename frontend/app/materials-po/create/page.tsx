"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPurchaseOrder, PurchaseOrder, PurchaseOrderLine } from "@/lib/api";
import PMOnly from "@/components/auth/PMOnly";

export default function CreatePOPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<PurchaseOrder>({
    supplier: "",
    order_date: new Date().toISOString().split("T")[0],
    status: "Pending",
    lines: [
      {
        material: 0,
        description: "",
        quantity: 0,
        unit_price: 0,
      },
    ],
  });

  const [saveError, setSaveError] = useState<string>("");

  const mutation = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      alert("Purchase order created successfully");
      router.push("/materials-po");
    },
    onError: () => {
      setSaveError("Failed to create purchase order. Please check your inputs and try again.");
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
          material: prev.lines?.[0]?.material ?? 0,
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
    setSaveError("");
    mutation.mutate(form);
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6">
      <div
        className="rounded-2xl shadow overflow-hidden"
        style={{ background: "linear-gradient(90deg, #071433, #0d3358)" }}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white">Create Purchase Order</h1>
          <p className="text-sm text-white/85 mt-1">Fill in the details below to create a new PO</p>
        </div>

        <PMOnly fallback={
          <div className="bg-white rounded-b-2xl p-6">
            <p className="text-red-500">You don’t have permission to create purchase orders.</p>
          </div>
        }>
          <div className="bg-white rounded-b-2xl p-6">
            {saveError && <div className="text-red-500 text-sm mb-3">{saveError}</div>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="supplier" className="text-sm font-medium text-slate-700 block mb-1">
                  Supplier
                </label>
                <input
                  id="supplier"
                  type="text"
                  name="supplier"
                  placeholder="e.g., Acme Supplies Ltd"
                  value={form.supplier}
                  onChange={handleChange}
                  className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 bg-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="order_date" className="text-sm font-medium text-slate-700 block mb-1">
                  Order date
                </label>
                <input
                  id="order_date"
                  type="date"
                  name="order_date"
                  value={form.order_date}
                  onChange={handleChange}
                  className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 bg-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="status" className="text-sm font-medium text-slate-700 block mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Single line item */}
              <div>
                <label htmlFor="line_material" className="text-sm font-medium text-slate-700 block mb-1">
                  Material ID
                </label>
                <input
                  id="line_material"
                  type="number"
                  name="line_material"
                  placeholder="e.g., 123"
                  value={form.lines?.[0]?.material || 0}
                  onChange={handleChange}
                  className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 bg-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="line_description" className="text-sm font-medium text-slate-700 block mb-1">
                  Description
                </label>
                <input
                  id="line_description"
                  type="text"
                  name="line_description"
                  placeholder="Short description of the material or purpose"
                  value={form.lines?.[0]?.description || ""}
                  onChange={handleChange}
                  className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 bg-white"
                />
              </div>

              <div>
                <label htmlFor="line_quantity" className="text-sm font-medium text-slate-700 block mb-1">
                  Quantity
                </label>
                <input
                  id="line_quantity"
                  type="number"
                  name="line_quantity"
                  placeholder="0"
                  value={form.lines?.[0]?.quantity || 0}
                  onChange={handleChange}
                  className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 bg-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="line_unit_price" className="text-sm font-medium text-slate-700 block mb-1">
                  Unit price
                </label>
                <input
                  id="line_unit_price"
                  type="number"
                  step="0.01"
                  name="line_unit_price"
                  placeholder="0.00"
                  value={form.lines?.[0]?.unit_price || 0}
                  onChange={handleChange}
                  className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 bg-white"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="bg-green-500 text-white px-4 py-2 rounded-md disabled:opacity-50 hover:bg-green-600 transition"
                >
                  {mutation.isPending ? "Creating..." : "Create PO"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/materials-po")}
                  className="bg-slate-100 text-slate-900 px-3 py-2 rounded-md hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </PMOnly>
      </div>
    </div>
  );
}
