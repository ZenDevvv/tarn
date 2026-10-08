import { z } from "zod";

export const adminUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  sortBy: z.enum(["createdAt", "name", "email"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export type AdminUsersQueryInput = z.infer<typeof adminUsersQuerySchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
