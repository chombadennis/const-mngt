"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingHero() {
  return (
    <section className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20 px-6 text-center">
      <div className="max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-4xl sm:text-5xl font-extrabold leading-tight"
        >
          Manage Your Construction Projects <br /> Smarter & Faster
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="mt-6 text-lg sm:text-xl text-gray-100"
        >
          All-in-one platform for projects, workers, equipment, materials, timesheets, inspections, and invoices.
        </motion.p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/auth/register"
            className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold shadow hover:bg-gray-100 transition"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="border border-white px-6 py-3 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition"
          >
            Login
          </Link>
        </div>
      </div>
    </section>
  );
}
