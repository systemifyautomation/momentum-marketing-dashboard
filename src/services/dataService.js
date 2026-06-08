/**
 * dataService.js
 *
 * Single data layer for the dashboard.
 * All data is fetched from the n8n webhooks defined in .env.
 *
 * Key design:
 *  - getComponents(startDate, endDate)  → { campaigns, flowMessages }  for ALL clients
 *  - getAllRevenues(startDate, endDate) → Map<clientId, totalRevenue>   for ALL clients
 *  - getClients()                       → client list with attribution_goal per client
 */

// ── Webhook URLs ─────────────────────────────────────────────────────
const CAMPAIGNS_WEBHOOK_URL            = import.meta.env.VITE_CAMPAIGNS_WEBHOOK_URL            ?? "";
const FLOWS_WEBHOOK_URL                = import.meta.env.VITE_FLOWS_WEBHOOK_URL                ?? "";
const REVENUE_WEBHOOK_URL              = import.meta.env.VITE_REVENUE_WEBHOOK_URL              ?? "";
const CLIENTS_WEBHOOK_URL              = import.meta.env.VITE_CLIENTS_WEBHOOK_URL              ?? "";
const SCHEDULED_CAMPAIGNS_WEBHOOK_URL  = import.meta.env.VITE_SCHEDULED_CAMPAIGNS_WEBHOOK_URL  ?? "";
// ────────────────────────────────────────────────────────────────────

/** Format a YYYY-MM-DD string as ISO 8601 with UTC+9:30 offset. */
export function localDateStr(date) {
  const OFFSET_MS = (9 * 60 + 30) * 60 * 1000;
  const shifted = new Date(date.getTime() + OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Add one day to a YYYY-MM-DD string.
 * n8n uses "less-than" for end_date, so +1 makes the selected end date inclusive.
 */
function nextDayStr(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
}

function toIsoLocal(dateStr) {
  return `${dateStr}T00:00:00+09:30`;
}

/** Fetch with one automatic retry after 10 s on any network error or non-ok status. */
async function fetchWithRetry(url, options) {
  const attempt = () => fetch(url, options).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  });
  try {
    return await attempt();
  } catch (err) {
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    return attempt(); // let the error propagate if it fails again
  }
}

/** Normalise a rate value: "39.5%" or "39.5" → 39.5 · "0.395" → 39.5 */
function normaliseRate(value) {
  if (typeof value === "string" && value.includes("%")) {
    return +parseFloat(value).toFixed(4);
  }
  const n = parseFloat(value);
  if (isNaN(n)) return 0;
  return n <= 1 ? +(n * 100).toFixed(4) : +n.toFixed(4);
}

// ── Row mappers ──────────────────────────────────────────────────────

function mapCampaignRow(row) {
  const recip = row.recipients ?? row.total_recipients ?? 0;
  return {
    id:             String(row.campaign_id ?? row.id ?? ""),
    clientId:       String(row.client_id   ?? ""),
    clientName:     row.client_name        ?? "",
    name:           row.campaign_message_name ?? row.campaign_name ?? row.name ?? "—",
    channel:        row.send_channel ?? row.channel ?? "email",
    sentDate:       row.date ?? row.sent_date ?? row.send_time ?? "",
    sendWeekday:    row.send_weekday ?? "",
    status:         "Sent",
    tags:           row.tags ?? "",
    type:           row.tags ?? "—",
    subject:        row.subject ?? "",
    list:           row.list    ?? "",
    recipients:     recip,
    delivered:      row.successful_deliveries ?? recip,
    bounces:        row.bounces      ?? 0,
    bounceRate:     normaliseRate(row.bounce_rate      ?? 0),
    opens:          row.opens_unique  ?? row.unique_opens ?? 0,
    totalOpens:     row.total_opens   ?? 0,
    openRate:       normaliseRate(row.open_rate        ?? 0),
    clicks:         row.clicks_unique ?? row.unique_clicks ?? 0,
    totalClicks:    row.total_clicks  ?? 0,
    clickRate:      normaliseRate(row.click_rate       ?? 0),
    placedOrders:   row.conversions   ?? row.placed_orders ?? 0,
    conversionRate: normaliseRate(row.placed_order_rate ?? row.conversion_rate ?? 0),
    revenue:        row.conversion_value ?? row.revenue ?? 0,
    revenuePerRecipient: row.revenue_per_recipient ?? 0,
    unsubscribes:   row.unsubscribes  ?? 0,
    spamComplaints: row.spam_complaints ?? 0,
    spamComplaintsRate: normaliseRate(row.spam_complaints_rate ?? 0),
  };
}

