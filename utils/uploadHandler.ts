/**
 * Utility for handling file uploads to the /api/newupload endpoint
 * Uses BLOB_READ_WRITE_TOKEN from environment variables
 */

export interface UploadResponse {
  filename: string;
  link: string;
}

export interface UploadError {
  error: string;
  message?: string;
}

/**
 * Upload a file to the server using the newupload endpoint
 * @param file - The file to upload
 * @returns Promise with upload response containing the file URL
 * @throws Error if upload fails
 */
export async function uploadFileToServer(file: File): Promise<UploadResponse> {
  if (!file) {
    throw new Error("No file provided");
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(
      `/api/newupload?filename=${encodeURIComponent(file.name)}`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = (await response.json()) as UploadError;
      throw new Error(errorData.error || "Upload failed");
    }

    const data = (await response.json()) as UploadResponse;
    return data;
  } catch (error: any) {
    throw new Error(error.message || "File upload failed");
  }
}

/**
 * Validate if a file is an acceptable image type
 * @param file - The file to validate
 * @returns true if file is valid image type
 */
export function isValidImageFile(file: File): boolean {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/jpg",
  ];

  return allowedMimeTypes.includes(file.type);
}

/**
 * Validate file size (default 5MB)
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB (default: 5)
 * @returns true if file size is within limits
 */
export function isValidFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}
