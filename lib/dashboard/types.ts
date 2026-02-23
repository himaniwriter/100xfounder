import type { WatchlistEntityType } from "@prisma/client";

export const DASHBOARD_FREE_LIMITS = {
  watchlistItems: 20,
  savedSearches: 5,
} as const;

export const SEARCH_TYPE_VALUES = [
  "all",
  "founder",
  "company",
  "blog",
  "signal",
  "topic",
] as const;

export type DashboardEntityType = "founder" | "company" | "topic";
export type DashboardSearchType = (typeof SEARCH_TYPE_VALUES)[number];

export type DashboardSummary = {
  trackedCount: number;
  unreadAlerts: number;
  savedSearchCount: number;
  profileStrength: number;
};

export type WatchlistItem = {
  id: string;
  entityType: DashboardEntityType;
  entitySlug: string;
  entityName: string;
  createdAt: string;
};

export type SavedSearchItem = {
  id: string;
  query: string;
  type: DashboardSearchType;
  filtersJson: Record<string, unknown> | null;
  createdAt: string;
};

export type DashboardNotification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  targetUrl: string | null;
  isRead: boolean;
  createdAt: string;
};

export type DashboardPreference = {
  instantEmail: boolean;
  dailyDigest: boolean;
  weeklyDigest: boolean;
  premiumOptIn: boolean;
  updatedAt: string | null;
};

export type DashboardFeedItem = {
  id: string;
  kind: "signal" | "news";
  title: string;
  description: string;
  href: string;
  createdAt: string;
  entityType: DashboardEntityType;
  entityName: string;
};

const ENTITY_TO_DB: Record<DashboardEntityType, WatchlistEntityType> = {
  founder: "FOUNDER",
  company: "COMPANY",
  topic: "TOPIC",
};

const ENTITY_FROM_DB: Record<WatchlistEntityType, DashboardEntityType> = {
  FOUNDER: "founder",
  COMPANY: "company",
  TOPIC: "topic",
};

export function toDashboardEntityDbValue(value: DashboardEntityType): WatchlistEntityType {
  return ENTITY_TO_DB[value];
}

export function fromDashboardEntityDbValue(value: WatchlistEntityType): DashboardEntityType {
  return ENTITY_FROM_DB[value];
}