function mapFlowRow(row) {
  const recip = row.recipients ?? row.delivered ?? 0;
  return {
    id:                  String(row.flow_message_id ?? row.id ?? ""),
    flowId:              String(row.flow_id         ?? ""),
    clientId:            String(row.client_id       ?? ""),
    clientName:          row.client_name            ?? "",
    name:                row.flow_name ?? row.name  ?? "—",
    messageName:         row.flow_message_name ?? row.name ?? "—",
    tags:                row.tags   ?? "",
    type:                row.tags   ?? "—",
    channel:             row.send_channel ?? row.flow_message_channel ?? row.channel ?? "email",
    status:              row.status ?? "live",
    delivered:           row.delivered ?? recip,
    bounceRate:          normaliseRate(row.bounce_rate  ?? 0),
    opens:               row.opens_unique ?? row.unique_opens ?? 0,
    openRate:            normaliseRate(row.open_rate    ?? 0),
    clicks:              row.clicks_unique ?? row.unique_clicks ?? 0,
    clickRate:           normaliseRate(row.click_rate   ?? 0),
    placedOrders:        row.conversions  ?? row.placed_orders ?? 0,
    conversionRate:      normaliseRate(row.placed_order_rate ?? row.conversion_rate ?? 0),
    revenue:             row.conversion_value ?? row.revenue ?? 0,
    revenuePerRecipient: row.revenue_per_recipient ?? 0,
    unsubRate:           normaliseRate(row.unsub_rate   ?? 0),
    complaintRate:       normaliseRate(row.complaint_rate ?? 0),
  };
}

// ── Campaigns webhook ────────────────────────────────────────────────

const _campaignsCache = new Map();

/** Fetch ALL campaigns for ALL clients for the given date range. */
async function campaignsFromWebhook(startDate, endDate) {
  const res = await fetchWithRetry(CAMPAIGNS_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      start_date: toIsoLocal(startDate),
      end_date:   toIsoLocal(endDate),
    }),
  });
  const raw = await res.json();
  return (Array.isArray(raw) ? raw : []).map(mapCampaignRow);
}

/** Public: all campaigns for all clients, cached by date range. */
export async function getCampaigns(startDate, endDate) {
  const key = `${startDate}|${endDate}`;
  if (!_campaignsCache.has(key)) {
    _campaignsCache.set(key, await campaignsFromWebhook(startDate, nextDayStr(endDate)));
  }
  return _campaignsCache.get(key);
}

// ── Flows webhook ────────────────────────────────────────────────────

const _flowsCache = new Map();

/** Fetch ALL flow messages for ALL clients for the given date range. */
async function flowsFromWebhook(startDate, endDate) {
  const res = await fetchWithRetry(FLOWS_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      start_date: toIsoLocal(startDate),
      end_date:   toIsoLocal(endDate),
    }),
  });
  const raw = await res.json();
  return (Array.isArray(raw) ? raw : []).map(mapFlowRow);
}

/** Public: all flow messages for all clients, cached by date range. */
export async function getFlows(startDate, endDate) {
  const key = `${startDate}|${endDate}`;
  if (!_flowsCache.has(key)) {
    _flowsCache.set(key, await flowsFromWebhook(startDate, nextDayStr(endDate)));
  }
  return _flowsCache.get(key);
}

// ── Revenue webhook ──────────────────────────────────────────────────

const _revenueCache = new Map();

/**
 * Fetch total store revenue for ALL clients from the revenue webhook.
 * The webhook no longer takes a client_id — it returns all clients' revenues.
 *
 * Returns Map<clientId (string), totalRevenue (number | null)>
 */
async function allRevenuesFromWebhook(startDate, endDate) {
  const res = await fetchWithRetry(REVENUE_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      start_date: toIsoLocal(startDate),
      end_date:   toIsoLocal(nextDayStr(endDate)),
    }),
  });
  const data = await res.json();
  const rows = Array.isArray(data) ? data : [data];

  const map = new Map();
  for (const row of rows) {
    const clientId = String(row.client_id ?? "");
    if (clientId) map.set(clientId, row.total_revenue ?? null);
  }
  return map;
}

