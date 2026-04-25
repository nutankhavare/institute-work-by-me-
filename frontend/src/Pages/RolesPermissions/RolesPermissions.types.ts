export interface Role {
  id: number | string;
  roleName: string;
  department: string;
  accessLevel: "Root Access" | "Full Access" | "Partial Access" | "Read Only";
  description?: string;
  permissions: string[]; // Names for display
  assignedUsers: number;
  lastModified: string;
  status: "Active" | "Inactive";
  createdBy: string;
}

export interface Permission {
  id: number;
  name: string;
}
