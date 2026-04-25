# Azure Functions Implementation Guide: MDS-Admin

This guide is tailored for your current Azure setup as seen in your portal. You already have several Function Apps running (like `func-mds-admin-api` and `institute-fn-app`).

---

## 1. Your Existing Infrastructure

Based on your Azure Portal, you are using **Dynamic (Consumption)** pricing tiers in **South India** and **Central India**. This is perfect for cost-effective background processing.

### Which App to use?
*   **`func-mds-admin-api`**: Use this for logic that directly supports your main administrative dashboard.
*   **`institute-fn-app`**: Use this for institute-specific logic (like the Compliance Checker).
*   **`vanloka-iot-function`**: Likely for future vehicle tracking/IoT integration.

---

## 2. Setting Up Your Local Environment

To work with these existing apps, ensure your local folder is synced:

1.  **Install Azure CLI**: `az login`
2.  **Fetch App Settings**: To get the connection strings from your live app to your local machine:
    ```bash
    func azure functionapp fetch-app-settings func-mds-admin-api
    ```

---

## 3. Recommended Use Cases for Your Apps

### A. Automatic Document Expiry (Timer Trigger)
*   **App**: `institute-fn-app`
*   **Schedule**: `0 0 8 * * *` (Every day at 8 AM)
*   **Goal**: Query your Neon Postgres database for any `compliance` records where `expiry_date` is < 7 days away.

### B. Image Compression (Blob Trigger)
*   **App**: `func-mds-admin-api`
*   **Goal**: When a large PDF or Image is uploaded to your `uploads` container, this function can automatically optimize it to save storage costs.

---

## 4. How to Deploy to Your Existing Apps

Once you have written your code in TypeScript:

1.  **Build the project**:
    ```bash
    npm run build
    ```
2.  **Deploy to a specific app**:
    ```bash
    func azure functionapp publish func-mds-admin-api
    ```
    *(Replace `func-mds-admin-api` with the name of the app you want to update from your screenshot)*.

---

## 5. Finding Your Connection String (For Blob Storage)

Since you asked about the media upload working:
1.  Go to your **Storage Account** in the Azure Portal (not the Function App).
2.  Look for **Security + networking** > **Access keys**.
3.  Copy the **Connection string**.
4.  Paste it into your `backend/.env` as `AZURE_STORAGE_CONNECTION_STRING`.

---

## 6. Monitoring Performance
In your screenshot, you can see the **Status** (Running) and **Location**. To see if your functions are actually working:
1.  Click on the Function App Name (e.g., `MDS-Admin`).
2.  Go to **Monitor** in the left sidebar.
3.  You will see a live "Invocations" list showing every time a file was processed or a task was run.

---

> [!IMPORTANT]
> **Ready to Test?**
> Once you have pasted the **Connection String** from step 5 into your `.env`, let me know, and we will perform a live test upload to see it appear in your Azure container!
