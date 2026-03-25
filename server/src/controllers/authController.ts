import bcrypt from "bcrypt";
import Joi from "joi";
import type { NextFunction, Request, Response } from "express";

import { signToken } from "../config/jwt";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import { HttpError } from "../middleware/errorHandler";
import { UserModel } from "../models/User";
import { buildUserResponse } from "../utils/buildUserResponse";

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  ward: Joi.string().trim().min(1).max(50).required(),
  address: Joi.string().trim().min(5).max(200).required(),
  role: Joi.string().valid("citizen", "admin").optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payload = await registerSchema.validateAsync(req.body, { abortEarly: false });
    const existingUser = await UserModel.findOne({ email: payload.email.toLowerCase() });

    if (existingUser) {
      throw new HttpError(409, "An account with that email already exists");
    }

    const hashedPassword = await bcrypt.hash(payload.password, 12);
    const requestedRole = payload.role === "admin" && process.env.ALLOW_ADMIN_REGISTRATION === "true" ? "admin" : "citizen";
    const user = await UserModel.create({
      ...payload,
      email: payload.email.toLowerCase(),
      password: hashedPassword,
      role: requestedRole,
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: buildUserResponse(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payload = await loginSchema.validateAsync(req.body, { abortEarly: false });
    const user = await UserModel.findOne({ email: payload.email.toLowerCase() });

    if (!user) {
      throw new HttpError(401, "Invalid email or password");
    }

    if (user.isSuspended) {
      throw new HttpError(403, user.suspensionReason || "Your account has been suspended because of multiple false complaints.");
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.password);

    if (!isPasswordValid) {
      throw new HttpError(401, "Invalid email or password");
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      data: {
        token,
        user: buildUserResponse(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
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
