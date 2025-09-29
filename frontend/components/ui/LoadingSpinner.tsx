"use client";

import React from "react";

type Props = {
  message?: string;
  size?: number; // svg size in px
  className?: string;
};

export default function LoadingSpinner({
  message = "Loading…",
  size = 36,
  className = "",
}: Props) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        role="status"
        aria-label={message}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className="animate-spin"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="4"
          fill="none"
        />
        <path
          d="M22 12a10 10 0 00-10-10"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="mt-2 text-sm text-gray-600">{message}</span>
    </div>
  );
}
