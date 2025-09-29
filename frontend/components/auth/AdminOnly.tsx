"use client";

import React from "react";
import { useRoles, useIsAdmin } from "@/context/AuthContext";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/**
 * Show children only to Admins.
 * Uses both roles from token and is_staff fallback.
 */
export default function AdminOnly({ children, fallback = null }: Props) {
  const roles = useRoles();
  const isAdmin = useIsAdmin();

  const allowed =
    isAdmin ||
    roles.some((r) =>
      String(r).toLowerCase().match(/^(admin|administrator)$/)
    );

  return <>{allowed ? children : fallback}</>;
}
