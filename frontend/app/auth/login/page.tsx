"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { loginUser, LoginData, LoginResponse, api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { User as BaseUser } from "@/types/User";

type User = BaseUser & { is_superuser: boolean };

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState<LoginData>({ username: "", password: "" });

  const mutation = useMutation<LoginResponse, Error, LoginData>({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      const token = data.token;

      // Fetch the user profile after login
      const userResp = await api.get<User>("/auth/me/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // AuthContext.login will handle saving and redirecting to /dashboard
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-900 via-gray-900 to-black">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">Login</h1>
        {mutation.isError && (
          <p className="text-red-400 mb-4 text-center">{mutation.error.message}</p>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            name="username"
            placeholder="username"
            value={form.username}
            onChange={handleChange}
            className="border border-gray-600 p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="border border-gray-600 p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={mutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded transition disabled:opacity-50"
          >
            {mutation.isPending ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
