"use client";

import React from "react";
import { useRoles, useIsAdmin } from "@/context/AuthContext";

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

  const allowed =
    isAdmin ||
    roles.some((r) =>
      String(r).toLowerCase().match(/^(pm|project manager|project_manager)$/)
    );

  return <>{allowed ? children : fallback}</>;
}
