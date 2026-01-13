// User types
export interface User {
  user_id: number;
  username: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  status: number;
  success: boolean;
  message: string;
  data?: { user_id: number };
}

// Inventory types
export interface InventoryItem {
  inventory_id: number;
  material_code: number;
  item: string;
  type: string;
  unit?: string;
}

export interface InventoryItemWithQuantity extends InventoryItem {
  item_in?: number;
  item_out?: number;
  item_quantity?: number;
}

export interface AddInventoryRequest {
  material_code: number;
  item: string;
  type: string;
  unit?: string;
}

export interface UpdateInventoryRequest {
  inventory_id: number;
  material_code?: number;
  item?: string;
  type?: string;
  unit?: string;
}

export interface DeleteInventoryRequest {
  inventory_id: number;
}

// Scan types
export interface ScanRequest {
  inventory_id: number;
  amount: number;
}

export interface ScanResponse {
  status: number;
  success: boolean;
  log_id?: number;
  message: string;
}

// Log types
export interface Log {
  log_id: number;
  inventory_id: number;
  is_item_in?: boolean;
  is_item_out?: boolean;
  amount: number;
  create_time?: string;
}

export interface GetLogRequest {
  inventory_id: number;
}

// API Response types
export interface ApiResponse<T> {
  status: number;
  data?: T;
  error?: string;
  details?: string;
  success?: boolean;
  message?: string;
}
