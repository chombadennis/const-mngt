"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Equipment, fetchSingleEquipment, updateEquipment } from "@/lib/api";

export default function EditEquipmentPage() {
  const params = useParams();
  const equipmentId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<Equipment>({
    queryKey: ["equipment", equipmentId],
    queryFn: () => fetchSingleEquipment(equipmentId!),
    enabled: !!equipmentId,
  });

  const mutation = useMutation({
    mutationFn: (equipment: Equipment) => updateEquipment(equipment.id!, equipment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      alert("Equipment updated");
      router.push("/equipment");
    },
  });

  const [form, setForm] = useState<Equipment>({
  id: equipmentId || "",
  name: "",
  serial_number: "",
  purchase_date: "",
  last_service_date: "",
});


  useEffect(() => {
    if (data) setForm(f => ({ ...f, ...data }));
  }, [data]);

  if (!equipmentId) return <p>Equipment ID missing</p>;
  if (isLoading) return <p>Loading equipment...</p>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="max-w-lg mx-auto mt-12 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Edit Equipment</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          name="name"
          placeholder="Equipment Name"
          value={form.name}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded disabled:opacity-50"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving..." : "Save Equipment"}
        </button>
      </form>
    </div>
  );
}