/**
 * Public: get a Map<clientId, totalRevenue> for all clients in the date range.
 * Cached by "startDate|endDate".
 */
export async function getAllRevenues(startDate, endDate) {
  const key = `${startDate}|${endDate}`;
  if (!_revenueCache.has(key)) {
    try {
      _revenueCache.set(key, await allRevenuesFromWebhook(startDate, endDate));
    } catch (err) {
      console.warn("getAllRevenues failed:", err.message);
      _revenueCache.set(key, new Map());
    }
  }
  return _revenueCache.get(key);
}

/** Clear all in-memory caches (call when date range changes). */
export function clearCache() {
  _campaignsCache.clear();
  _flowsCache.clear();
  _revenueCache.clear();
  _clientsCache = null;
}

// ── Scheduled campaigns webhook ───────────────────────────────────────

function mapScheduledCampaignRow(row) {
  // date may be a Unix ms timestamp (number) or a MM/dd/yyyy string
  let sentDate = null;
  if (row.date != null && row.date !== "") {
    const raw = row.date;
    if (typeof raw === "number" || /^\d{10,13}$/.test(String(raw))) {
      // Unix ms timestamp → YYYY-MM-DD (UTC)
      const d = new Date(Number(raw));
      sentDate = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    } else {
      // MM/dd/yyyy fallback
      const [mm, dd, yyyy] = String(raw).split("/");
      if (mm && dd && yyyy) sentDate = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
  }
  return {
    id:          String(row.client_id ?? "") + "_" + (row.date ?? "") + "_" + (row.subject_line ?? ""),
    clientId:    String(row.client_id    ?? ""),
    subjectLine: row.subject_line ?? "—",
    emailTopic:  row.email_topic  ?? "—",
    teamMembers: row.team_members ?? "",
    completed:   String(row.completed  ?? "").toLowerCase() === "yes",
    scheduled:   String(row.scheduled  ?? "").toLowerCase() === "yes",
    sentDate,
  };
}

let _scheduledCampaignsCache = null;

export async function getScheduledCampaigns() {
  if (_scheduledCampaignsCache) return _scheduledCampaignsCache;
  try {
    const res = await fetchWithRetry(SCHEDULED_CAMPAIGNS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const raw = await res.json();
    _scheduledCampaignsCache = (Array.isArray(raw) ? raw : []).map(mapScheduledCampaignRow);
  } catch (err) {
    console.warn("getScheduledCampaigns failed:", err.message);
    _scheduledCampaignsCache = [];
  }
  return _scheduledCampaignsCache;
}

// ── Clients webhook ──────────────────────────────────────────────────

// Colour palette — assigned by index
const CLIENT_COLORS = [
  "#DB2777", // pink
  "#D97706", // amber
  "#059669", // emerald
  "#0EA5E9", // sky blue
  "#9333EA", // purple
  "#E11D48", // crimson
  "#0891B2", // teal
  "#F97316", // orange
  "#10B981", // green
  "#6366F1", // indigo
];

let _clientsCache = null;

/**
 * Load the client list from the n8n webhook.
 * Expects: [{ id, name, attribution_goal?, ... }, ...]
 * attribution_goal is the % target (e.g. 40 for 40%). Defaults to 40 if omitted.
 */
export async function getClients() {
  if (_clientsCache) return _clientsCache;

  try {
    const res = await fetchWithRetry(CLIENTS_WEBHOOK_URL);
    const raw = await res.json();

    _clientsCache = raw.map((c, i) => {
      // Normalise attribution_goal: accept 40, "40", "40%", or 0.40 (decimal fraction)
      let goal = parseFloat(String(c.attribution_goal ?? "").replace("%", ""));
      if (isNaN(goal) || goal <= 0) goal = 40;          // missing / invalid → default 40
      if (goal > 0 && goal < 1) goal = +(goal * 100).toFixed(2); // 0.40 → 40
      return {
        id:              String(c.id ?? c.client_id ?? i),
        name:            c.name ?? c.client_name ?? `Client ${i + 1}`,
        color:           CLIENT_COLORS[i % CLIENT_COLORS.length],
        attributionGoal: goal,
      };
    });
  } catch (err) {
    console.error("Failed to load clients from webhook:", err);
    _clientsCache = [];
  }

  return _clientsCache;
}
