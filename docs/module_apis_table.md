# Module-Specific API Usage (Frontend)

Below is a detailed table categorizing the exact API endpoints consumed by your frontend application for the specific modules requested: **Drivers, Vehicles, Staff, Compliance, and Roles**.

| Module | Request Method | API Endpoint (via `tenantApi`) | Purpose / Action |
| :--- | :---: | :--- | :--- |
| **Drivers** | `GET` | `/drivers` | Fetch paginated list of all drivers for the Index page |
| **Drivers** | `GET` | `/drivers/:id` | Fetch specific details for a single driver (Show/Edit pages) |
| **Drivers** | `POST` | `/drivers` | Create a new driver profile and upload associated documents |
| **Drivers** | `PUT` | `/drivers/:id` | Update existing driver profile information |
| **Drivers** | `DELETE` | `/drivers/:id` | Delete a driver record |
| | | | |
| **Vehicles** | `GET` | `/vehicles` | Fetch list of all vehicles |
| **Vehicles** | `GET` | `/vehicles/:id` | Fetch a single vehicle's details and metadata |
| **Vehicles** | `POST` | `/vehicles` | Register a new vehicle into the fleet |
| **Vehicles** | `PUT` | `/vehicles/:id` | Update vehicle parameters and assignments |
| **Vehicles** | `DELETE` | `/vehicles/:id` | Remove a vehicle from the active fleet |
| **Vehicles** | `GET` | `/vehicles/track/:vehicleNumber/live/location/:tenantId` | Pull real-time GPS coordinates to track a selected vehicle |
| **Vehicles** | `GET` | `/vehicles/live/location/:tenantId` | Dashboard batch map-refresh of all active vehicle coordinates |
| **Vehicles** | `GET` | `/gps-device/for/dropdown` | Retrieve available/unassigned GPS tracker modules during vehicle creation |
| | | | |
| **Staff (Employees)** | `GET` | `/employees` | Fetch paginated staff listing |
| **Staff (Employees)** | `GET` | `/employees/:id` | Fetch specific staff member details |
| **Staff (Employees)** | `POST` | `/employees` | Register a new employee profile |
| **Staff (Employees)** | `PUT` | `/employees/:id` | Modify an existing employee record |
| **Staff (Employees)** | `DELETE` | `/employees/:id` | Delete an employee |
| | | | |
| **Compliance** | `GET` | `/compliance` | Fetch the list of compliance records/logs |
| **Compliance** | `GET` | `/compliance/:id` | Fetch granular details of a specific compliance item |
| **Compliance** | `POST` | `/compliance` | Upload a new compliance record (e.g., insurance, emissions) |
| **Compliance** | `PUT` | `/compliance/:id` | Update details or renew an existing compliance record |
| **Compliance** | `DELETE` | `/compliance/:id` | Delete a compliance document entry |
| | | | |
| **Roles** | `GET` | `/roles` | Fetch list of user access roles |
| **Roles** | `GET` | `/roles/:id` | Fetch specific capabilities defined for a role |
| **Roles** | `POST` | `/roles` | Create a custom role definition |
| **Roles** | `PUT` | `/roles/:id` | Modify an existing role's permissions |
| **Roles** | `DELETE` | `/roles/:id` | Delete an unused role entirely |
| **Roles** | `GET` | `/permissions` | Fetch the master list of all assignable system permissions |
