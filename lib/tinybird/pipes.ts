import { Tinybird } from "@chronark/zod-bird";
import { z } from "zod";

import { VIDEO_EVENT_TYPES } from "../constants";
import { WEBHOOK_TRIGGERS } from "../webhook/constants";

// AGPL: Make Tinybird optional for local development
// Check if Tinybird is properly configured (not placeholder token)
const isTinybirdConfigured = 
  !!process.env.TINYBIRD_TOKEN && 
  process.env.TINYBIRD_TOKEN !== "placeholder-token-for-local-dev";

// Only initialize Tinybird if properly configured
const tb = isTinybirdConfigured
  ? new Tinybird({
      token: process.env.TINYBIRD_TOKEN!,
    })
  : null;

// Helper to check if Tinybird is available
export const isTinybirdAvailable = () => isTinybirdConfigured;

// Wrapper function that returns no-op pipe if Tinybird is not configured
const createPipe = <TParams extends z.ZodType, TData extends z.ZodType>(config: {
  pipe: string;
  parameters: TParams;
  data: TData;
}) => {
  if (!tb) {
    // Return a no-op function that logs and returns empty data
    return async (params: z.infer<TParams>) => {
      console.log(
        `[Analytics] Tinybird not configured, skipping ${config.pipe} query`,
        params
      );
      return { data: [] };
    };
  }
  return tb.buildPipe(config);
};

export const getTotalAvgPageDuration = createPipe({
  pipe: "get_total_average_page_duration",
  parameters: z.object({
    documentId: z.string(),
    excludedLinkIds: z.string().describe("Comma separated linkIds"),
    excludedViewIds: z.string().describe("Comma separated viewIds"),
    since: z.number(),
  }),
  data: z.object({
    versionNumber: z.number().int(),
    pageNumber: z.string(),
    avg_duration: z.number(),
  }),
});

export const getViewPageDuration = createPipe({
  pipe: "get_page_duration_per_view",
  parameters: z.object({
    documentId: z.string(),
    viewId: z.string(),
    since: z.number(),
    until: z.number().optional(),
  }),
  data: z.object({
    pageNumber: z.string(),
    sum_duration: z.number(),
  }),
});

export const getTotalDocumentDuration = createPipe({
  pipe: "get_total_document_duration",
  parameters: z.object({
    documentId: z.string(),
    excludedLinkIds: z.string().describe("Comma separated linkIds"),
    excludedViewIds: z.string().describe("Comma separated viewIds"),
    since: z.number(),
    until: z.number().optional(),
  }),
  data: z.object({
    sum_duration: z.number(),
  }),
});

export const getTotalLinkDuration = createPipe({
  pipe: "get_total_link_duration",
  parameters: z.object({
    linkId: z.string(),
    documentId: z.string(),
    excludedViewIds: z.string().describe("Comma separated viewIds"),
    since: z.number(),
    until: z.number().optional(),
  }),
  data: z.object({
    sum_duration: z.number(),
    view_count: z.number(),
  }),
});

export const getTotalViewerDuration = createPipe({
  pipe: "get_total_viewer_duration",
  parameters: z.object({
    viewIds: z.string().describe("Comma separated viewIds"),
    since: z.number(),
    until: z.number().optional(),
  }),
  data: z.object({
    sum_duration: z.number(),
  }),
});

export const getViewUserAgent_v2 = createPipe({
  pipe: "get_useragent_per_view",
  parameters: z.object({
    documentId: z.string(),
    viewId: z.string(),
    since: z.number(),
  }),
  data: z.object({
    country: z.string(),
    city: z.string(),
    browser: z.string(),
    os: z.string(),
    device: z.string(),
  }),
});

export const getViewUserAgent = createPipe({
  pipe: "get_useragent_per_view",
  parameters: z.object({
    viewId: z.string(),
  }),
  data: z.object({
    country: z.string(),
    city: z.string(),
    browser: z.string(),
    os: z.string(),
    device: z.string(),
  }),
});

export const getTotalDataroomDuration = createPipe({
  pipe: "get_total_dataroom_duration",
  parameters: z.object({
    dataroomId: z.string(),
    excludedLinkIds: z.array(z.string()),
    excludedViewIds: z.array(z.string()),
    since: z.number(),
  }),
  data: z.object({
    viewId: z.string(),
    sum_duration: z.number(),
  }),
});

export const getDocumentDurationPerViewer = createPipe({
  pipe: "get_document_duration_per_viewer",
  parameters: z.object({
    documentId: z.string(),
    viewIds: z.string().describe("Comma separated viewIds"),
  }),
  data: z.object({
    sum_duration: z.number(),
  }),
});

export const getWebhookEvents = createPipe({
  pipe: "get_webhook_events",
  parameters: z.object({
    webhookId: z.string(),
  }),
  data: z.object({
    event_id: z.string(),
    webhook_id: z.string(),
    message_id: z.string(), // QStash message ID
    event: z.enum(WEBHOOK_TRIGGERS),
    url: z.string(),
    http_status: z.number(),
    request_body: z.string(),
    response_body: z.string(),
    timestamp: z.string(),
  }),
});

export const getVideoEventsByDocument = createPipe({
  pipe: "get_video_events_by_document",
  parameters: z.object({
    document_id: z.string(),
  }),
  data: z.object({
    timestamp: z.string(),
    view_id: z.string(),
    event_type: z.enum(VIDEO_EVENT_TYPES),
    start_time: z.number(),
    end_time: z.number(),
    playback_rate: z.number(),
    volume: z.number(),
    is_muted: z.number(),
    is_focused: z.number(),
    is_fullscreen: z.number(),
  }),
});

export const getVideoEventsByView = createPipe({
  pipe: "get_video_events_by_view",
  parameters: z.object({
    document_id: z.string(),
    view_id: z.string(),
  }),
  data: z.object({
    timestamp: z.string(),
    event_type: z.string(),
    start_time: z.number(),
    end_time: z.number(),
  }),
});

export const getClickEventsByView = createPipe({
  pipe: "get_click_events_by_view",
  parameters: z.object({
    document_id: z.string(),
    view_id: z.string(),
  }),
  data: z.object({
    timestamp: z.string(),
    document_id: z.string(),
    dataroom_id: z.string().nullable(),
    view_id: z.string(),
    page_number: z.string(),
    version_number: z.number(),
    href: z.string(),
  }),
});
