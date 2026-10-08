import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "@tracker/database";
import { Role } from "@tracker/types";
import { env } from "../config/env";
import { AuthenticationError } from "./error-handler";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface JwtPayload {
  userId: string;
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const token = req.cookies?.token || req.signedCookies?.token;

    if (!token) {
      throw new AuthenticationError("Authentication required");
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      throw new AuthenticationError(
        "Invalid or expired authentication session",
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!user) {
      throw new AuthenticationError("User account not found");
    }

    if (!user.isActive) {
      throw new AuthenticationError(
        "Account has been suspended. Please contact system administrator.",
      );
    }

    req.user = user as AuthUser;
    next();
  } catch (error) {
    next(error);
  }
}
