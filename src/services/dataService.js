/**
 * dataService.js
 *
 * Single data layer for the dashboard.
 * Switch DATA_SOURCE to "webhook" and set WEBHOOK_URL when ready
 * to move from CSV files to the n8n webhook.
 */

import Papa from "papaparse";

// ── Config ──────────────────────────────────────────────────────────
const DATA_SOURCE  = "csv";  // "csv" | "webhook"
const WEBHOOK_URL  = "";     // e.g. "https://your-n8n.cloud/webhook/abc123"

// Single combined CSV files (all clients in one export)
const CAMPAIGNS_CSV = "/data/campaigns.csv";
const FLOWS_CSV     = "/data/flows.csv";
// ────────────────────────────────────────────────────────────────────

// ── CSV helpers ─────────────────────────────────────────────────────

/** Fetch and parse a CSV file from public/data/. Returns array of row objects. */
async function parseCsv(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`CSV not found: ${path}`);
  const text = await response.text();
  const { data, errors } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  if (errors.length) console.warn("CSV parse warnings:", errors);
  return data;
}

/** Normalise a rate value.
 *  - "39.5%" or "39.5"  → 39.5  (already a percentage)
 *  - "0.395"            → 39.5  (decimal fraction)
 */
function normaliseRate(value) {
  if (typeof value === "string" && value.includes("%")) {
    return +parseFloat(value).toFixed(4);   // strip %, value is already a %
  }
  const n = parseFloat(value);
  if (isNaN(n)) return 0;
  return n <= 1 ? +(n * 100).toFixed(4) : +n.toFixed(4);
}

// ── CSV readers ─────────────────────────────────────────────────────

/** Parse the combined campaigns.csv and map to the app's campaign shape. */
async function campaignsFromCsv() {
  const rows = await parseCsv(CAMPAIGNS_CSV);

  return rows.map((row) => ({
    id:                   String(row["Campaign ID"] ?? ""),
    clientId:             String(row["Client ID"]   ?? ""),
    clientName:           row["Client Name"]        ?? "",
    name:                 row["Campaign Name"]      ?? "—",
    tags:                 row["Tags"]               ?? "",
    type:                 row["Tags"]               ?? "—",   // Tags = campaign type in Klaviyo
    subject:              row["Subject"]            ?? "",
    list:                 row["List"]               ?? "",
    channel:              row["Campaign Channel"]   ?? "email",
    sentDate:             row["Send Time"]          ?? "",    // full datetime string
    sendWeekday:          row["Send Weekday"]       ?? "",
    status:               "Sent",                            // exports only contain sent campaigns
    recipients:           row["Total Recipients"]   ?? 0,
    delivered:            row["Successful Deliveries"] ?? 0,
    bounces:              row["Bounces"]            ?? 0,
    bounceRate:           normaliseRate(row["Bounce Rate"]          ?? 0),
    opens:                row["Unique Opens"]       ?? 0,
    totalOpens:           row["Total Opens"]        ?? 0,
    openRate:             normaliseRate(row["Open Rate"]            ?? 0),
    clicks:               row["Unique Clicks"]      ?? 0,
    totalClicks:          row["Total Clicks"]       ?? 0,
    clickRate:            normaliseRate(row["Click Rate"]           ?? 0),
    placedOrders:         row["Unique Placed Order"] ?? 0,
    conversionRate:       normaliseRate(row["Placed Order Rate"]    ?? 0),
    revenue:              row["Revenue"]            ?? 0,
    unsubscribes:         row["Unsubscribes"]       ?? 0,
    spamComplaints:       row["Spam Complaints"]    ?? 0,
    spamComplaintsRate:   normaliseRate(row["Spam Complaints Rate"] ?? 0),
  }));
}

/** Parse the combined flows.csv and map to the app's flow shape.
 *  Each row is a flow message. The service exposes raw message rows;
 *  callers can aggregate by flowId if needed. */
