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

async function fetchFromWebhook(entity, clientId) {
  const url = `${WEBHOOK_URL}?entity=${entity}&clientId=${clientId}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Webhook error: ${response.status}`);
  return response.json();
}

// ── Public API ───────────────────────────────────────────────────────

// Cache so the CSV is only fetched once per session
let _campaignsCache = null;
let _flowsCache     = null;

/**
 * Load campaigns, optionally filtered by clientId.
 * @param {string} [clientId]  Pass a client ID to filter, omit (or "all") for all clients.
 */
export async function getCampaigns(clientId) {
  if (DATA_SOURCE === "webhook") return fetchFromWebhook("campaigns", clientId);

  if (!_campaignsCache) _campaignsCache = await campaignsFromCsv();

  return clientId && clientId !== "all"
    ? _campaignsCache.filter((c) => c.clientId === clientId)
    : _campaignsCache;
}

/**
 * Load flows, optionally filtered by clientId.
 * @param {string} [clientId]  Pass a client ID to filter, omit (or "all") for all clients.
 */
export async function getFlows(clientId) {
  if (DATA_SOURCE === "webhook") return fetchFromWebhook("flows", clientId);

  if (!_flowsCache) _flowsCache = await flowsFromCsv();

  return clientId && clientId !== "all"
    ? _flowsCache.filter((f) => f.clientId === clientId)
    : _flowsCache;
}

/** Clear the in-memory cache (useful if files are reloaded). */
export function clearCache() {
  _campaignsCache = null;
  _flowsCache     = null;
}
