export type SessionRole = "ADMIN" | "MEMBER";

export type SessionPayload = {
  userId: string;
  email: string;
  role: SessionRole;
  name: string | null;
};
