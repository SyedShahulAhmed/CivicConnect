import { v2 as cloudinary } from "cloudinary";
import type { Express } from "express";

import { HttpError } from "../middleware/errorHandler";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImageToCloudinary = async (
  file?: Express.Multer.File,
): Promise<string | undefined> => {
  if (!file) {
    return undefined;
  }

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new HttpError(
      500,
      "Cloudinary configuration is missing. Add CLOUDINARY credentials before uploading images.",
    );
  }

  const base64Image = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(base64Image, {
    folder: "civic-connect/complaints",
    resource_type: "image",
  });

  return result.secure_url;
};

