export type UserResponseShape = {
  id?: string;
  _id?: { toString(): string };
  name: string;
  email: string;
  role: "citizen" | "admin";
  ward: string;
  address: string;
  falseComplaintCount?: number;
  isSuspended?: boolean;
  suspendedAt?: Date | null;
  suspensionReason?: string | null;
};

export const buildUserResponse = (user: UserResponseShape) => ({
  id: user.id || user._id?.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  ward: user.ward,
  address: user.address,
  falseComplaintCount: user.falseComplaintCount || 0,
  isSuspended: Boolean(user.isSuspended),
  suspendedAt: user.suspendedAt || undefined,
  suspensionReason: user.suspensionReason || undefined,
});
