// frontend/app/documents/create/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { uploadFile, UploadResult } from "@/lib/upload";
import Image from "next/image";

export default function DocumentCreatePage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isPreviewVisible, setPreviewVisible] = useState<boolean>(false);

  // Mutation used for backend upload (server-side)
  const mutation = useMutation<UploadResult, Error, File>({
    mutationFn: (f: File) => uploadFile(f, { backend: true, onProgress: (p) => setProgress(p) }),
    onMutate: () => {
      setProgress(0);
      toast.loading("Uploading...");
    },
    onSuccess: (res) => {
      setUploadResult(res);
      setPreviewVisible(true);
      toast.dismiss();
      toast.success("Document uploaded and saved.");
      // redirect to documents list (or view)
      router.push("/documents");
    },
    onError: (err) => {
      toast.dismiss();
      toast.error(err?.message ?? "Upload failed");
    },
  });

  // Handler for file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setUploadResult(null);
    setPreviewVisible(false);
    setProgress(0);
  };

  // Upload button handler: server-side upload only
  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first.");
      return;
    }

    mutation.mutate(file);
  };

  // Helper: preview image if uploaded
  const imagePreviewUrl = uploadResult?.url ?? (file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null);

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Upload Document</h1>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Choose file</label>
        <input type="file" accept="*" onChange={handleFileChange} />
      </div>

      {file && (
        <div className="mb-4">
          <p>
            <strong>Selected:</strong> {file.name} — {(file.size / 1024).toFixed(1)} KB — {file.type || "unknown"}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={!file || mutation.isPending}
          onClick={handleUpload}
        >
          {mutation.isPending ? `Uploading ${progress}%` : "Upload"}
        </button>

        <button
          className="bg-gray-200 px-4 py-2 rounded"
          onClick={() => {
            setFile(null);
            setUploadResult(null);
            setProgress(0);
            setPreviewVisible(false);
          }}
        >
          Reset
        </button>
      </div>

      {/* Progress */}
      {mutation.isPending && (
        <div className="mt-4">
          <div className="w-full bg-gray-100 rounded h-3">
            <div className="bg-blue-600 h-3 rounded" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm mt-1">{progress}%</p>
        </div>
      )}

      {/* Preview + metadata */}
      {isPreviewVisible && imagePreviewUrl && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Preview</h3>
          <Image
            src={imagePreviewUrl}
            alt="Preview"
            width={300}
            height={200}
            className="max-h-40 object-cover mt-2"
          />
        </div>
      )}

      {uploadResult && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Upload metadata</h3>
          <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(
              {
                url: uploadResult.url,
                filename: uploadResult.filename,
                size: uploadResult.size,
                content_type: uploadResult.content_type,
                public_id: uploadResult.public_id,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
