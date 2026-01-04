import { NextApiRequest } from "next";
import { upload } from "next-file"; // Import upload function from Next-File

export async function uploadFile(
  req: NextApiRequest,
  fieldName: string,
  uploadDir: string
) {
  try {
    const uploadedFile = await upload(req, {
      fields: [fieldName], // Specify the field name containing the file
      destination: uploadDir, // Set the upload directory
    });

    return uploadedFile[fieldName][0]; // Return the uploaded file object
  } catch (error) {
    throw error; // Re-throw the error for handling in the API route
  }
}
