// frontend/app/documents/create/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { uploadFile, UploadResult } from "@/lib/upload";
import Image from "next/image";
import AdminOnly from "@/components/auth/AdminOnly";
import PMOnly from "@/components/auth/PMOnly";
import WorkerOnly from "@/components/auth/WorkerOnly";

export default function DocumentCreatePage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isPreviewVisible, setPreviewVisible] = useState<boolean>(false);
  const [project, setProject] = useState<string>("");
  const [notifyPM, setNotifyPM] = useState<boolean>(true);
  const [visibilityAll, setVisibilityAll] = useState<boolean>(true);

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
    <div className="min-h-screen p-6 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 rounded-2xl p-6 bg-gradient-to-r from-[#071433] to-[#0d3358] text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Upload Document</h1>
              <p className="text-sm opacity-90 mt-1">Choose a file and upload it to the team repository. Keep filenames clear and descriptive.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/documents" className="px-3 py-2 bg-white/10 rounded text-sm text-white truncate">Back to documents</Link>
              <Link href="/documents" className="px-3 py-2 bg-white text-slate-800 rounded text-sm truncate">Cancel</Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpload();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Choose file</label>

              {/* Styled file input */}
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-between p-3 border rounded cursor-pointer hover:shadow-sm">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{file ? file.name : "No file selected"}</div>
                    <div className="text-xs text-slate-500 mt-1">Accepted: pdf, docx, xlsx, png, jpg — Max 25MB</div>
                  </div>
                  <input type="file" accept="*" onChange={handleFileChange} className="hidden" />
                  <span className="ml-4 inline-block px-3 py-1 bg-slate-800 text-white rounded text-sm">Choose</span>
                </label>

                <button
                  type="button"
                  className="px-3 py-2 bg-gray-100 rounded border text-sm text-slate-700"
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
            </div>

            {file && (
              <div className="text-sm text-slate-600 truncate">
                <strong>Selected:</strong> {file.name} — {(file.size / 1024).toFixed(1)} KB — {file.type || "unknown"}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="px-4 py-2 rounded bg-blue-600 text-white font-medium text-sm disabled:opacity-60 truncate"
                disabled={!file || mutation.isPending}
              >
                {mutation.isPending ? `Uploading ${progress}%` : "Upload"}
              </button>

              <button
                type="button"
                className="px-4 py-2 rounded bg-white border text-slate-700 text-sm truncate"
                onClick={() => {
                  setFile(null);
                  setUploadResult(null);
                  setProgress(0);
                  setPreviewVisible(false);
                }}
              >
                Clear
              </button>

              <Link href="/documents" className="px-4 py-2 rounded text-sm border truncate">Cancel</Link>
            </div>

            {/* Progress */}
            {mutation.isPending && (
              <div className="mt-2">
                <div className="w-full bg-gray-100 rounded h-3">
                  <div className="bg-blue-600 h-3 rounded" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-sm mt-1">{progress}%</p>
              </div>
            )}

            {/* Role-specific options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <PMOnly>
                <div className="p-3 border rounded">
                  <label className="block text-xs text-slate-600 mb-1">Assign to project (optional)</label>
                  <input
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    placeholder="Project name or ID (optional)"
                    className="w-full px-3 py-2 border rounded placeholder:text-slate-400 text-sm"
                  />
                  <div className="text-xs text-slate-500 mt-1">PMs can tag a document to a project for easier lookup.</div>
                </div>
              </PMOnly>

              <AdminOnly>
                <div className="p-3 border rounded">
                  <label className="block text-xs text-slate-600 mb-1">Visibility</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setVisibilityAll(true)}
                      className={`px-3 py-1 rounded text-sm truncate ${visibilityAll ? "bg-slate-800 text-white" : "bg-white border text-slate-700"}`}
                    >
                      All teams
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibilityAll(false)}
                      className={`px-3 py-1 rounded text-sm truncate ${!visibilityAll ? "bg-slate-800 text-white" : "bg-white border text-slate-700"}`}
                    >
                      Restricted
                    </button>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Admin-only setting controls visibility across the organization.</div>
                </div>
              </AdminOnly>

              <WorkerOnly>
                <div className="p-3 border rounded">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={notifyPM} onChange={(e) => setNotifyPM(e.target.checked)} />
                    <span>Notify project manager after upload</span>
                  </label>
                </div>
              </WorkerOnly>
            </div>

            {/* Preview + metadata */}
            {isPreviewVisible && imagePreviewUrl && (
              <div className="mt-4">
                <h3 className="font-semibold text-sm mb-2">Preview</h3>
                <div className="rounded overflow-hidden w-full max-w-md">
                  <Image
                    src={imagePreviewUrl}
                    alt="Preview"
                    width={600}
                    height={400}
                    className="max-h-80 object-contain bg-gray-50"
                  />
                </div>
              </div>
            )}

            {uploadResult && (
              <div className="mt-4">
                <h3 className="font-semibold text-sm mb-2">Upload metadata</h3>
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
          </form>
        </div>
      </div>
    </div>
  );
}
