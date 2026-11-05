import {z} from "zod";

export const opaqueReadingId=z.string().regex(/^(?:(?:preview|local)-)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
export const usageEventSchema=z.object({
 eventId:z.string().uuid(),
 name:z.enum(["view_open","analyze_click","history_open","history_read","export_download","feedback_open","keyword_select","analysis_open"]),
 view:z.enum(["analyze","read","history","keywords","research","ops"]).optional(),
 format:z.enum(["markdown","pdf"]).optional(),
 readingId:opaqueReadingId.optional(),
}).strict();
export const usageFeedbackSchema=z.object({
 feedbackId:z.string().uuid(),readingId:opaqueReadingId,vote:z.enum(["up","down"]),
 category:z.enum(["accuracy","usefulness","clarity","context","other"]).default("other"),
 note:z.string().max(2000).optional(),
}).strict();
export type UsageEventInput=z.infer<typeof usageEventSchema>;
export type UsageFeedbackInput=z.infer<typeof usageFeedbackSchema>;
export type UsageRunOutcome="succeeded"|"fallback"|"failed"|"reused";
export type UsageSummary={
 windowDays:number;events:number;views:{name:string;count:number}[];
 eventsByName:{name:string;count:number}[];downloads:{format:string;count:number}[];
 ratings:{up:number;down:number;total:number};
 funnel:{accepted:number;succeeded:number;fallback:number;failed:number;reused:number;inProgress:number;medianDurationMs:number|null};
 recentRuns:{id:string;reading_id:string|null;status:string;engine:string;requested_model:boolean;duration_ms:number;error_code:string;created_at:string;updated_at:string}[];
 recentFeedback:{id:string;reading_id:string;vote:string;category:string;note:string;created_at:string;updated_at:string}[];
 retention:{eventsDays:number;feedbackDays:number};
};
