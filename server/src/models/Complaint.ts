import { Schema, Types, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const complaintSchema = new Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["garbage", "water", "electricity", "road", "drainage"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: true,
    },
    severityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    sentimentScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    duplicateScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    citizenId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (value: number[]) => value.length === 2,
          message: "Coordinates must contain [lng, lat]",
        },
      },
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    slaDeadline: {
      type: Date,
      required: true,
    },
    remarks: [
      {
        message: {
          type: String,
          required: true,
          trim: true,
        },
        authorId: {
          type: Types.ObjectId,
          ref: "User",
        },
        authorName: {
          type: String,
          required: true,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

complaintSchema.index({ location: "2dsphere" });

export type Complaint = InferSchemaType<typeof complaintSchema>;
export type ComplaintDocument = HydratedDocument<Complaint>;

export const ComplaintModel = model<Complaint>("Complaint", complaintSchema);
