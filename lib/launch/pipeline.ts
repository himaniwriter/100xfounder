import { discoverContactsForNewProducts, importProductHuntDay } from "@/lib/launch/import";
import { queueDailyDigest } from "@/lib/launch/instagram";
import { checkOutreachReplies, sendDueOutreach } from "@/lib/launch/outreach";

export const PIPELINE_STAGES = ["import", "contacts", "replies", "send", "digest"] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export type StageResult = { stage: PipelineStage; ok: boolean; result?: unknown; error?: string };

const STAGE_RUNNERS: Record<PipelineStage, () => Promise<unknown>> = {
  import: () => importProductHuntDay(1),
  contacts: () => discoverContactsForNewProducts(),
  // Replies are checked before sending so nobody who answered gets a follow-up.
  replies: () => checkOutreachReplies(),
  send: () => sendDueOutreach(),
  digest: async () => {
    const item = await queueDailyDigest(1);
    return item ? { queued: item.refKey, slides: item.slideCount } : { queued: null };
  },
};

/**
 * The daily growth routine: import yesterday's top Product Hunt launches, find
 * founder contacts, process replies, send due outreach, and queue the Instagram
 * digest. Each stage is isolated so one failure doesn't block the rest.
 */
export async function runDailyGrowthPipeline(stages: readonly PipelineStage[] = PIPELINE_STAGES) {
  const results: StageResult[] = [];
  for (const stage of stages) {
    try {
      results.push({ stage, ok: true, result: await STAGE_RUNNERS[stage]() });
    } catch (error) {
      results.push({ stage, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return results;
}

export function parseStages(value: string | null): PipelineStage[] {
  if (!value) {
    return [...PIPELINE_STAGES];
  }
  return value
    .split(",")
    .map((stage) => stage.trim())
    .filter((stage): stage is PipelineStage => (PIPELINE_STAGES as readonly string[]).includes(stage));
}
