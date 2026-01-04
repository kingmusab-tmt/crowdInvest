declare module "next-file" {
  import { NextApiRequest } from "next";

  interface UploadOptions {
    fields: string[];
    destination: string;
  }

  interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
  }

  interface UploadResult {
    [fieldName: string]: UploadedFile[];
  }

  export function upload(
    req: NextApiRequest,
    options: UploadOptions
  ): Promise<UploadResult>;

  export default {
    upload,
  };
}
