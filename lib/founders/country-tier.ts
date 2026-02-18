import type { CountryTier } from "@/lib/founders/types";

const TIER_1_COUNTRIES = new Set([
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "France",
  "Netherlands",
  "Switzerland",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Ireland",
  "Belgium",
  "Austria",
  "Australia",
  "New Zealand",
  "Japan",
  "South Korea",
  "Singapore",
  "Israel",
  "United Arab Emirates",
]);

const TIER_2_COUNTRIES = new Set([
  "India",
  "China",
  "Brazil",
  "Mexico",
  "Spain",
  "Italy",
  "Portugal",
  "Poland",
  "Czech Republic",
  "Hungary",
  "Romania",
  "Turkey",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "Malaysia",
  "Thailand",
  "Indonesia",
  "Vietnam",
  "Philippines",
  "Taiwan",
  "Hong Kong",
  "Chile",
  "Argentina",
  "Colombia",
  "Peru",
  "South Africa",
  "Egypt",
  "Nigeria",
  "Kenya",
]);

const COUNTRY_ALIAS_RULES: Array<{ pattern: RegExp; country: string }> = [
  { pattern: /\busa\b|\bunited states\b|\bu\.s\.a\b|\bu\.s\b|\bus\b/, country: "United States" },
  { pattern: /\buk\b|\bunited kingdom\b|\bgreat britain\b|\bengland\b/, country: "United Kingdom" },
  { pattern: /\bu\.a\.e\b|\buae\b|\bunited arab emirates\b/, country: "United Arab Emirates" },
  { pattern: /\bsingapore\b/, country: "Singapore" },
  { pattern: /\bindia\b/, country: "India" },
  { pattern: /\bcanada\b/, country: "Canada" },
  { pattern: /\bgermany\b/, country: "Germany" },
  { pattern: /\bfrance\b/, country: "France" },
  { pattern: /\baustralia\b/, country: "Australia" },
  { pattern: /\bnew zealand\b/, country: "New Zealand" },
  { pattern: /\bjapan\b/, country: "Japan" },
  { pattern: /\bsouth korea\b|\bkorea\b/, country: "South Korea" },
  { pattern: /\bisrael\b/, country: "Israel" },
  { pattern: /\bspain\b/, country: "Spain" },
  { pattern: /\bitaly\b/, country: "Italy" },
  { pattern: /\bnetherlands\b/, country: "Netherlands" },
  { pattern: /\bswitzerland\b/, country: "Switzerland" },
  { pattern: /\bsweden\b/, country: "Sweden" },
  { pattern: /\bnorway\b/, country: "Norway" },
  { pattern: /\bdenmark\b/, country: "Denmark" },
  { pattern: /\bfinland\b/, country: "Finland" },
  { pattern: /\bireland\b/, country: "Ireland" },
  { pattern: /\bbelgium\b/, country: "Belgium" },
  { pattern: /\baustria\b/, country: "Austria" },
  { pattern: /\bchina\b/, country: "China" },
  { pattern: /\bbrazil\b/, country: "Brazil" },
  { pattern: /\bmexico\b/, country: "Mexico" },
  { pattern: /\bpoland\b/, country: "Poland" },
  { pattern: /\bczech\b/, country: "Czech Republic" },
  { pattern: /\bhungary\b/, country: "Hungary" },
  { pattern: /\bromania\b/, country: "Romania" },
  { pattern: /\bturkey\b/, country: "Turkey" },
  { pattern: /\bsaudi\b/, country: "Saudi Arabia" },
  { pattern: /\bqatar\b/, country: "Qatar" },
  { pattern: /\bkuwait\b/, country: "Kuwait" },
  { pattern: /\bmalaysia\b/, country: "Malaysia" },
  { pattern: /\bthailand\b/, country: "Thailand" },
  { pattern: /\bindonesia\b/, country: "Indonesia" },
  { pattern: /\bvietnam\b/, country: "Vietnam" },
  { pattern: /\bphilippines\b/, country: "Philippines" },
  { pattern: /\btaiwan\b/, country: "Taiwan" },
  { pattern: /\bhong kong\b/, country: "Hong Kong" },
  { pattern: /\bchile\b/, country: "Chile" },
  { pattern: /\bargentina\b/, country: "Argentina" },
  { pattern: /\bcolombia\b/, country: "Colombia" },
  { pattern: /\bperu\b/, country: "Peru" },
  { pattern: /\bsouth africa\b/, country: "South Africa" },
  { pattern: /\begypt\b/, country: "Egypt" },
  { pattern: /\bnigeria\b/, country: "Nigeria" },
  { pattern: /\bkenya\b/, country: "Kenya" },
];

