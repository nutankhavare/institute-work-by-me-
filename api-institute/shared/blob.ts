import { BlobServiceClient } from "@azure/storage-blob";
import * as crypto from "crypto";

export async function uploadToBlob(
  buffer: Buffer,
  filename: string,
  mimetype: string,
  folder: string
): Promise<string> {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

  const uuid = crypto.randomUUID();
  // Sanitize filename to avoid weird characters in blob URL
  const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const blobName = `${folder}/${uuid}-${safeFilename}`;

  if (!connectionString || !containerName) {
    // Local fallback if no Azure Storage is configured
    console.warn("No AZURE_STORAGE_CONNECTION_STRING, using local fallback URL");
    return `/uploads/${blobName}`;
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Create container if it doesn't exist (useful for first-time local setup)
    await containerClient.createIfNotExists({ access: 'blob' });

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: mimetype
      }
    });

    return blockBlobClient.url;
  } catch (error) {
    console.error("Error uploading to Blob Storage:", error);
    throw new Error("Failed to upload file");
  }
}
