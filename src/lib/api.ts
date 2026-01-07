import type {
  LoginRequest,
  LoginResponse,
  InventoryItemWithQuantity,
  AddInventoryRequest,
  UpdateInventoryRequest,
  DeleteInventoryRequest,
  ScanRequest,
  ScanResponse,
  ApiResponse,
} from "@/types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const API_KEY = import.meta.env.VITE_API_KEY || "";

async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "An error occurred");
  }

  return data;
}

// Auth API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return fetchWithAuth<LoginResponse>("/users/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },
};

// Inventory API
export const inventoryApi = {
  getAll: async (): Promise<ApiResponse<InventoryItemWithQuantity[]>> => {
    return fetchWithAuth<ApiResponse<InventoryItemWithQuantity[]>>("/inventory/");
  },

  add: async (item: AddInventoryRequest): Promise<ApiResponse<InventoryItemWithQuantity>> => {
    return fetchWithAuth<ApiResponse<InventoryItemWithQuantity>>("/inventory/add", {
      method: "POST",
      body: JSON.stringify(item),
    });
  },

  update: async (item: UpdateInventoryRequest): Promise<ApiResponse<InventoryItemWithQuantity>> => {
    return fetchWithAuth<ApiResponse<InventoryItemWithQuantity>>("/inventory/update", {
      method: "PUT",
      body: JSON.stringify(item),
    });
  },

  delete: async (data: DeleteInventoryRequest): Promise<ApiResponse<null>> => {
    return fetchWithAuth<ApiResponse<null>>("/inventory/delete", {
      method: "DELETE",
      body: JSON.stringify(data),
    });
  },

  scanIn: async (data: ScanRequest): Promise<ScanResponse> => {
    return fetchWithAuth<ScanResponse>("/inventory/scan/scan-in", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  scanOut: async (data: ScanRequest): Promise<ScanResponse> => {
    return fetchWithAuth<ScanResponse>("/inventory/scan/scan-out", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