async function flowsFromCsv() {
  const rows = await parseCsv(FLOWS_CSV);

  return rows.map((row) => ({
    // Identity
    id:                   String(row["Flow Message ID"] ?? ""),
    flowId:               String(row["Flow ID"]         ?? ""),
    clientId:             String(row["Client ID"]       ?? ""),
    clientName:           row["Client Name"]            ?? "",
    // Names
    name:                 row["Flow Name"]              ?? "—",
    messageName:          row["Flow Message Name"]      ?? "—",
    tags:                 row["Tags"]                   ?? "",
    type:                 row["Tags"]                   ?? "—",   // Tags = flow type in Klaviyo
    channel:              row["Flow Message Channel"]   ?? "email",
    status:               row["Status"]                 ?? "—",
    // Delivery
    delivered:            row["Delivered"]              ?? 0,
    bounceRate:           normaliseRate(row["Bounce Rate"]          ?? 0),
    // Engagement
    opens:                row["Unique Opens"]           ?? 0,
    openRate:             normaliseRate(row["Open Rate"]            ?? 0),
    clicks:               row["Unique Clicks"]          ?? 0,
    clickRate:            normaliseRate(row["Click Rate"]           ?? 0),
    // Conversions
    placedOrders:         row["Placed Order"]           ?? 0,
    conversionRate:       normaliseRate(row["Placed Order Rate"]    ?? 0),
    // Revenue
    revenue:              row["Revenue"]                ?? 0,
    revenuePerRecipient:  row["Revenue per Recipient"]  ?? 0,
    // Health
    unsubRate:            normaliseRate(row["Unsub Rate"]           ?? 0),
    complaintRate:        normaliseRate(row["Complaint Rate"]       ?? 0),
  }));
}

// ── Webhook reader ───────────────────────────────────────────────────

const CAMPAIGNS_WEBHOOK_URL = import.meta.env.VITE_CAMPAIGNS_WEBHOOK_URL ?? "";
const FLOWS_WEBHOOK_URL     = import.meta.env.VITE_FLOWS_WEBHOOK_URL     ?? "";

/** Format a YYYY-MM-DD string as ISO 8601 with UTC+9:30 offset. */
function toIsoLocal(dateStr) {
  return `${dateStr}T00:00:00+09:30`;
}

/** Fetch campaigns from n8n via POST with a client and date range. */
async function campaignsFromWebhook(clientId, startDate, endDate) {
  const res = await fetch(CAMPAIGNS_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id:  clientId,
      start_date: toIsoLocal(startDate),
      end_date:   toIsoLocal(endDate),
    }),
  });
  if (!res.ok) throw new Error(`Campaigns webhook error: ${res.status}`);
  const raw = await res.json();

  return raw.map((row) => {
    const recip = row.recipients ?? 0;
    return {
      id:             String(row.campaign_id ?? ""),
      clientId:       clientId,
      clientName:     "",
      name:           row.campaign_message_name ?? row.campaign_name ?? row.campaign_id ?? "—",
      channel:        row.send_channel  ?? "email",
      sentDate:       row.date          ?? "",
      status:         "Sent",
      recipients:     recip,
      delivered:      recip,
      bounces:        0,
      bounceRate:     0,
      opens:          row.opens_unique  ?? 0,
      openRate:       +(( row.open_rate   ?? 0) * 100).toFixed(2),
      clicks:         row.clicks_unique ?? 0,
      clickRate:      +((row.click_rate  ?? 0) * 100).toFixed(2),
      placedOrders:   row.conversions   ?? 0,
      conversionRate: recip > 0 ? +((row.conversions ?? 0) / recip * 100).toFixed(2) : 0,
      revenue:        row.conversion_value      ?? 0,
      revenuePerRecipient: row.revenue_per_recipient ?? 0,
      unsubscribes:   0,
      tags: "", type: "—", subject: "", list: "", sendWeekday: "",
      totalOpens: 0, totalClicks: 0, spamComplaints: 0, spamComplaintsRate: 0,
    };
  });
}

/** Fetch flows from n8n via POST with a client and date range. */
async function flowsFromWebhook(clientId, startDate, endDate) {
  const res = await fetch(FLOWS_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id:  clientId,
      start_date: toIsoLocal(startDate),
      end_date:   toIsoLocal(endDate),
    }),
  });
  if (!res.ok) throw new Error(`Flows webhook error: ${res.status}`);
  const raw = await res.json();

  return raw.map((row) => {
    const recip = row.recipients ?? 0;
    return {
      id:                  String(row.flow_message_id ?? row.flow_id ?? ""),
      flowId:              String(row.flow_id         ?? ""),
      clientId:            clientId,
      clientName:          "",
      name:                row.flow_message_name ?? row.flow_name ?? row.flow_id ?? "—",
      messageName:         row.flow_message_name ?? row.flow_name ?? row.flow_id ?? "—",
      channel:             row.send_channel ?? "email",
      status:              "live",
      tags: "", type: "—",
      recipients:          recip,
      delivered:           recip,
      bounces:             0,
      bounceRate:          0,
      opens:               row.opens_unique  ?? 0,
      openRate:            +((row.open_rate  ?? 0) * 100).toFixed(2),
      clicks:              row.clicks_unique ?? 0,
      clickRate:           +((row.click_rate ?? 0) * 100).toFixed(2),
      placedOrders:        row.conversions   ?? 0,
      conversionRate:      recip > 0 ? +((row.conversions ?? 0) / recip * 100).toFixed(2) : 0,
      revenue:             row.conversion_value      ?? 0,
      revenuePerRecipient: row.revenue_per_recipient ?? 0,
      unsubscribes:        0,
      unsubRate: 0, complaintRate: 0,
    };
  });
}

