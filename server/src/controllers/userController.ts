import bcrypt from "bcrypt";
import Joi from "joi";
import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import { HttpError } from "../middleware/errorHandler";
import { UserModel } from "../models/User";
import { buildUserResponse } from "../utils/buildUserResponse";

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(1).max(80).required(),
  email: Joi.string().email().required(),
});

const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required(),
});

export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await UserModel.findById(req.user?.id).select("-password");

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    res.json({
      success: true,
      data: buildUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = await updateProfileSchema.validateAsync(req.body, { abortEarly: false });
    const user = await UserModel.findById(req.user?.id);

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const normalizedEmail = payload.email.toLowerCase();
    const existingUser = await UserModel.findOne({ email: normalizedEmail, _id: { $ne: user._id } });

    if (existingUser) {
      throw new HttpError(409, "An account with that email already exists");
    }

    user.name = payload.name.trim();
    user.email = normalizedEmail;
    await user.save();

    res.json({
      success: true,
      data: buildUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserPassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = await updatePasswordSchema.validateAsync(req.body, { abortEarly: false });
    const user = await UserModel.findById(req.user?.id);

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const isPasswordValid = await bcrypt.compare(payload.currentPassword, user.password);

    if (!isPasswordValid) {
      throw new HttpError(400, "Current password is incorrect");
    }

    const isSamePassword = await bcrypt.compare(payload.newPassword, user.password);

    if (isSamePassword) {
      throw new HttpError(400, "New password must be different from the current password");
    }

    user.password = await bcrypt.hash(payload.newPassword, 12);
    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};
