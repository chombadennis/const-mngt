"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { updateInvoice, Invoice, api } from "@/lib/api"
import PMOnly from "@/components/auth/PMOnly"

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

  if (!invoiceId) return <p className="text-center mt-12 text-gray-600">Invoice ID missing</p>
  if (isLoading) return <p className="text-center mt-12 text-gray-600">Loading invoice...</p>

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: name === "amount" ? Number(value) : value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(form)
  }

  return (
    <PMOnly fallback={<p className="text-center mt-12 text-gray-600">You don’t have permission to edit invoices.</p>}>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 p-6">
        <div className="rounded-2xl p-6 bg-gradient-to-r from-[#071433] to-[#0d3358] text-white shadow-md mb-6">
          <h1 className="text-2xl font-bold">Edit Invoice</h1>
        </div>
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 bg-white shadow rounded-2xl flex flex-col gap-4">
          <input
            name="project"
            placeholder="Enter Project ID"
            value={form.project}
            onChange={handleChange}
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="number"
            name="amount"
            placeholder="Enter Amount"
            value={form.amount}
            onChange={handleChange}
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save Invoice"}
          </button>
        </form>
      </div>
    </PMOnly>
  )
}
