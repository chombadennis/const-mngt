import axios from "axios";

// --- Axios Instance --- //
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Automatically attach token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// -----------------------------
// --- Automatic refresh flow ---
// -----------------------------
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

// 🔹 Exported helper so AuthContext can use it for proactive refresh
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const resp = await axios.post<{ access: string; refresh?: string }>(
      `${API_BASE_URL}/auth/token/refresh/`,
      { refresh: refreshToken }
    );

    const newAccess = resp.data.access;
    const newRefresh = resp.data.refresh;

    localStorage.setItem("accessToken", newAccess);
    if (newRefresh) localStorage.setItem("refreshToken", newRefresh);

    return newAccess;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: any) => {
    const originalRequest = error?.config;

    if (!error || !error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const isTokenEndpoint =
      originalRequest?.url?.includes("/auth/token/") ||
      originalRequest?.url?.includes("/auth/token/refresh/");

    if (status === 401 && originalRequest && !originalRequest._retry && !isTokenEndpoint) {
      (originalRequest as any)._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (!originalRequest.headers) originalRequest.headers = {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const newAccess = await refreshAccessToken();
        if (!newAccess) throw new Error("Failed to refresh token");

        onRefreshed(newAccess);

        if (!originalRequest.headers) originalRequest.headers = {};
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// -----------------------------
// --- Auth: Login / Register ---
// -----------------------------

export interface LoginData {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string; // access token (kept for compatibility)
  refresh?: string; // refresh token (optional on return)
}

// --- Auth: Login --- //
export const loginUser = async (
  data: LoginData
): Promise<LoginResponse> => {
  interface SimpleJWTResponse {
    access: string;
    refresh: string;
  }

  const res = await api.post<SimpleJWTResponse>("/auth/token/", {
    username: data.username,
    password: data.password,
  });

  // Persist refresh token (so AuthContext or interceptors can use it)
  if (res.data?.refresh) {
    try {
      localStorage.setItem("refreshToken", res.data.refresh);
    } catch (err) {
      // best-effort; don't block login if storage fails
      console.warn("Failed to save refresh token to localStorage", err);
    }
  }

  return { token: res.data.access, refresh: res.data.refresh };
};


export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
}

export interface RegisterResponse {
  token: string;
}

export const registerUser = async (data: RegisterData): Promise<RegisterResponse> => {
  const res = await api.post("/auth/register/", data);
  return res.data as RegisterResponse;
};


// -----------------------------
// --- Materials ---
// -----------------------------

export interface Material {
  id: number;
  company: number;
  sku: string;
  name: string;
  description: string;
  unit: string;
  created_at: string;
}

// List all materials
export const getMaterials = async (): Promise<Material[]> => {
  const res = await api.get("/materials/");
  return res.data as Material[];
};

// Get single material
export const getMaterialById = async (id: number): Promise<Material> => {
  const res = await api.get(`/materials/${id}/`);
  return res.data as Material;
};

// Create material
export const createMaterial = async (material: Omit<Material, "id" | "created_at" | "company">): Promise<Material> => {
  const res = await api.post("/materials/", material);
  return res.data as Material;
};

// Update material
export const updateMaterial = async (id: number, material: Partial<Material>): Promise<Material> => {
  const res = await api.put(`/materials/${id}/`, material);
  return res.data as Material;
};

// Delete material
export const deleteMaterial = async (id: number): Promise<{ message: string }> => {
  const res = await api.delete(`/materials/${id}/`);
  return res.data as { message: string };
};


// -----------------------------
// --- Company Invite ---
// -----------------------------

export interface CompanyInviteData {
  email: string;
  role: string;
}

export interface CompanyInviteResponse {
  message: string;
}

export const inviteCompanyUser = async (
  data: CompanyInviteData
): Promise<CompanyInviteResponse> => {
  const res = await api.post("/company/invite/", data);
  return res.data as CompanyInviteResponse;
};


// lib/api.ts (Material Purchase Orders CRUD additions)

export interface PurchaseOrderLine {
  id?: number;
  purchase_order?: number;
  material: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total?: number;
  created_at?: string;
}

export interface PurchaseOrder {
  id?: number;
  company?: number;
  supplier: string;
  order_date: string;
  status: string;
  total?: number;
  lines?: PurchaseOrderLine[];
  created_at?: string;
}


// List all POs
export const getPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  const res = await api.get("/materials-po/");
  return res.data as PurchaseOrder[];
};

// Get single PO by ID
export const getPurchaseOrderById = async (id: string): Promise<PurchaseOrder> => {
  const res = await api.get(`/materials-po/${id}/`);
  return res.data as PurchaseOrder;
};

// Create new PO
export const createPurchaseOrder = async (po: PurchaseOrder): Promise<PurchaseOrder> => {
  const res = await api.post("/materials-po/", po);
  return res.data as PurchaseOrder;
};

// Update existing PO
export const updatePurchaseOrder = async (id: string, po: PurchaseOrder): Promise<PurchaseOrder> => {
  const res = await api.put(`/materials-po/${id}/`, po);
  return res.data as PurchaseOrder;
};

// Delete PO
export const deletePurchaseOrder = async (id: string): Promise<{ message: string }> => {
  const res = await api.delete(`/materials-po/${id}/`);
  return res.data as { message: string };
};


// lib/api.ts (Task CRUD additions)

export interface Task {
  id?: string;
  project_id: string;
  name: string;
  status: string; // e.g., 'Pending', 'In Progress', 'Completed'
}

// Create task
export const createTask = async (task: Task): Promise<Task> => {
  const res = await api.post(`/tasks/`, task);
  return res.data as Task;
};

// Update task
export const updateTask = async (id: string, task: Task): Promise<Task> => {
  const res = await api.put(`/tasks/${id}/`, task);
  return res.data as Task;
};

// Delete task
export const deleteTask = async (id: string): Promise<{ message: string }> => {
  const res = await api.delete(`/tasks/${id}/`);
  return res.data as { message: string };
};

// lib/api.ts (Invoice CRUD additions)

export interface Invoice {
  id: string;
  company?: string;
  project?: { id: string; name: string }; // matches serializer
  number: string;
  date: string;
  due_date: string;
  amount: number;
  status: string;
  created_at: string;
}

// Fetch all invoices
export const fetchInvoices = async (): Promise<Invoice[]> => {
  const res = await api.get("/invoices/");
  return res.data as Invoice[];
};

// Create invoice
export const createInvoice = async (invoice: Invoice): Promise<Invoice> => {
  const res = await api.post("/invoices/", invoice);
  return res.data as Invoice;
};

// Update invoice
export const updateInvoice = async (id: string, invoice: Invoice): Promise<Invoice> => {
  const res = await api.put(`/invoices/${id}/`, invoice);
  return res.data as Invoice;
};

// Delete invoice
export const deleteInvoice = async (id: string): Promise<{ message: string }> => {
  const res = await api.delete(`/invoices/${id}/`);
  return res.data as { message: string };
};

// Optional: send invoice (example endpoint)
export const sendInvoice = async (id: string): Promise<{ message: string }> => {
  const res = await api.post(`/invoices/${id}/send/`);
  return res.data as { message: string };
};


// lib/api.ts (Inspection CRUD additions)

export interface Inspection {
  id: string;
  project: string;           // project ID from backend
  project_name?: string;     // optional, set via backend annotation if needed
  inspector?: string;        // optional user ID or name
  notes: string;
  photo?: string;            // Django FileField
  photo_url?: string;        // optional: frontend can map photo -> photo_url
  date: string;
  created_at: string;
}

// Fetch all inspections

export interface Inspection {
  id: string;
  project: string;           // corresponds to backend project FK
  inspector?: string;
  notes: string;
  photo?: string;
  photo_url?: string;
  date: string;
  created_at: string;
}

// Fetch all inspections
export const fetchInspections = async (): Promise<Inspection[]> => {
  const res = await api.get<Inspection[]>("/inspections/");
  return res.data.map((i) => ({
    ...i,
    photo_url: i.photo ? `${API_BASE_URL}${i.photo}` : undefined,
  }));
};

// Fetch single inspection
export const fetchInspection = async (id: string): Promise<Inspection> => {
  const res = await api.get(`/inspections/${id}/`);
  return res.data as Inspection;
};

// Create inspection
export const createInspection = async (inspection: Omit<Inspection, "id" | "created_at">): Promise<Inspection> => {
  const res = await api.post("/inspections/", inspection);
  return res.data as Inspection;
};

// Update inspection
export const updateInspection = async (id: string, inspection: Omit<Inspection, "id" | "created_at">): Promise<Inspection> => {
  const res = await api.put(`/inspections/${id}/`, inspection);
  return res.data as Inspection;
};

// Delete inspection
export const deleteInspection = async (id: string): Promise<{ message: string }> => {
  const res = await api.delete(`/inspections/${id}/`);
  return res.data as { message: string };
};

// lib/api.ts (Equipment CRUD additions)

export interface Equipment {
  id?: string;
  company?: number;
  name: string;
  serial_number: string;
  purchase_date?: string;
  last_service_date?: string;
  created_at?: string;
}

// Fetch all equipment
export const fetchEquipment = async (): Promise<Equipment[]> => {
  const res = await api.get("/equipment/");
  return res.data as Equipment[];
};

// Fetch single equipment
export const fetchSingleEquipment = async (id: string): Promise<Equipment> => {
  const res = await api.get(`/equipment/${id}/`);
  return res.data as Equipment;
};

// Create equipment
export const createEquipment = async (equipment: Equipment): Promise<Equipment> => {
  const res = await api.post("/equipment/", equipment);
  return res.data as Equipment;
};

// Update equipment
export const updateEquipment = async (equipment: Equipment): Promise<Equipment> => {
  if (!equipment.id) {
    throw new Error("Equipment ID is required for update");
  }
  const res = await api.put(`/equipment/${equipment.id}/`, equipment);
  return res.data as Equipment;
};

// Delete equipment
export const deleteEquipment = async (id: string): Promise<{ message: string }> => {
  const res = await api.delete(`/equipment/${id}/`);
  return res.data as { message: string };
};

// Fetch single equipment
export const fetchEquipmentById = async (id: string): Promise<Equipment> => {
  const res = await api.get(`/equipment/${id}/`);
  return res.data as Equipment;
};





// lib/api.ts (Documents CRUD additions)

export interface Document {
  id: number;
  company: number;         // FK, backend gives an ID
  uploaded_by: number;     // FK, backend gives an ID
  file: string;            // URL to the uploaded file
  filename: string;        // server-extracted filename
  content_type: string;    // MIME type (e.g. "application/pdf")
  size: number;            // in bytes
  created_at: string;      // ISO timestamp
}

// Fetch all documents
export const fetchDocuments = async (): Promise<Document[]> => {
  const res = await api.get("/documents/");
  return res.data as Document[];
};

// Fetch single document
export const fetchSingleDocument = async (id: string): Promise<Document> => {
  const res = await api.get(`/documents/${id}/`);
  return res.data as Document;
};

// Create/upload document
export const createDocument = async (formData: FormData): Promise<Document> => {
  const res = await api.post("/documents/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data as Document;
};

// Update document metadata (name, project_id)
export const updateDocument = async (id: string, data: Partial<Document>): Promise<Document> => {
  const res = await api.put(`/documents/${id}/`, data);
  return res.data as Document;
};

// Delete document
export const deleteDocument = async (id: number): Promise<{ message: string }> => {
  const res = await api.delete(`/documents/${id}/`);
  return res.data as { message: string };
};

export interface Project {
  id: string;
  company: string;
  name: string;
  code: string;
  description?: string;
  status: "planning" | "active" | "paused" | "completed";
  start_date?: string;
  end_date?: string;
  created_at: string;
}

// Fetch all projects
export const fetchProjects = async (): Promise<Project[]> => {
  const res = await api.get("/projects/");
  return res.data as Project[];
};

// Fetch single project by ID
export const fetchProjectById = async (id: string): Promise<Project> => {
  const res = await api.get(`/projects/${id}/`);
  return res.data as Project;
};

// Create a new project
export const createProject = async (project: Omit<Project, "id" | "created_at" | "company">): Promise<Project> => {
  const res = await api.post("/projects/", project);
  return res.data as Project;
};

// Update an existing project
export const updateProject = async (id: string, project: Partial<Omit<Project, "id" | "company" | "created_at">>): Promise<Project> => {
  const res = await api.put(`/projects/${id}/`, project);
  return res.data as Project;
};

// Delete a project
export const deleteProject = async (id: string): Promise<{ message: string }> => {
  const res = await api.delete(`/projects/${id}/`);
  return res.data as { message: string };
};

// Timesheet interface
export interface Timesheet {
  id: string;
  worker: string;        // worker id from backend
  task?: string | null;  // task id or null
  date: string;
  hours: number;
  notes?: string;
  created_at: string;
}


// Fetch all timesheets
export const fetchTimesheets = async (): Promise<Timesheet[]> => {
  const res = await api.get("/timesheets/");
  return res.data as Timesheet[];
};

// Fetch single timesheet
export const fetchTimesheetById = async (id: string): Promise<Timesheet> => {
  const res = await api.get(`/timesheets/${id}/`);
  return res.data as Timesheet;
};

// Create a timesheet
export const createTimesheet = async (
  timesheet: Omit<Timesheet, "id" | "created_at">
): Promise<Timesheet> => {
  const res = await api.post("/timesheets/", timesheet);
  return res.data as Timesheet;
};

// Update a timesheet
export const updateTimesheet = async (
  id: string,
  timesheet: Partial<Omit<Timesheet, "id" | "created_at">>
): Promise<Timesheet> => {
  const res = await api.put(`/timesheets/${id}/`, timesheet);
  return res.data as Timesheet;
};

// Delete a timesheet
export const deleteTimesheet = async (id: string): Promise<{ message: string }> => {
  const res = await api.delete(`/timesheets/${id}/`);
  return res.data as { message: string };
};
