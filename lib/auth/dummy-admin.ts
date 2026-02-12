import "server-only";

export type DummyAdminCredentials = {
  email: string;
  password: string;
  name: string;
};

const DEFAULT_DUMMY_ADMIN: DummyAdminCredentials = {
  email: "admin@100xfounder.com",
  password: "Admin@12345",
  name: "100Xfounder Admin",
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isDummyAdminEnabled(): boolean {
  const flag = process.env.DUMMY_ADMIN_ENABLED?.trim().toLowerCase();

  if (flag === "true") {
    return true;
  }

  if (flag === "false") {
    return false;
  }

  return process.env.NODE_ENV !== "production";
}

export function getDummyAdminCredentials(): DummyAdminCredentials {
  return {
    email: normalizeEmail(process.env.DUMMY_ADMIN_EMAIL ?? DEFAULT_DUMMY_ADMIN.email),
    password: process.env.DUMMY_ADMIN_PASSWORD ?? DEFAULT_DUMMY_ADMIN.password,
    name: process.env.DUMMY_ADMIN_NAME ?? DEFAULT_DUMMY_ADMIN.name,
  };
}

export function isDummyAdminLogin(email: string, password: string): boolean {
  if (!isDummyAdminEnabled()) {
    return false;
  }

  const credentials = getDummyAdminCredentials();

  return normalizeEmail(email) === credentials.email && password === credentials.password;
}

