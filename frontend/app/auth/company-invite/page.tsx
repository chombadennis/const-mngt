"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteCompanyUser, CompanyInviteData, CompanyInviteResponse } from "@/lib/api";

export default function CompanyInvitePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form state
  const [form, setForm] = useState<CompanyInviteData>({
    email: "",
    role: "",
  });

  // Mutation
  const mutation = useMutation<CompanyInviteResponse, Error, CompanyInviteData>({
    mutationFn: inviteCompanyUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      alert("Invitation sent successfully!");
      router.push("/dashboard");
    },
  });

  // Input change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev: CompanyInviteData) => ({ ...prev, [name]: value }));
  };

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Invite Company User</h1>

      {mutation.isError && (
        <p className="text-red-500 mb-2">{mutation.error?.message}</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          name="email"
          placeholder="User Email"
          value={form.email}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        >
          <option value="">Select Role</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="employee">Employee</option>
        </select>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-purple-500 text-white p-2 rounded disabled:opacity-50"
        >
          {mutation.isPending ? "Sending..." : "Send Invite"}
        </button>
      </form>
    </div>
  );
}
