"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { updateInvoice, Invoice, api } from "@/lib/api"

type InvoiceEditForm = {
  id: string
  project: string
  amount: number
  status: string
  due_date: string
}

export default function EditInvoicePage() {
  const params = useParams()
  const invoiceId = Array.isArray(params?.id) ? params.id[0] : params?.id
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<Invoice>({
    queryKey: ["invoice", invoiceId],
    queryFn: async () => {
      const res = await api.get(`/invoices/${invoiceId}/`)
      return res.data as Invoice
    },
    enabled: !!invoiceId,
  })

  const mutation = useMutation({
    mutationFn: (form: InvoiceEditForm) => {
      const payload: Invoice = {
        id: form.id,
        project: { id: form.project, name: "" },
        amount: form.amount,
        status: form.status,
        due_date: form.due_date,
        number: "",
        date: "",
        created_at: "",
        company: "",
      }
      return updateInvoice(form.id, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
      alert("Invoice updated")
      router.push("/invoices")
    },
  })

  const [form, setForm] = useState<InvoiceEditForm>({
    id: invoiceId || "",
    project: "",
    amount: 0,
    status: "draft",
    due_date: "",
  })

  useEffect(() => {
    if (data) {
      setForm({
        id: data.id,
        project: data.project?.id || "",
        amount: data.amount,
        status: data.status,
        due_date: data.due_date,
      })
    }
  }, [data])

  if (!invoiceId) return <p>Invoice ID missing</p>
  if (isLoading) return <p>Loading invoice...</p>

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
      <h1 className="text-2xl font-bold mb-4">Edit Invoice</h1>
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
          className="bg-blue-500 text-white p-2 rounded disabled:opacity-50"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving..." : "Save Invoice"}
        </button>
      </form>
    </div>
  )
}
