import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

import { connectDatabase, disconnectDatabase } from "../src/config/db";
import { UserModel } from "../src/models/User";
import { app } from "../src/server";

let mongoServer: MongoMemoryServer | undefined;

describe("user settings routes", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  it("loads and updates the authenticated user profile", async () => {
    const registerResponse = await request(app).post("/api/auth/register").send({
      name: "Asha Kumar",
      email: "asha@example.com",
      password: "password123",
      ward: "Ward 12",
      address: "12 Market Road",
    });

    const token = registerResponse.body.data.token as string;

    const profileResponse = await request(app)
      .get("/api/user/profile")
      .set("Authorization", `Bearer ${token}`);

    const updateResponse = await request(app)
      .put("/api/user/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Asha Kumari",
        email: "asha.kumari@example.com",
      });

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.data.email).toBe("asha@example.com");
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.name).toBe("Asha Kumari");
    expect(updateResponse.body.data.email).toBe("asha.kumari@example.com");
  });

  it("changes the password when the current password is valid", async () => {
    const registerResponse = await request(app).post("/api/auth/register").send({
      name: "Rahul User",
      email: "rahul@example.com",
      password: "password123",
      ward: "Ward 1",
      address: "1 Civic Plaza",
    });

    const token = registerResponse.body.data.token as string;

    const passwordResponse = await request(app)
      .put("/api/user/password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "password123",
        newPassword: "newpass456",
      });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "rahul@example.com",
      password: "newpass456",
    });

    expect(passwordResponse.status).toBe(200);
    expect(passwordResponse.body.message).toBe("Password updated successfully");
    expect(loginResponse.status).toBe(200);
  });
});
