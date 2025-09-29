"use client";

import React from "react";

type Props = {
  message?: string;
  className?: string;
  children?: React.ReactNode;
};

export default function ErrorMessage({
  message,
  children,
  className = "",
}: Props) {
  const text = message ?? (typeof children === "string" ? children : undefined);

  return (
    <div
      role="alert"
      className={`p-3 rounded border border-red-100 bg-red-50 text-red-700 ${className}`}
    >
      <strong className="block font-medium">Error</strong>
      <div className="mt-1 text-sm">{text ?? children ?? "An error occurred."}</div>
    </div>
  );
}