const CITY_TO_COUNTRY: Array<{ pattern: RegExp; country: string }> = [
  { pattern: /\bsan francisco\b|\bnew york\b|\baustin\b|\bseattle\b|\bboston\b|\bchicago\b|\blos angeles\b|\bmiami\b|\bdallas\b|\bphiladelphia\b|\bwashington\b|\bhouston\b|\bdenver\b|\batlanta\b|\bcharlottesville\b|\bround rock\b|\barlington\b|\bpittsburgh\b|\bsouth burlington\b|\bdearborn\b|\bcosta mesa\b/, country: "United States" },
  { pattern: /\bbangalore\b|\bbengaluru\b|\bmumbai\b|\bdelhi\b|\bnew delhi\b|\bhyderabad\b|\bpune\b|\bchennai\b|\bkolkata\b|\bgurgaon\b|\bgurugram\b|\bnoida\b|\bjaipur\b|\bahmedabad\b/, country: "India" },
  { pattern: /\blondon\b|\bmanchester\b/, country: "United Kingdom" },
  { pattern: /\btoronto\b|\bvancouver\b|\bmontreal\b/, country: "Canada" },
  { pattern: /\bberlin\b|\bmunich\b|\bfrankfurt\b|\bstuttgart\b/, country: "Germany" },
  { pattern: /\bparis\b/, country: "France" },
  { pattern: /\bsingapore\b/, country: "Singapore" },
  { pattern: /\bhamamatsu\b|\btokyo\b|\bosaka\b/, country: "Japan" },
  { pattern: /\bsydney\b|\bmelbourne\b/, country: "Australia" },
  { pattern: /\bdubai\b|\bab u dhabi\b/, country: "United Arab Emirates" },
  { pattern: /\bherzogenaurach\b/, country: "Germany" },
];

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : part))
    .join(" ");
}

export function countryToSlug(country: string): string {
  return country
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function normalizeCountryName(value: string): string {
  const clean = value.trim().replace(/\s+/g, " ");
  if (!clean) {
    return "Unknown";
  }

  const normalized = clean.toLowerCase();
  for (const rule of COUNTRY_ALIAS_RULES) {
    if (rule.pattern.test(normalized)) {
      return rule.country;
    }
  }

  return titleCase(clean);
}

export function extractCountryFromHeadquarters(
  headquarters: string | null | undefined,
  sourceUrl?: string | null,
): string {
  if (!headquarters || !headquarters.trim()) {
    if (sourceUrl && /EmpiricalListofGroupCompanies/i.test(sourceUrl)) {
      return "India";
    }
    return "Unknown";
  }

  const clean = headquarters.trim().replace(/\s+/g, " ");
  const normalized = clean.toLowerCase();

  if (/\bremote\b/.test(normalized)) {
    return "Unknown";
  }

  for (const rule of COUNTRY_ALIAS_RULES) {
    if (rule.pattern.test(normalized)) {
      return rule.country;
    }
  }

  for (const cityRule of CITY_TO_COUNTRY) {
    if (cityRule.pattern.test(normalized)) {
      return cityRule.country;
    }
  }

  const segments = clean.split(",").map((segment) => segment.trim()).filter(Boolean);
  if (segments.length > 0) {
    const tail = segments[segments.length - 1];
    return normalizeCountryName(tail);
  }

  if (sourceUrl && /EmpiricalListofGroupCompanies/i.test(sourceUrl)) {
    return "India";
  }

  return "Unknown";
}

export function classifyCountryTier(country: string): CountryTier {
  if (TIER_1_COUNTRIES.has(country)) {
    return "TIER_1";
  }
  if (TIER_2_COUNTRIES.has(country)) {
    return "TIER_2";
  }
  return "TIER_3";
}

export function countryTierLabel(tier: CountryTier): string {
  if (tier === "TIER_1") return "Tier 1";
  if (tier === "TIER_2") return "Tier 2";
  return "Tier 3";
}
