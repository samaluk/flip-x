import type { AnalyticsEventName } from "./events";

export type AnalyticsPropertyValue = string | number | boolean | null;

export type AnalyticsProperties = Record<string, AnalyticsPropertyValue>;

export type AnalyticsEvent = {
  distinctId: string;
  event: AnalyticsEventName;
  properties: AnalyticsProperties;
};
