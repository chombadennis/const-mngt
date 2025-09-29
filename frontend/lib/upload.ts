// frontend/lib/upload.ts
// File upload helper: supports backend multipart upload (to /documents/) and direct Cloudinary unsigned upload.
// Returns standardized metadata for the uploaded file.

export type UploadOptions = {
  backend?: boolean; // true = upload to backend (/documents/), false = direct Cloudinary unsigned
  folder?: string; // optional folder for cloudinary
  onProgress?: (percent: number) => void; // optional progress callback (0-100)
};

export type UploadResult = {
  url: string;
  filename: string;
  size: number;
  content_type: string;
  public_id?: string;
  raw?: unknown;
};

import { api } from "@/lib/api";

/**
 * Upload file either to backend (DRF /documents/) or directly to Cloudinary (unsigned).
 */
export async function uploadFile(file: File, options?: UploadOptions): Promise<UploadResult> {
  const backend = options?.backend ?? true;

  if (backend) {
    return uploadToBackend(file, options);
  } else {
    return uploadToCloudinaryUnsigned(file, options);
  }
}

/**
 * Upload to backend documents endpoint. Uses XMLHttpRequest to allow progress callbacks.
 * Expects backend endpoint to be at `${api.defaults.baseURL}/documents/`.
 */
async function uploadToBackend(file: File, options?: UploadOptions): Promise<UploadResult> {
  const baseUrl =
    (api && (api.defaults as { baseURL?: string })?.baseURL) ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000/api";
  const url = `${String(baseUrl).replace(/\/$/, "")}/documents/`;

  const form = new FormData();
  form.append("file", file, file.name);

  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", url, true);

    // Authorization header from localStorage (AuthContext stores tokens there)
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && typeof options?.onProgress === "function") {
        const percent = Math.round((ev.loaded / ev.total) * 100);
        options!.onProgress(percent);
      }
    };

    xhr.onload = () => {
      const status = xhr.status;
      if (status >= 200 && status < 300) {
        try {
          const resp: Record<string, unknown> = JSON.parse(xhr.responseText);

          let urlFromResp =
            typeof resp?.file === "string"
              ? resp.file
              : (resp?.url as string) ??
                (resp?.file_url as string) ??
                (resp?.file && (resp.file as { url?: string }).url) ??
                "";

          try {
            const baseOrigin = (() => {
              try {
                return new URL(String(baseUrl)).origin;
              } catch {
                return String(baseUrl).replace(/\/api\/?$/, "");
              }
            })();

            if (urlFromResp && /^https?:\/\//i.test(urlFromResp)) {
              urlFromResp = urlFromResp;
            } else if (urlFromResp && urlFromResp.startsWith("/")) {
              urlFromResp = `${baseOrigin}${urlFromResp}`;
            } else if (urlFromResp && !urlFromResp.startsWith("http")) {
              urlFromResp = `${baseOrigin}/${urlFromResp}`;
            }
          } catch {
          }

          const filename = (resp?.filename as string) ?? file.name;
          const size = typeof resp?.size === "number" ? (resp.size as number) : file.size;
          const content_type = (resp?.content_type as string) ?? file.type;

          resolve({
            url: String(urlFromResp),
            filename: String(filename),
            size,
            content_type: String(content_type ?? ""),
            raw: resp,
          });
        } catch {
          resolve({
            url: "",
            filename: file.name,
            size: file.size,
            content_type: file.type,
            raw: xhr.responseText,
          });
        }
      } else {
        let message = `Upload failed with status ${status}`;
        try {
          const parsed = JSON.parse(xhr.responseText);
          message = (parsed as { detail?: string; error?: string }).detail ?? (parsed as { error?: string }).error ?? JSON.stringify(parsed);
        } catch {
        }
        reject(new Error(message));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during file upload"));
    };

    xhr.send(form);
  });
}

/**
 * Direct unsigned Cloudinary upload using fetch.
 * Requires environment variables:
 * - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 * - NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 *
 * Note: unsigned uploads use an upload preset created in Cloudinary with 'unsigned' enabled.
 */
async function uploadToCloudinaryUnsigned(file: File, options?: UploadOptions): Promise<UploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const folder = options?.folder;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Missing Cloudinary env vars: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET must be set for direct uploads."
    );
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);
  if (folder) form.append("folder", folder);

  const res = await fetch(url, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${res.status} ${res.statusText} - ${text}`);
  }

  const json: {
    secure_url?: string;
    url?: string;
    original_filename?: string;
    bytes?: number;
    format?: string;
    resource_type?: string;
    public_id?: string;
  } = await res.json();

  return {
    url: json.secure_url ?? json.url ?? "",
    filename: json.original_filename ?? file.name,
    size: typeof json.bytes === "number" ? json.bytes : file.size,
    content_type: json.format ? `${json.resource_type}/${json.format}` : file.type,
    public_id: json.public_id,
    raw: json,
  };
}