async function fetchFromWebhook(entity, clientId) {
  const url = `${WEBHOOK_URL}?entity=${entity}&clientId=${clientId}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Webhook error: ${response.status}`);
  return response.json();
}

// ── Public API ───────────────────────────────────────────────────────

// Cache keyed by "startDate|endDate" so different ranges are stored separately
const _campaignsCache = new Map();
const _flowsCache     = new Map();

/** Format a Date as YYYY-MM-DD in UTC+9:30 (Adelaide / Darwin time). */
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
 * n8n uses "less-than" for end_date, so we add 1 day to make the
 * user-selected end date inclusive.
 */
function nextDayStr(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
}

/**
 * Load campaigns for the given client and date range from the n8n webhook.
 * Dates are YYYY-MM-DD strings in UTC+9:30. End date is made exclusive (+1 day)
 * to satisfy n8n's "less-than" operator while keeping the selected day inclusive.
 */
export async function getCampaigns(clientId, startDate, endDate) {
  const key = `${clientId}|${startDate}|${endDate}`;
  if (!_campaignsCache.has(key)) {
    _campaignsCache.set(key, await campaignsFromWebhook(clientId, startDate, nextDayStr(endDate)));
  }
  return _campaignsCache.get(key);
}

/**
 * Load flows for the given client and date range from the n8n webhook.
 */
export async function getFlows(clientId, startDate, endDate) {
  const key = `${clientId}|${startDate}|${endDate}`;
  if (!_flowsCache.has(key)) {
    _flowsCache.set(key, await flowsFromWebhook(clientId, startDate, nextDayStr(endDate)));
  }
  return _flowsCache.get(key);
}

/** Clear the in-memory cache (call when date range changes). */
export function clearCache() {
  _campaignsCache.clear();
  _flowsCache.clear();
  _revenueCache.clear();
}

// ── Client Revenue ───────────────────────────────────────────────────

const REVENUE_WEBHOOK_URL = import.meta.env.VITE_REVENUE_WEBHOOK_URL ?? "";
const _revenueCache = new Map();

/**
 * Fetch the total store revenue for a client from the n8n webhook.
 * Returns the numeric total_revenue value, or null if unavailable.
 */
export async function getClientRevenue(clientId, startDate, endDate) {
  const key = `${clientId}|${startDate}|${endDate}`;
  if (!_revenueCache.has(key)) {
    try {
      const res = await fetch(REVENUE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id:  clientId,
          start_date: toIsoLocal(startDate),
          end_date:   toIsoLocal(nextDayStr(endDate)),
        }),
      });
      if (!res.ok) throw new Error(`Revenue webhook error: ${res.status}`);
      const data = await res.json();
      const row = Array.isArray(data) ? data[0] : data;
      _revenueCache.set(key, row?.total_revenue ?? null);
    } catch (err) {
      console.warn("getClientRevenue failed:", err.message);
      _revenueCache.set(key, null);
    }
  }
  return _revenueCache.get(key);
}

// ── Clients ──────────────────────────────────────────────────────────

const CLIENTS_WEBHOOK_URL = import.meta.env.VITE_CLIENTS_WEBHOOK_URL ?? "";

// Colour palette — assigned by index for clients returned by the webhook
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
 * Expects the webhook to return an array of objects with at least { id, name }.
 * Falls back to an empty list (plus "All Clients") if the fetch fails.
 */
export async function getClients() {
  if (_clientsCache) return _clientsCache;

  try {
    const res = await fetch(CLIENTS_WEBHOOK_URL);
    if (!res.ok) throw new Error(`Clients webhook error: ${res.status}`);
    const raw = await res.json();

    const clientList = raw.map((c, i) => ({
      id:    String(c.id ?? c.client_id ?? i),
      name:  c.name ?? c.client_name ?? `Client ${i + 1}`,
      color: CLIENT_COLORS[i % CLIENT_COLORS.length],
    }));

    _clientsCache = clientList;
  } catch (err) {
    console.error("Failed to load clients from webhook:", err);
    _clientsCache = [{ id: "all", name: "All Clients", color: "#4F46E5" }];
  }

  return _clientsCache;
}
