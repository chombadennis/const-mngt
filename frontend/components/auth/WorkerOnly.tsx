"use client";

import React from "react";
import { useRoles, useIsAdmin } from "@/context/AuthContext";

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

  const allowed =
    isAdmin ||
    roles.some((r) =>
      String(r).toLowerCase().match(/^(worker|employee|labour|labor)$/)
    );

  return <>{allowed ? children : fallback}</>;
}
