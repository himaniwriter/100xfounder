import type { UserRole } from "@prisma/client";

export type PublicUserDto = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt?: Date;
};

type UserLike = {
  id: string;
  email: string;
  name: string | null;
  avatar?: string | null;
  role: UserRole;
  createdAt?: Date;
  // Any extra internal fields are intentionally ignored.
  [key: string]: unknown;
};

export function toPublicUserDTO(user: UserLike): PublicUserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: typeof user.avatar === "string" ? user.avatar : null,
    role: user.role,
    ...(user.createdAt ? { createdAt: user.createdAt } : {}),
  };
}
