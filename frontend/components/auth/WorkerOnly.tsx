"use client";

import React from "react";
import { useRoles, useIsAdmin, useUser } from "@/context/AuthContext";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/**
 * Show children only to Workers (or Admins).
 */
export default function WorkerOnly({ children, fallback = null }: Props) {
  const roles = useRoles();
  const isAdmin = useIsAdmin();
  const user = useUser();

  const allowed =
    isAdmin ||
    user?.is_superuser ||
    roles.some((r) =>
      String(r).toLowerCase().match(/^(worker|employee|labour|labor)$/)
    );

  return <>{allowed ? children : fallback}</>;
}
