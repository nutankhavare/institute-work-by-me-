# Vehicle Registration Form Comparison

This document provides a detailed comparison between the **MDS Reference Standard** (the form you pasted) and your **Institute Project Implementation**.

---

## 🟢 Table 1: Common Fields
*These fields exist in both the MDS Reference and your Institute project.*

| Category | Field Name | Present in MDS | Present in Institute |
| :--- | :--- | :---: | :---: |
| **Basic Info** | Vehicle Number | ✅ | ✅ |
| **Basic Info** | Vehicle Type | ✅ | ✅ |
| **Basic Info** | Manufacturer (OEM) | ✅ | ✅ |
| **Basic Info** | Vehicle Model | ✅ | ✅ |
| **Basic Info** | Manufacturing Year | ✅ | ✅ |
| **Basic Info** | Fuel Type | ✅ | ✅ |
| **GPS Tracking** | GPS Device ID | ✅ | ✅ |
| **GPS Tracking** | Installation Date | ✅ | ✅ |
| **Permit** | Permit Type | ✅ | ✅ |
| **Permit** | Permit Number | ✅ | ✅ |
| **Permit** | Issue / Expiry Date | ✅ | ✅ |
| **Ownership** | Ownership Type | ✅ | ✅ |
| **Ownership** | Vendor Name | ✅ | ✅ |
| **Ownership** | Vendor Contact | ✅ | ✅ |
| **Insurance** | Provider Name | ✅ | ✅ |
| **Insurance** | Policy Number | ✅ | ✅ |
| **Insurance** | Expiry Date | ✅ | ✅ |
| **Documents** | RC Book Upload | ✅ | ✅ |
| **Documents** | Insurance Copy | ✅ | ✅ |
| **Documents** | Permit Copy | ✅ | ✅ |
| **Documents** | Fitness Certificate | ✅ | ✅ |
| **Documents** | Pollution Cert (PUC) | ✅ | ✅ |
| **System** | Remarks | ✅ | ✅ |

---

## 🔴 Table 2: Differences & Missing Fields
*These fields are present in the **MDS Reference** but are currently **MISSING** from your **Institute Project**.*

| Feature Name | Present in MDS | Present in Institute |
| :--- | :---: | :---: |
| **Seating Capacity** | ✅ | ❌ |
| **Vehicle Color** | ✅ | ❌ |
| **Kilometers Driven** | ✅ | ❌ |
| **GPS SIM Number** | ✅ | ❌ |
| **Beacon Count** | ✅ | ❌ |
| **Assigned Driver Lookup** | ✅ | ❌ |
| **Assigned Route Lookup** | ✅ | ❌ |
| **Legal Owner Name** | ✅ | ❌ |
| **Legal Owner Contact** | ✅ | ❌ |
| **Org / Fleet Sub-Name** | ✅ | ❌ |
| **Fitness Certificate No.** | ✅ | ❌ |
| **Pollution Certificate No.** | ✅ | ❌ |
| **Last Service Date** | ✅ | ❌ |
| **Next Service Due Date** | ✅ | ❌ |
| **Tyre Replacement Due** | ✅ | ❌ |
| **Battery Replacement Due** | ✅ | ❌ |
| **Fire Extinguisher Status** | ✅ | ❌ |
| **First Aid Kit Status** | ✅ | ❌ |
| **CCTV Installed Status** | ✅ | ❌ |
| **Panic Button Status** | ✅ | ❌ |
| **GPS Installation Proof** | ✅ | ❌ |
| **Owner ID Proof Upload** | ✅ | ❌ |
| **Vendor Agreement Upload** | ✅ | ❌ |

---

### 🛠 Summary of Action Items
To bring the **Institute Project** up to the level of the **MDS Reference**, we need to inject these missing fields into your `VehicleFormPage.tsx`.
