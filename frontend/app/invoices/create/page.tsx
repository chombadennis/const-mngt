"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createInvoice, Invoice } from "@/lib/api"
import PMOnly from "@/components/auth/PMOnly"

// Form type: only the fields user can input
type InvoiceForm = {
  project: string // project ID
  amount: number
  status: string
  due_date: string
}

export default function CreateInvoicePage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<InvoiceForm>({
    project: "",
    amount: 0,
    status: "draft",
    due_date: "",
  })

  const mutation = useMutation({
    mutationFn: (data: InvoiceForm) => {
      const payload: Invoice = {
        id: "",
        project: { id: data.project, name: "" },
        amount: data.amount,
        status: data.status,
        due_date: data.due_date,
        number: "",
        date: "",
        created_at: "",
        company: "",
      }
      return createInvoice(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
      alert("Invoice created successfully")
      router.push("/invoices")
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: name === "amount" ? Number(value) : value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(form)
  }

  return (
    <PMOnly fallback={<p className="text-center mt-12 text-gray-600">You don’t have permission to create invoices.</p>}>
      <div className="min-h-screen bg-gradient-to-b from-[#071433] to-[#0d3358] p-6">
        <div className="rounded-2xl p-6 bg-gradient-to-r from-[#071433] to-[#0d3358] text-white shadow-md mb-6">
          <h1 className="text-2xl font-bold">Create New Invoice</h1>
        </div>
        <form
          onSubmit={handleSubmit}
          className="max-w-lg mx-auto p-8 bg-white dark:bg-gray-900 shadow-lg rounded-2xl flex flex-col gap-6"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Enter Project ID:
            </label>
            <input
              name="project"
              aria-label="Project ID"
              placeholder="Enter Project ID"
              value={form.project}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-700 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 bg-white dark:bg-gray-800 dark:text-white placeholder:dark:text-slate-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Enter Invoice Amount:
            </label>
            <input
              type="number"
              name="amount"
              aria-label="Amount"
              placeholder="Enter Amount"
              value={form.amount}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-700 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 bg-white dark:bg-gray-800 dark:text-white placeholder:dark:text-slate-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Invoice Status:
            </label>
            <select
              name="status"
              aria-label="Invoice status"
              value={form.status}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-700 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white dark:bg-gray-800 dark:text-white"
            >
              <option value="draft">Draft</option>
              <option value="issued">Issued</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Due Date:
            </label>
            <input
              type="date"
              name="due_date"
              aria-label="Due date"
              value={form.due_date}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-700 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white dark:bg-gray-800 dark:text-white"
              required
            />
          </div>

          <button
            type="submit"
            className="bg-gradient-to-r from-[#071433] to-[#0d3358] text-white px-6 py-3 rounded-lg shadow hover:opacity-90 transition disabled:opacity-50 font-medium"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Creating..." : "Create Invoice"}
          </button>
        </form>
      </div>
    </PMOnly>
  )
}
