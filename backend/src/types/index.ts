// User & Auth Types
export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  org_id: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  org_id: string;
  roles?: string[];
  permissions?: string[];
  tenant_id?: string;
}

// Roles & Permissions Types
export interface Permission {
  id: number;
  name: string;
}

export interface Role {
  id: number;
  org_id: string;
  name: string;
  department?: string | null;
  access_level?: string | null;
  status?: string | null;
  created_by?: string | null;
  description?: string | null;
  permissions?: (number | string | Permission)[] | null;
  permissions_count?: number;
  assigned_users?: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface RoleCreateInput {
  name: string;
  department?: string;
  access_level?: string;
  status?: string;
  created_by?: string;
  description?: string;
  permissions?: number[];
}

export interface RoleUpdateInput {
  name?: string;
  department?: string;
  access_level?: string;
  status?: string;
  created_by?: string;
  description?: string;
  permissions?: number[];
}

// Employee/Staff Types
export interface Employee {
  id: number;
  org_id: string;
  employee_id?: string | null;
  photo?: string | null;
  employment_type?: string | null;
  designation?: string | null;
  joining_date?: string | null;
  first_name: string;
  last_name: string;
  gender?: string | null;
  marital_status?: string | null;
  date_of_birth?: string | null;
  email?: string | null;
  phone: string;
  dependants?: Record<string, unknown>[] | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  landmark?: string | null;
  state?: string | null;
  district?: string | null;
  city?: string | null;
  pin_code?: string | null;
  primary_person_name?: string | null;
  primary_person_email?: string | null;
  primary_person_phone_1?: string | null;
  primary_person_phone_2?: string | null;
  secondary_person_name?: string | null;
  secondary_person_email?: string | null;
  secondary_person_phone_1?: string | null;
  secondary_person_phone_2?: string | null;
  account_holder_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  bank_name?: string | null;
  aadhaar_card?: string | null;
  pan_card?: string | null;
  bank_proof?: string | null;
  status?: string | null;
  remarks?: string | null;
  roles?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Vehicle Types
export interface Vehicle {
  id: number;
  org_id: string;
  vehicle_name?: string | null;
  vehicle_number: string;
  model?: string | null;
  make?: string | null;
  capacity?: number | null;
  status: string;
  gps_device_id?: string | null;
  battery?: number | null;
  lat?: number | null;
  lng?: number | null;
  speed?: number | null;
  lastGpsUpdate?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Driver Types
export interface Driver {
  id: number;
  org_id: string;
  first_name: string;
  last_name: string;
  gender?: string | null;
  date_of_birth?: string | null;
  email?: string | null;
  mobile_number: string;
  blood_group?: string | null;
  marital_status?: string | null;
  employment_type?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// GPS Device Types
export interface GpsDevice {
  id: number;
  org_id: string;
  sequence_number: string;
  serial_number: string;
  device_id: string;
  manufacture_date: string;
  imei_number: string;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
}

// Beacon Device Types
export interface BeaconDevice {
  id: number;
  org_id: string;
  sequence_number: string;
  serial_number: string;
  device_id: string;
  manufacture_date: string;
  imei_number: string;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Request context with user info
export interface RequestContext {
  user: AuthUser;
  orgId: string;
}
