function parseBooleanFlag(rawValue: string | undefined): boolean {
  if (!rawValue) {
    return false;
  }

  const normalized = rawValue.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

const userDoFollowEnabled = parseBooleanFlag(
  process.env.ALLOW_USER_SUBMITTED_DOFOLLOW_LINKS,
);

export function getUserSubmittedExternalRel(): string {
  return userDoFollowEnabled ? "noopener noreferrer" : "noopener noreferrer nofollow";
}
