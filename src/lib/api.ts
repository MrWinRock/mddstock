import axios, { type AxiosRequestConfig } from "axios";
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

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  },
});

async function fetchWithAuth<T>(
  endpoint: string,
  options: AxiosRequestConfig = {}
): Promise<T> {
  try {
    const response = await apiClient.request<T>({
      url: endpoint,
      ...options,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data?.message || error.response.data?.error || "An error occurred");
    }
    throw error;
  }
}

// Auth API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return fetchWithAuth<LoginResponse>("/users/login", {
      method: "POST",
      data: credentials,
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
      data: item,
    });
  },

  update: async (item: UpdateInventoryRequest): Promise<ApiResponse<InventoryItemWithQuantity>> => {
    return fetchWithAuth<ApiResponse<InventoryItemWithQuantity>>("/inventory/update", {
      method: "PUT",
      data: item,
    });
  },

  delete: async (data: DeleteInventoryRequest): Promise<ApiResponse<null>> => {
    return fetchWithAuth<ApiResponse<null>>("/inventory/delete", {
      method: "DELETE",
      data: data,
    });
  },

  scanIn: async (data: ScanRequest): Promise<ScanResponse> => {
    return fetchWithAuth<ScanResponse>("/inventory/scan/scan-in", {
      method: "POST",
      data: data,
    });
  },

  scanOut: async (data: ScanRequest): Promise<ScanResponse> => {
    return fetchWithAuth<ScanResponse>("/inventory/scan/scan-out", {
      method: "POST",
      data: data,
    });
  },
};
