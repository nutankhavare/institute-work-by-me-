# Azure Functions Deployment List for `institute-fn-app`

Based on the Node.js v4 programming model we just implemented, the following functions are registered via `app.http()` and will be exposed by your Azure Function App (`institute-fn-app`) when you deploy the code. 

Because we use the **Azure Functions v4 Node.js model**, you do not need to create these manually in the Azure Portal. When you deploy the code (via VS Code, GitHub Actions, or CLI), Azure will automatically detect `functions/index.ts` and register the following 23 function endpoints:

### 1. Dashboard & Organization
| Function Name | HTTP Methods | Route | Description |
| :--- | :--- | :--- | :--- |
| `dashboardStats` | GET | `dashboard/stats` | Gets aggregate counts (employees, drivers). |
| `organizationMe` | GET, PUT | `organization/me` | Fetch or update (with docs) the institute's profile. |

### 2. Authentication & Roles
| Function Name | HTTP Methods | Route | Description |
| :--- | :--- | :--- | :--- |
| `permissionsIndex` | GET | `permissions` | Lists all available system permissions. |
| `rolesIndex` | GET, POST | `roles` | List all roles or create a new role. |
| `rolesById` | GET, PUT, DELETE | `roles/{id}` | Manage a specific role by ID. |

### 3. Staff & Employees
| Function Name | HTTP Methods | Route | Description |
| :--- | :--- | :--- | :--- |
| `employeesIndex` | GET, POST | `employees` | List employees or create one (w/ profile photo). |
| `employeesById` | GET, PUT, DELETE | `employees/{id}` | Manage a specific employee by ID. |

### 4. Vehicles & Telemetry
| Function Name | HTTP Methods | Route | Description |
| :--- | :--- | :--- | :--- |
| `vehiclesIndex` | GET, POST | `vehicles` | List vehicles or create one (w/ 4 document uploads). |
| `vehiclesById` | GET, PUT, DELETE | `vehicles/{id}` | Manage a specific vehicle by ID. |
| `vehiclesLive` | GET | `vehicles/live/location/{tenantId}` | Get live tracking data for all active vehicles. |
| `vehiclesTrackSingle` | GET | `vehicles/track/{vehicleNumber}/live/location/{tenantId}` | Get live tracking data for a single vehicle. |

### 5. Drivers
| Function Name | HTTP Methods | Route | Description |
| :--- | :--- | :--- | :--- |
| `driversIndex` | GET, POST | `drivers` | List drivers or create (creates license record too). |
| `driversById` | GET, POST, DELETE | `drivers/{id}` | Manage a specific driver by ID (NOTE: uses POST for update). |

### 6. Dropdowns (Optimized Lookups)
| Function Name | HTTP Methods | Route | Description |
| :--- | :--- | :--- | :--- |
| `activeVehiclesDropdown` | GET | `active-vehicles/for/dropdown` | Lightweight list of active vehicles. |
| `beaconDeviceDropdown` | GET | `beacon-device/for/dropdown` | Lightweight list of active BLE devices. |
| `gpsDeviceDropdown` | GET | `gps-device/for/dropdown` | Lightweight list of active GPS devices. |

### 7. Travellers & Bookings
| Function Name | HTTP Methods | Route | Description |
| :--- | :--- | :--- | :--- |
| `travellersIndex` | GET, POST | `travellers` | List travellers or create one. |
| `travellersById` | GET, DELETE | `travellers/{id}` | Get or delete a traveller. |
| `travellersUpdate` | POST | `travellers/update/{id}` | Legacy Laravel route to update a traveller. |
| `bookingsIndex` | GET, POST | `bookings` | List bookings or create one. |
| `bookingsById` | GET, PUT | `bookings/{id}` | Manage a specific booking by ID. |

### 8. Compliance & Documents
| Function Name | HTTP Methods | Route | Description |
| :--- | :--- | :--- | :--- |
| `complianceIndex` | GET, POST | `compliance` | List compliance records or upload a new document. |
| `complianceById` | DELETE | `compliance/{id}` | Delete a compliance record. |
| `broadcastsStats` | GET | `broadcasts/stats` | Get aggregate communication analytics. |
| `broadcastsIndex` | GET, POST | `broadcasts` | List history or send a new broadcast. |
| `broadcastsById` | GET, DELETE | `broadcasts/{id}` | View details/recipients or delete a log. |

---

## Notes on Deployment to `institute-fn-app`
Since you are using **Node.js 20** with the **v4 programming model**, ensure that your Azure Function App has the following Application Settings (Environment Variables) configured under *Settings > Environment variables*:

1. `AzureWebJobsFeatureFlags` = `EnableWorkerIndexing` (Crucial for Node.js v4)
2. `FUNCTIONS_WORKER_RUNTIME` = `node`
3. `WEBSITE_NODE_DEFAULT_VERSION` = `~20`
4. `PG_HOST`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE`, `PG_PORT` (Database credentials)
5. `JWT_SECRET` and `JWT_EXPIRES_IN` (Authentication)
6. `AZURE_STORAGE_CONNECTION_STRING` and `AZURE_STORAGE_CONTAINER_NAME` (For file uploads)
