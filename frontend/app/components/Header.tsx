"use client";

import Link from "next/link";

export const Header = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold text-primary">Construction App</h1>
      <nav>
        <Link href="/" className="mr-4">Dashboard</Link>
        <Link href="/projects" className="mr-4">Projects</Link>
        <Link href="/timesheets">Timesheets</Link>
      </nav>
    </header>
  );
};
