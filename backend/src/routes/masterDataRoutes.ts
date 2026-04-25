import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

/**
 * Master Data Routes - States, Districts, etc.
 */

const stateDistrictSeed = [
  { id: 1, state: "Tamil Nadu", district: "Chennai", city: "Chennai", pincode: "600001" },
  { id: 2, state: "Tamil Nadu", district: "Coimbatore", city: "Coimbatore", pincode: "641001" },
  { id: 3, state: "Karnataka", district: "Bengaluru Urban", city: "Bengaluru", pincode: "560001" },
  { id: 4, state: "Telangana", district: "Hyderabad", city: "Hyderabad", pincode: "500001" },
  { id: 5, state: "Maharashtra", district: "Pune", city: "Pune", pincode: "411001" },
];

const dropdownValues: Record<string, string[]> = {
  "vehicle:vehicle_type": ["Bus", "Van", "Car", "Mini Bus"],
  "vehicle:fuel_type": ["Diesel", "Petrol", "CNG", "Electric"],
  "vehicle:permit_type": ["School", "Private", "Tourist", "State"],
  "vehicle:ownership_type": ["Owned", "Contract"],
  "common:gender": ["Male", "Female", "Other"],
  "common:blood_group": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "common:marital_status": ["Single", "Married", "Divorced", "Widowed"],
  "common:employment_type": ["Permanent", "Contract", "Part Time"],
  "common:status": ["active", "inactive", "maintenance"],
  "driver:file_type": [
    "driving_license",
    "aadhaar_card",
    "pan_card",
    "police_verification",
    "medical_fitness",
    "training_certificate",
  ],
};

/**
 * @GET /masters/forms/dropdowns/fields
 * Get dropdown values for forms
 */
router.get("/masters/forms/dropdowns/fields", (req: Request, res: Response) => {
  const type = String(req.query.type || "").toLowerCase();
  const field = String(req.query.field || "").toLowerCase();
  const key = `${type}:${field}`;
  const values = dropdownValues[key] || [];

  res.json(
    values.map((value, index) => ({
      id: index + 1,
      type,
      field,
      value,
    }))
  );
});

/**
 * @GET /masters/forms/dropdowns/states
 * Get all states
 */
router.get("/masters/forms/dropdowns/states", (_req: Request, res: Response) => {
  res.json(stateDistrictSeed);
});

/**
 * @GET /masters/forms/dropdowns/districts/:state
 * Get districts for a state
 */
router.get("/masters/forms/dropdowns/districts/:state", (req: Request, res: Response) => {
  const state = String(req.params.state || "").toLowerCase();
  const districts = stateDistrictSeed.filter((item) => item.state.toLowerCase() === state);

  res.json(districts);
});

/**
 * @GET /stats/summary
 * Get dashboard statistics
 */
router.get("/stats/summary", authMiddleware, (req: Request, res: Response) => {
  // Return stub data - to be implemented with actual DB queries
  res.json({
    success: true,
    data: {
      totalVehicles: 0,
      activeVehicles: 0,
      totalStaff: 0,
      activeTrips: 0,
    },
  });
});

export default router;
