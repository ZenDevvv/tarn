import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@tracker/database";
import { RegisterInput, LoginInput } from "@tracker/validation";
import { env } from "../../config/env";
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
} from "../../middleware/error-handler";
import { statusService } from "../statuses/status.service";

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictError(
        "An account with this email address already exists",
      );
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        role: "USER",
        isActive: true,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Seed default application pipeline statuses
    await statusService.seedDefaultStatuses(user.id);

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return { user, token };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new AuthenticationError("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);

    if (!isMatch) {
      throw new AuthenticationError("Invalid email or password");
    }

    if (!user.isActive) {
      throw new AuthenticationError(
        "Account has been suspended. Please contact system administrator.",
      );
    }

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      token,
    };
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  },
};
