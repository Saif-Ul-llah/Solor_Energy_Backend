import express, { Request, Response, Router } from "express";
import multer, { StorageEngine } from "multer";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs-extra";
import dotenv from "dotenv";

dotenv.config();

const uploadsDir = "/tmp";
fs.ensureDirSync(uploadsDir);

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

// Multer storage
const storage: StorageEngine = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

export const upload = multer({ storage });

// File interface
interface UploadedFile {
  path: string;
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
}

// Cloudinary response format
interface UploadedImage {
  secure_url: string;
  public_id: string;
}

class UploadController {

  public static async uploadPromises(files: UploadedFile[]): Promise<UploadedImage[]> {
    const promises = files.map(async (file) => {
      try {
        const result: UploadApiResponse = await cloudinary.uploader.upload(file.path, {
          folder: "project1",
          resource_type: "image",
          type: "upload",
        });

        await fs.unlink(file.path);

        return { secure_url: result.secure_url, public_id: result.public_id };
      } catch (error) {
        await fs.unlink(file.path);
        throw error;
      }
    });

    return Promise.all(promises);
  }

  public static UploadFiles = async (req: Request, res: Response): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ status: false, message: "No files provided" });
        return;
      }

      let imageUrls = await this.uploadPromises(files);
      const urls = imageUrls.map((image) => image.secure_url);

      res.json({
        status: true,
        message: "File uploaded successfully",
        urls,
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ status: false, message: "Internal server error" });
    }
  };

}

export default UploadController;
