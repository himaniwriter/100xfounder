const DATABASE_URL_PATTERN = /Environment variable not found:\s*DATABASE_URL/i;
const DATABASE_URL_PLACEHOLDER_PATTERNS = [
  /USER:PASSWORD@HOST/i,
  /DB_NAME/i,
  /replace-with/i,
  /example/i,
];

export const DATABASE_CONFIG_ERROR =
  "Database is not configured. Add DATABASE_URL in .env.local, then restart the server.";

export function isDatabaseConfigured() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    return false;
  }

  return !DATABASE_URL_PLACEHOLDER_PATTERNS.some((pattern) =>
    pattern.test(databaseUrl),
  );
}

export function toPublicDatabaseError(
  error: unknown,
  fallbackMessage: string,
) {
  if (!isDatabaseConfigured()) {
    return DATABASE_CONFIG_ERROR;
  }

  if (error instanceof Error) {
    if (DATABASE_URL_PATTERN.test(error.message) || /P1012/.test(error.message)) {
      return DATABASE_CONFIG_ERROR;
    }
  }

  return fallbackMessage;
}
