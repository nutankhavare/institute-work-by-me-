// Entry point — registers all Azure Functions (v4 programmatic model)
// Each file handles multiple HTTP methods on the same route to avoid conflicts

// auth
import "./auth/login";
import "./auth/refresh";

// Utilities
import "./permissions/index";
import "./masters/index";

// Dashboard
import "./dashboard/stats";

// Organization
import "./organization/me";

// Employees
import "./employees/index";
import "./employees/byId";

// Roles
import "./roles/index";
import "./roles/byId";

// Vehicles
import "./vehicles/trackSingle"; 
import "./vehicles/live";
import "./vehicles/index";
import "./vehicles/byId";

// Devices
import "./devices/index";
import "./devices/instgps";
import "./devices/instbeacon";

// Drivers
import "./drivers/dropdowns";    // /active-vehicles/for/dropdown etc — before drivers/{id}
import "./drivers/index";
import "./drivers/byId";

// Travellers
import "./travellers/byId";      // registers BOTH travellers/update/{id} AND travellers/{id}
import "./travellers/index";

// Bookings
import "./bookings/index";
import "./bookings/byId";

// Compliance
import "./compliance/index";
import "./compliance/byId";

// Broadcasts (Bulk Communication)
import "./broadcasts/stats";
import "./broadcasts/index";
import "./broadcasts/byId";
