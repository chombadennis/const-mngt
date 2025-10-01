"use client";

import React from "react";
import { useRoles, useIsAdmin, useUser } from "@/context/AuthContext";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/**
 * Show children only to Admins.
 * Uses both roles from token and is_superuser fallback.
 */
export default function AdminOnly({ children, fallback = null }: Props) {
  const roles = useRoles();
  const isAdmin = useIsAdmin();
  const user = useUser();

  const allowed =
    isAdmin ||
    user?.is_superuser ||
    roles.some((r) =>
      String(r).toLowerCase().match(/^(admin|administrator)$/)
    );

  return <>{allowed ? children : fallback}</>;
}
