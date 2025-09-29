"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createInvoice, Invoice } from "@/lib/api"

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
    <div className="max-w-lg mx-auto mt-12 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Create New Invoice</h1>
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
          type="number"
          name="amount"
          placeholder="Amount"
          value={form.amount}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="draft">Draft</option>
          <option value="issued">Issued</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
        <input
          type="date"
          name="due_date"
          value={form.due_date}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="bg-green-500 text-white p-2 rounded disabled:opacity-50"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Creating..." : "Create Invoice"}
        </button>
      </form>
    </div>
  )
}
