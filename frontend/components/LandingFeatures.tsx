"use client";

import { HardHat, ClipboardList, Users, Truck, FileText, DollarSign } from "lucide-react";

const features = [
  { title: "Projects", desc: "Plan, track and deliver projects on time", icon: ClipboardList },
  { title: "Workers", desc: "Manage workers and assignments seamlessly", icon: Users },
  { title: "Equipment", desc: "Track and schedule machinery efficiently", icon: Truck },
  { title: "Materials", desc: "Stay on top of materials and purchase orders", icon: HardHat },
  { title: "Inspections", desc: "Monitor site safety and compliance", icon: FileText },
  { title: "Invoices", desc: "Generate and manage invoices easily", icon: DollarSign },
];

export default function LandingFeatures() {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Everything You Need to Run Your Projects
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(({ title, desc, icon: Icon }) => (
            <div
              key={title}
              className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-lg transition"
            >
              <Icon className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
