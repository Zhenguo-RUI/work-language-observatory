# Reading experience / 阅读与运营闭环

## Reader / 用户端

- Completed readings are saved automatically in this browser, with no account required. IndexedDB stores the full original and result; localStorage is a fallback. Fallback records remain visible if IndexedDB later recovers. Storage failure is reported rather than silently deleting older readings.
- “My readings” supports reopening, search and deleting a local copy. Site-data deletion removes local records. Other devices and browsers do not share this history; optional verified cloud history remains separate.
- PDF and Markdown use one content representation. The PDF is generated on-device, contains selectable Chinese/English text and paginates long JDs. A licensed Noto font loads only on explicit PDF export. There is no third-party PDF conversion service.
- Company context distinguishes employer, client and platform. A reviewed directory currently covers Tencent, Xiaomi, ByteDance, Douyin E-commerce and Ocean Engine. Official profiles are background, not verification of a vacancy or employer practices. Dated reviewed references are labelled when a live fetch is unavailable. Unknown firms use explicitly JD-based context. No general company search service is claimed.
- Streaming events show actual acceptance, context, generation, checking/repair and preparation stages. Elapsed time is real. The initial 1–2 minute estimate is a rough model-request estimate, not a countdown; after three completed similar readings in this browser it uses local timing samples. No fabricated completion percentage is shown.

已完成的分析自动保留在当前浏览器；不登录也能在第二页找回。PDF在本机生成，与Markdown共用内容。公司资料明确区分雇主、平台和客户；未知公司不补造介绍。进度来自实际服务端阶段，时间仅为估计。

## Feedback and operations / 反馈与运营端

Anonymous visitors can rate any result and add a bounded comment/category. A stable random reference updates a rating rather than counting repeated clicks as distinct votes. Vote changes preserve an already submitted comment. Ratings and comments are sent to the project operator, not published. Attaching the JD and analysis for review is a separate unchecked choice.

The protected `/ops` workspace shows:

- Thirty-day page/action/download counts and ratings;
- Accepted, completed, fallback, failed and reused analysis runs;
- Median server completion time and recent run outcomes;
- Recent ratings/comments and the existing revision/review queue.

An evidence-draft fallback is not represented as a successful model analysis. Requests and views are not unique-user counts, and clicks or agreement are not satisfaction or expert accuracy. Historical events are not reconstructed or fabricated. Anonymous local histories are not bulk-uploaded to operations.

## Data and boundaries / 数据边界

`POST /api/usage/events` accepts a strict action allowlist and random event ID; it rejects JD text, company names, arbitrary events and personal-looking reading identifiers. `POST /api/usage/feedback` accepts an opaque reading reference, stable feedback ID, vote, category and optional comment. `POST /api/usage/share` requires `consent:true` and source-valid reading content. `GET /api/usage/summary` is owner-only.

Usage writes have independent hourly database limits and retry deduplication; they do not consume model API quotas. Event/run details are retained for 90 days; feedback for 180 days. Summary charts use a 30-day window. A rotating HMAC network fingerprint is used for quota counters, not stored in event rows. Submitted feedback text is rendered as text, not HTML.

Only voluntarily attached or authenticated saved analyses enter the review queue. Source export fixtures remain empty of private JDs, archived rows, CVs and essays. Deployment credentials remain server-only.
