"use client";

import React from "react";
import { useRoles, useIsAdmin, useUser } from "@/context/AuthContext";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/**
 * Show children only to Project Managers (PM) or Admins.
 */
export default function PMOnly({ children, fallback = null }: Props) {
  const roles = useRoles();
  const isAdmin = useIsAdmin();
  const user = useUser();

  const allowed =
    isAdmin ||
    user?.is_superuser ||
    roles.some((r) =>
      String(r).toLowerCase().match(/^(pm|project manager|project_manager)$/)
    );

  return <>{allowed ? children : fallback}</>;
}
