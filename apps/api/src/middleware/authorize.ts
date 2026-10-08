import { Request, Response, NextFunction } from "express";
import { Role } from "@tracker/types";
import { AuthenticationError, AuthorizationError } from "./error-handler";

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError("Authentication required"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AuthorizationError(
          "Insufficient permissions to access this administrative resource",
        ),
      );
    }
    next();
  };
}

export const requireAdmin = requireRole("ADMIN");
