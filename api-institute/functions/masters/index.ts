import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ok, preflight } from "../../shared/response";

/* ─── Static Reference Data ─── */

// Format: [{id, type, field, value}] to match the FormDropdown interface
const makeDropdown = (type: string, field: string, values: string[]) =>
  values.map((v, i) => ({ id: i + 1, type, field, value: v }));

const DROPDOWNS: Record<string, Record<string, string[]>> = {
  common: {
    gender: ["Male", "Female", "Other"],
    blood_group: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    marital_status: ["Single", "Married", "Divorced", "Widowed"],
    employment_type: ["Full-Time", "Part-Time", "Contract", "Freelance"],
    status: ["Active", "Inactive", "On Hold", "Suspended"],
    relationship: ["Self", "Spouse", "Child", "Parent", "Sibling", "Guardian", "Other"],
  },
  vehicle: {
    vehicle_type: ["Bus", "Mini Bus", "Van", "Car", "Tempo Traveller", "SUV", "Auto"],
    fuel_type: ["Diesel", "Petrol", "CNG", "Electric", "Hybrid"],
    permit_type: ["State Permit", "National Permit", "Tourist Permit", "Contract Carriage", "Stage Carriage"],
    ownership_type: ["Owned", "Leased", "Rented", "Vendor"],
  },
  driver: {
    file_type: ["Driving License", "Badge", "Insurance", "Permit", "PUC"],
  },
};

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh",
  "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep"
];

const DISTRICTS: Record<string, string[]> = {
  "Karnataka": ["Bangalore Urban", "Bangalore Rural", "Mysore", "Hubli-Dharwad", "Mangalore", "Belgaum", "Bellary", "Gulbarga", "Shimoga", "Tumkur", "Raichur", "Bijapur", "Mandya", "Hassan", "Kolar", "Udupi", "Davangere", "Chitradurga", "Chikmagalur", "Kodagu"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Sangli", "Satara", "Ratnagiri", "Sindhudurg", "Jalgaon", "Dhule", "Nandurbar", "Ahmednagar"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Dindigul"],
  "Telangana": ["Hyderabad", "Rangareddy", "Medchal-Malkajgiri", "Sangareddy", "Warangal Urban", "Karimnagar", "Nizamabad", "Khammam", "Nalgonda", "Mahabubnagar"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur", "Alappuzha", "Palakkad", "Malappuram", "Kottayam"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Kutch", "Anand"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Bhilwara", "Alwar", "Sikar", "Pali"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Allahabad", "Meerut", "Bareilly", "Ghaziabad", "Noida", "Aligarh"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa"],
  "West Bengal": ["Kolkata", "Howrah", "North 24 Parganas", "South 24 Parganas", "Hooghly", "Nadia", "Bardhaman", "Murshidabad", "Jalpaiguri", "Darjeeling"],
  "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga", "Purnia", "Ara", "Begusarai", "Katihar", "Munger"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur", "Moga", "Firozpur"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula"],
  "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
  "Goa": ["North Goa", "South Goa"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kakinada", "Kadapa", "Anantapur"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Jagdalpur", "Ambikapur", "Raigarh", "Dhamtari"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Deoghar", "Giridih", "Ramgarh", "Dumka", "Chaibasa"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Baripada", "Bhadrak", "Jharsuguda"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Dhubri", "North Lakhimpur"],
};

/* ─── Endpoints ─── */

// GET /masters/forms/dropdowns/fields?type=common&field=gender
app.http("mastersFields", {
  methods: ["GET", "OPTIONS"],
  route: "masters/forms/dropdowns/fields",
  authLevel: "anonymous",
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();
    const type = req.query.get("type") || "common";
    const field = req.query.get("field") || "";

    const typeData = DROPDOWNS[type];
    if (!typeData || !typeData[field]) {
      // Return empty array instead of error so forms don't crash
      return { status: 200, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }, body: JSON.stringify([]) };
    }
    const result = makeDropdown(type, field, typeData[field]);
    return { status: 200, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }, body: JSON.stringify(result) };
  }
});

// GET /masters/forms/dropdowns/states
app.http("mastersStates", {
  methods: ["GET", "OPTIONS"],
  route: "masters/forms/dropdowns/states",
  authLevel: "anonymous",
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();
    const result = STATES.map((s, i) => ({ id: i + 1, state: s, district: "", city: "", pincode: "" }));
    return { status: 200, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }, body: JSON.stringify(result) };
  }
});

// GET /masters/forms/dropdowns/districts/{state}
app.http("mastersDistricts", {
  methods: ["GET", "OPTIONS"],
  route: "masters/forms/dropdowns/districts/{state}",
  authLevel: "anonymous",
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();
    const state = decodeURIComponent(req.params.state || "");
    const dists = DISTRICTS[state] || [];
    const result = dists.map((d, i) => ({ id: i + 1, state, district: d, city: "", pincode: "" }));
    return { status: 200, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }, body: JSON.stringify(result) };
  }
});
