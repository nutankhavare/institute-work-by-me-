import { BlobServiceClient } from "@azure/storage-blob";
import "dotenv/config";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";

if (!connectionString) {
  console.warn("AZURE_STORAGE_CONNECTION_STRING is not set. Azure Storage will not work.");
}

let blobServiceClient: any;
let containerClient: any;

if (connectionString) {
  blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  containerClient = blobServiceClient.getContainerClient(containerName);
}

// Ensure container exists
async function ensureContainer() {
  try {
    const exists = await containerClient.exists();
    if (!exists) {
      await containerClient.create({ access: 'blob' });
      console.log(`Container "${containerName}" created.`);
    }
  } catch (error) {
    console.error("Error ensuring Azure container exists:", error);
  }
}

// Only try to ensure container if connection string is present
if (connectionString) {
  ensureContainer();
}

/**
 * Uploads a buffer to Azure Blob Storage and returns the public URL
 * @param buffer File buffer
 * @param originalName Original filename
 * @param mimeType MIME type
 * @returns Public URL of the uploaded blob
 */
export async function uploadToAzure(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<string> {
  if (!connectionString) {
    throw new Error("Azure Storage Connection String is missing");
  }

  // Stricter sanitization: remove non-alphanumeric chars (except . - _)
  const sanitized = originalName
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9.\-_]/g, "");
  
  const blobName = `${Date.now()}-${sanitized}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: mimeType },
  });

  return blockBlobClient.url;
}
