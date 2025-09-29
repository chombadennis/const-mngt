"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { loginUser, LoginData, LoginResponse, api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types/User";

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState<LoginData>({ email: "", password: "" });

  const mutation = useMutation<LoginResponse, Error, LoginData>({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      const token = data.token;

      // Fetch the user profile after login
      const userResp = await api.get<User>("/auth/me/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      login(token, userResp.data);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      {mutation.isError && (
        <p className="text-red-500 mb-2">{mutation.error.message}</p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-blue-500 text-white p-2 rounded disabled:opacity-50"
        >
          {mutation.isPending ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
