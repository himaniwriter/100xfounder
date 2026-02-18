export const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
]);

export function isWorkEmail(value: string): boolean {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return false;
  }

  const domain = email.split("@")[1] ?? "";
  return Boolean(domain) && !FREE_EMAIL_DOMAINS.has(domain);
}
