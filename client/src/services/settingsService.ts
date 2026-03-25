import api, { type User } from "./api";

export interface UpdateProfilePayload {
  name: string;
  email: string;
}

export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const getUserProfile = async (): Promise<User> => {
  const response = await api.get<{ data: User }>("/user/profile");
  return response.data.data;
};

export const updateUserProfile = async (payload: UpdateProfilePayload): Promise<User> => {
  const response = await api.put<{ data: User }>("/user/profile", payload);
  return response.data.data;
};

export const updateUserPassword = async (payload: UpdatePasswordPayload): Promise<void> => {
  await api.put("/user/password", payload);
};
