import { Schema, Types, model, type HydratedDocument, type InferSchemaType } from "mongoose";

export const notificationTypes = [
  "complaint_created",
  "status_updated",
  "sla_warning",
  "resolved",
  "admin_message",
] as const;

export type NotificationType = (typeof notificationTypes)[number];

const notificationSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    complaintId: {
      type: Types.ObjectId,
      ref: "Complaint",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: notificationTypes,
      required: true,
      default: "status_updated",
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

export type Notification = InferSchemaType<typeof notificationSchema>;
export type NotificationDocument = HydratedDocument<Notification>;

export const NotificationModel = model<Notification>("Notification", notificationSchema);
