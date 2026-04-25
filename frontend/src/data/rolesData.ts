export type Role = {
    id: string;
    roleName: string;
    department: string;
    accessLevel: "Root Access" | "Full Access" | "Partial Access" | "Read Only";
    description: string;
    permissions: string[];
    assignedUsers: number;
    lastModified: string;
    status: "Active" | "Inactive";
    createdBy: string;
};

export const INITIAL_ROLES: Role[] = [
    {
        id: "ROLE-001",
        roleName: "SUPER-ADMIN",
        department: "Core Administration",
        accessLevel: "Root Access",
        description: "Complete system access with authority to manage all modules and organization settings.",
        permissions: ["View Dashboard", "Manage Roles", "Full Staff Control", "Financial Access"],
        assignedUsers: 2,
        lastModified: "Mar 12, 2026",
        status: "Active",
        createdBy: "System",
    },
    {
        id: "ROLE-002",
        roleName: "FLEET-MANAGER",
        department: "Fleet Operations",
        accessLevel: "Full Access",
        description: "Responsible for vehicle maintenance, driver assignments, and session scheduling.",
        permissions: ["View Vehicles", "Edit Vehicles", "Manage Drivers", "Schedule Sessions"],
        assignedUsers: 5,
        lastModified: "Mar 15, 2026",
        status: "Active",
        createdBy: "Admin User",
    },
    {
        id: "ROLE-003",
        roleName: "FRONT-DESK",
        department: "Reception & Support",
        accessLevel: "Partial Access",
        description: "Handles trainee inquiries, registrations, and basic attendance tracking.",
        permissions: ["View Trainees", "Add Trainees", "View Sessions", "Process Inquiries"],
        assignedUsers: 8,
        lastModified: "Mar 18, 2026",
        status: "Active",
        createdBy: "Admin User",
    }
];

export const roleStatusVariant = (status: string) => {
    switch (status) {
        case "Active": return "green";
        case "Inactive": return "red";
        default: return "gray";
    }
};

export const accessLevelMeta: Record<string, { bg: string; color: string }> = {
    "Root Access": { bg: "#FEE2E2", color: "#DC2626" },
    "Full Access": { bg: "#EDE9FE", color: "#7C3AED" },
    "Partial Access": { bg: "#DBEAFE", color: "#2563EB" },
    "Read Only": { bg: "#FEF3C7", color: "#D97706" },
};

export const getAvatarColor = (index: number) => {
    const colors = [
        { bg: "#EDE9FE", cl: "#7C3AED" },
        { bg: "#DBEAFE", cl: "#2563EB" },
        { bg: "#DCFCE7", cl: "#059669" },
        { bg: "#FEF3C7", cl: "#D97706" },
        { bg: "#FEE2E2", cl: "#DC2626" },
        { bg: "#F3F4F6", cl: "#374151" },
    ];
    return colors[index % colors.length];
};
