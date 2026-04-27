import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ok, preflight } from "../../shared/response";

const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const districts: Record<string, string[]> = {
  "Karnataka": ["Bangalore Urban", "Bangalore Rural", "Mysore", "Hubli-Dharwad", "Mangalore"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"],
  // Add more as needed
};

app.http("mastersStates", {
  methods: ["GET", "OPTIONS"],
  route: "masters/forms/dropdowns/states",
  authLevel: "anonymous",
  handler: async (req: HttpRequest) => {
    if (req.method === "OPTIONS") return preflight();
    return ok(states);
  }
});

app.http("mastersDistricts", {
  methods: ["GET", "OPTIONS"],
  route: "masters/forms/dropdowns/districts/{state}",
  authLevel: "anonymous",
  handler: async (req: HttpRequest) => {
    if (req.method === "OPTIONS") return preflight();
    const state = req.params.state;
    return ok(districts[state] || []);
  }
});

app.http("mastersFields", {
  methods: ["GET", "OPTIONS"],
  route: "masters/forms/dropdowns/fields",
  authLevel: "anonymous",
  handler: async (req: HttpRequest) => {
    if (req.method === "OPTIONS") return preflight();
    return ok({
        bloodGroups: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
        genders: ["Male", "Female", "Other"],
        employmentTypes: ["Full-Time", "Part-Time", "Contract", "Freelance"]
    });
  }
});
