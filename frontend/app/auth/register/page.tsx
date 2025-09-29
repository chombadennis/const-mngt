"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { registerUser, RegisterData, api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import  { User }  from "@/types/User";


// --- Local User type (consistent with backend + AuthContext) ---
//export interface User {
 // id: string;
  // email: string;
  // full_name: string;
  // username: string;
  // roles: string[];
//}

// --- Union type for possible register responses ---
type RegisterResponse =
  | { token: string; user: User }
  | { access: string };

// --- Type Guards ---
function isTokenUserResponse(data: RegisterResponse): data is { token: string; user: User } {
  return "token" in data && "user" in data;
}

function isAccessResponse(data: RegisterResponse): data is { access: string } {
  return "access" in data;
}

export default function RegisterPage() {
  const { login } = useAuth();

  // Form state
  const [form, setForm] = useState<RegisterData>({
    email: "",
    password: "",
    full_name: "",
  });

  // Mutation: register
  const mutation = useMutation<RegisterResponse, Error, RegisterData>({
    mutationFn: registerUser as (data: RegisterData) => Promise<RegisterResponse>,
    onSuccess: async (data) => {
      try {
        if (isTokenUserResponse(data)) {
          login(data.token, data.user);
        } else if (isAccessResponse(data)) {
          const token = data.access;
          const userResp = await api.get<User>("/auth/me/", {
            headers: { Authorization: `Bearer ${token}` },
          });
          login(token, userResp.data);
        }
      } catch (err) {
        console.error("Auto-login failed:", err);
      }
    },
  });

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Register</h1>

      {mutation.isError && (
        <p className="text-red-500 mb-2">{mutation.error?.message}</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          value={form.full_name}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
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
          className="bg-green-500 text-white p-2 rounded disabled:opacity-50"
        >
          {mutation.isPending ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
