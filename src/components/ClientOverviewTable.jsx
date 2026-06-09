import { useState, useMemo, useRef, useEffect } from "react";
import { AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronRight, CalendarDays, ExternalLink } from "lucide-react";

// ── Stoplight logic ────────────────────────────────────────────────────
function getAttributionStatus(attributedPct, target) {
  if (attributedPct === null || attributedPct === undefined) {
    return { label: "No Data", textColor: "#A1A1AA", bg: "#F4F4F5" };
  }
  const gap = attributedPct - target;
  if (gap >= 0)    return { label: "Excellent",      textColor: "#16A34A", bg: "#F0FDF4" };
  if (gap >= -10)  return { label: "Moderate",       textColor: "#CA8A04", bg: "#FEFCE8" };
  if (gap >= -20)  return { label: "At Risk",        textColor: "#EA580C", bg: "#FFF7ED" };
  return           { label: "Urgent / Poor",   textColor: "#DC2626", bg: "#FEF2F2" };
}

// ── Campaign / Flow split ──────────────────────────────────────────────
function getSplitStatus(campaignPct) {
  if (campaignPct >= 50 && campaignPct <= 60) return { label: "Balanced",       color: "#059669", warning: false };
  if (campaignPct > 60)                       return { label: "Campaign-Heavy", color: "#D97706", warning: false };
  return                                             { label: "Flow-Heavy",     color: "#DC2626", warning: true  };
}

// ── Helpers ────────────────────────────────────────────────────────────
function fmtUSD(n) {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)     return "$" + Math.round(n).toLocaleString("en-US");
  return "$" + n.toFixed(2);
}

function fmtPct(n) {
  if (n === null || n === undefined) return "—";
  return n.toFixed(1) + "%";
}

function fmtDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

// ── Flow benchmark thresholds ───────────────────────────────────
const OPEN_BENCHMARK  = 30; // %
const CLICK_BENCHMARK =  4; // %

function getMetricUrgency(value, benchmark) {
  const gap = value - benchmark;
  if (gap >= 0)   return "good";
  if (gap >= -10) return "moderate";
  return "urgent";
}

// ── Sub-components ─────────────────────────────────────────────────────

function SplitBar({ campaignPct, flowPct }) {
  const status = getSplitStatus(campaignPct);
  const safeCamp = Math.max(0, Math.min(100, campaignPct));
  const safeFlow = Math.max(0, Math.min(100, flowPct));


  return (
    <div className="split-cell">
      <div className={`split-bar${status.warning ? " split-bar--warn" : ""}`}>
        <div className="split-bar__campaign" style={{ width: `${safeCamp}%` }} />
        <div className="split-bar__flow"     style={{ width: `${safeFlow}%` }} />
      </div>
      <div className="split-bar__legend">
        <span className="split-legend-camp">{Math.round(safeCamp)}%</span>
        <span className="split-legend-sep">·</span>
        <span className="split-legend-flow">{Math.round(safeFlow)}%</span>
        {status.warning && <AlertTriangle size={11} color="#DC2626" style={{ marginLeft: 4, flexShrink: 0 }} />}
      </div>
    </div>
  );
}

function StatusBadge({ label, textColor, bg }) {
  return (
    <span className="status-badge" style={{ color: textColor, background: bg }}>
      {label}
    </span>
  );
}

function RunwayBadge({ runwayStatus }) {
  if (runwayStatus === "green") {
    return (
      <span className="runway-badge runway-badge--ok">
        <CheckCircle2 size={11} />
        Scheduled
      </span>
    );
  }
  if (runwayStatus === "yellow") {
    return (
      <span className="runway-badge runway-badge--low">
        <AlertTriangle size={11} />
        Low Runway
      </span>
    );
  }
  return (
    <span className="runway-badge runway-badge--gap">
      <XCircle size={11} />
      No Runway
    </span>
  );
}

function AlertBadge({ count }) {
  if (count === 0) {
    return <span className="alert-badge alert-badge--clear">0</span>;
  }
  return (
    <span className="alert-badge alert-badge--warn">
      <AlertTriangle size={10} />
      {count}
    </span>
  );
}

function TargetGap({ gap }) {
  if (gap === null || gap === undefined) return <span className="muted">—</span>;
  const isPositive = gap >= 0;
  return (
    <span className="target-gap" style={{ color: isPositive ? "#059669" : "#DC2626" }}>
      {isPositive ? "+" : ""}{gap.toFixed(1)}%
    </span>
  );
}

// ── Flow message cell with conditional "more" toggle ──────────────────
function FlowMessageCell({ name }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current) {
      setOverflows(textRef.current.scrollWidth > textRef.current.clientWidth);
    }
  }, [name]);

  if (expanded) {
    return (
      <td className="flow-name-cell">
        <span className="flow-name-full">
          {name}
          <button className="flow-name-toggle" onClick={(e) => { e.stopPropagation(); setExpanded(false); }}>less</button>
        </span>
      </td>
    );
  }

  return (
    <td className="flow-name-cell">
      <span className="flow-name-truncated">
        <span className="flow-name-text" ref={textRef}>{name}</span>
        {overflows && (
          <button className="flow-name-toggle" onClick={(e) => { e.stopPropagation(); setExpanded(true); }}>more</button>
        )}
      </span>
    </td>
  );
}

// ── Expanded detail panel ─────────────────────────────────────────────
function ExpandedDetail({ client, scheduledCampaigns, allFlowMessages }) {
  // Scheduled campaigns for this client, sorted ascending by date
  const clientScheduled = useMemo(() => {
    return (scheduledCampaigns ?? [])
      .filter((c) => c.clientId === client.id);
  }, [scheduledCampaigns, client.id]);

  // Show each live flow message as its own row, flag underperformers
  const underperformingFlows = useMemo(() => {
    const liveMessages = allFlowMessages.filter(
      (m) => m.clientId === client.id && m.status === "live"
    );
    const result = [];
    for (const msg of liveMessages) {
      if ((msg.delivered ?? 0) === 0) continue;
      const openRate  = +((msg.openRate  ?? 0).toFixed(1));
      const clickRate = +((msg.clickRate ?? 0).toFixed(1));
      const openUrgency  = getMetricUrgency(openRate,  OPEN_BENCHMARK);
      const clickUrgency = getMetricUrgency(clickRate, CLICK_BENCHMARK);
      if (openUrgency === "good" && clickUrgency === "good") continue; // don't show passing messages
      const overallUrgency = (openUrgency === "urgent" || clickUrgency === "urgent") ? "urgent" : "moderate";
      const flowName    = (msg.name        && msg.name        !== "—") ? msg.name        : msg.flowId;
      const messageName = (msg.messageName && msg.messageName !== "—") ? msg.messageName : flowName;
      result.push({
        id: msg.id, flowId: msg.flowId, flowName, messageName,
        openRate, clickRate, openUrgency, clickUrgency, overallUrgency,
        klaviyoUrl: `https://www.klaviyo.com/flow/${msg.flowId}/edit`,
      });
    }
    return result.sort((a, b) => a.overallUrgency === b.overallUrgency ? 0 : a.overallUrgency === "urgent" ? -1 : 1);
  }, [allFlowMessages, client.id]);

  return (
    <div className="expand-detail">
      <div className="expand-cols">

        {/* ── Flow Action Queue ── */}
        <div className="expand-section expand-section--wide">
          <div className="expand-section__hdr">
            <span className="expand-section__title">
              <AlertTriangle size={13} />
              Flow Action Queue
            </span>
            <span className="expand-section__note">
              Open ≥ {OPEN_BENCHMARK}% &middot; Click ≥ {CLICK_BENCHMARK}%
            </span>
          </div>
          {underperformingFlows.length === 0 ? (
            <div className="expand-all-good">
              <CheckCircle2 size={14} color="#16A34A" />
              All flows are meeting benchmarks.
            </div>
          ) : (
            <div className="expand-table-scroll">
              <table className="expand-table">
                <colgroup>
                  <col style={{ width: "44%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "8%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Flow Message</th>
                    <th>Flow</th>
                    <th className="n">Open Rate</th>
                    <th className="n">Click Rate</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {underperformingFlows.map((f) => (
                    <tr key={f.id ?? f.flowId + f.messageName} className={`flow-row--${f.overallUrgency}`}>
                      <FlowMessageCell name={f.messageName} />
                      <td className="flow-name-cell">
                        <span title={f.flowName}>{f.flowName}</span>
                      </td>
                      <td className="n">
                        <span className={`metric-badge metric-badge--${f.openUrgency}`}>{f.openRate}%</span>
                      </td>
                      <td className="n">
                        <span className={`metric-badge metric-badge--${f.clickUrgency}`}>{f.clickRate}%</span>
                      </td>
                      <td className="expand-link-cell">
                        <div className="expand-link-wrap">
                          <a
                            href={f.klaviyoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="klaviyo-link klaviyo-link--icon"
                            title="Open in Klaviyo"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Scheduled Campaigns ── */}
        <div className="expand-section">
          <div className="expand-section__hdr">
            <span className="expand-section__title">
              <CalendarDays size={13} />
              Scheduled Campaigns
            </span>
            {clientScheduled.length > 0 && clientScheduled[0].teamMembers && (
              <div className="team-chips">
                {clientScheduled[0].teamMembers.split(/;\s*/).filter(Boolean).map((member) => {
                  const m = member.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
                  return m
                    ? <span key={member} className="team-chip"><span className="team-chip__name">{m[1].trim()}</span><span className="team-chip__role">{m[2].trim()}</span></span>
                    : <span key={member} className="team-chip"><span className="team-chip__name">{member.trim()}</span></span>;
                })}
              </div>
            )}
          </div>
          {clientScheduled.length === 0 ? (
            <div className="expand-placeholder">
              No scheduled campaigns found for this client.
            </div>
          ) : (
            <div className="expand-table-scroll">
              <table className="expand-table">
                <thead>
                  <tr>
                    <th>Subject Line</th>
                    <th>Topic</th>
                    <th className="n">Scheduled</th>
                    <th className="n">Completed</th>
                    <th className="n">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {clientScheduled.map((c) => (
                    <tr key={c.id}>
                      <td>{c.subjectLine}</td>
                      <td>{c.emailTopic}</td>
                      <td className="n"><span className={`status-pill status-pill--${c.scheduled ? "yes" : "no"}`}>{c.scheduled ? "Yes" : "No"}</span></td>
                      <td className="n"><span className={`status-pill status-pill--${c.completed ? "yes" : "no"}`}>{c.completed ? "Yes" : "No"}</span></td>
                      <td className="n expand-date">{fmtDate(c.sentDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Loading skeleton row ───────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="overview-row overview-row--skeleton">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i}><span className="skeleton-pulse" style={{ width: i === 0 ? "100px" : "60px", height: "14px", borderRadius: "4px", display: "inline-block" }} /></td>
      ))}
    </tr>
  );
}

// ── Main component ─────────────────────────────────────────────────────
export default function ClientOverviewTable({
  clients,
  allCampaigns,
  allFlowMessages,
  allRevenues,
  scheduledCampaigns,
  loading,
  startDate,
  endDate,
}) {
  const [expandedClientId, setExpandedClientId] = useState(null);

  function toggleExpand(id) {
    setExpandedClientId((prev) => (prev === id ? null : id));
  }
  // Compute per-client stats from the global campaign/flow/revenue data
  const overviewData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const map = {};
    for (const client of clients) {
      const campaigns    = allCampaigns.filter((c) => c.clientId === client.id);
      const flowMessages = allFlowMessages.filter((m) => m.clientId === client.id);
      const totalRev     = allRevenues.get(client.id) ?? null;

      const campaignRev = campaigns.reduce((s, c) => s + (c.revenue ?? 0), 0);

      // Aggregate live flow messages by flowId
      const liveMessages = flowMessages.filter((m) => m.status === "live");
      const flowMap = new Map();
      for (const msg of liveMessages) {
        if (!flowMap.has(msg.flowId)) flowMap.set(msg.flowId, { revenue: 0 });
        flowMap.get(msg.flowId).revenue += msg.revenue ?? 0;
      }
      const flowRev    = Array.from(flowMap.values()).reduce((s, f) => s + f.revenue, 0);
      const klaviyoRev = campaignRev + flowRev;

      const attributedPct = (totalRev != null && totalRev > 0)
        ? +(klaviyoRev / totalRev * 100).toFixed(2)
        : null;

      const campaignPct = klaviyoRev > 0 ? +(campaignRev / klaviyoRev * 100).toFixed(1) : 0;
      const flowPct     = klaviyoRev > 0 ? +(flowRev     / klaviyoRev * 100).toFixed(1) : 0;

      // Runway: based on furthest scheduled campaign date
      const clientScheduled = (scheduledCampaigns ?? []).filter((c) => c.clientId === client.id && c.sentDate);
      let runwayStatus = "red";
      if (clientScheduled.length > 0) {
        const furthest = clientScheduled.reduce((max, c) => {
          const d = new Date(c.sentDate);
          return d > max ? d : max;
        }, new Date(0));
        const daysOut = Math.round((furthest - today) / 86400000);
        runwayStatus = daysOut >= 14 ? "green" : daysOut >= 7 ? "yellow" : "red";
      }

      // Alert count: campaigns with open rate < 20% or click rate < 1%
      const alertCount = campaigns.filter(
        (c) => c.delivered > 0 && (c.openRate < 20 || (c.openRate > 0 && c.clickRate < 1))
      ).length;

      map[client.id] = { totalRevenue: totalRev, klaviyoRevenue: klaviyoRev, campaignRevenue: campaignRev,
        flowRevenue: flowRev, attributedPct, campaignPct, flowPct, runwayStatus, alertCount };
    }
    return map;
  }, [clients, allCampaigns, allFlowMessages, allRevenues, scheduledCampaigns]);

  return (
    <div className="overview-wrap">
      <div className="overview-header">
        <div>
          <h2 className="overview-title">All Clients</h2>
          <p className="overview-sub">{clients.length} active accounts · {startDate} → {endDate}</p>
        </div>
      </div>

      <div className="overview-table-scroll">
        <table className="overview-table">
          <thead>
            <tr>
              <th className="ot-client"><span style={{ paddingLeft: 20 }}>Client</span></th>
              <th className="ot-num">Store Revenue</th>
              <th className="ot-num">Klaviyo Rev</th>
              <th className="ot-num">Attribution %</th>
              <th className="ot-num">Target Gap</th>
              <th className="ot-split">Cam / Flow Split</th>
              <th className="ot-center">Alerts</th>
              <th className="ot-center">Runway</th>
              <th className="ot-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : [...clients].sort((a, b) => {
                  const pctA = overviewData[a.id]?.attributedPct ?? -1;
                  const pctB = overviewData[b.id]?.attributedPct ?? -1;
                  return pctB - pctA;
                }).map((client) => {
                  const d = overviewData[client.id];
                  const target = client.attributionGoal ?? 40;
                  const isExpanded = expandedClientId === client.id;

                  if (!d) {
                    return (
                      <tr key={client.id} className="overview-row" onClick={() => toggleExpand(client.id)}>
                        <td className="ot-client-cell">
                          <div className="ot-client-inner">
                            <span className="expand-chevron">
                              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </span>
                            <span className="client-dot" style={{ background: client.color }} />
                            <span className="client-name">{client.name}</span>
                          </div>
                        </td>
                        {Array.from({ length: 8 }).map((_, i) => (
                          <td key={i} className="muted-cell">—</td>
                        ))}
                      </tr>
                    );
                  }

                  const status = getAttributionStatus(d.attributedPct, target);
                  const gap = d.attributedPct !== null ? +(d.attributedPct - target).toFixed(2) : null;

                  return (
                    <>
                      <tr
                        key={client.id}
                        className={`overview-row${isExpanded ? " overview-row--expanded" : ""}`}
                        onClick={() => toggleExpand(client.id)}
                      >
                        {/* Client Name */}
                        <td className="ot-client-cell">
                          <div className="ot-client-inner">
                            <span className="expand-chevron">
                              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </span>
                            <span className="client-dot" style={{ background: client.color }} />
                            <span className="client-name">{client.name}</span>
                          </div>
                        </td>

                      {/* Total Store Revenue */}
                      <td className="ot-num-cell">{fmtUSD(d.totalRevenue)}</td>

                      {/* Klaviyo Attributed Revenue */}
                      <td className="ot-num-cell">{fmtUSD(d.klaviyoRevenue)}</td>

                      {/* Attribution % */}
                      <td className="ot-num-cell">
                        <span style={{ fontWeight: 600, color: status.textColor }}>
                          {fmtPct(d.attributedPct)}
                        </span>
                      </td>

                      {/* Target Gap */}
                      <td className="ot-num-cell">
                        <TargetGap gap={gap} />
                      </td>

                      {/* Campaign / Flow Split */}
                      <td className="ot-split-cell">
                        {d.klaviyoRevenue > 0
                          ? <SplitBar campaignPct={d.campaignPct} flowPct={d.flowPct} />
                          : <span className="muted">—</span>
                        }
                      </td>

                      {/* A/B Test / Underperforming Alert Count */}
                      <td className="ot-center-cell">
                        <AlertBadge count={d.alertCount} />
                      </td>

                      {/* Campaign Runway */}
                      <td className="ot-center-cell">
                        <RunwayBadge runwayStatus={d.runwayStatus} />
                      </td>

                      {/* Overall Status */}
                        <td className="ot-center-cell">
                          <StatusBadge {...status} />
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr className="overview-row--detail">
                          <td colSpan={9} className="expand-td">
                            <ExpandedDetail
                              client={client}
                              scheduledCampaigns={scheduledCampaigns}
                              allFlowMessages={allFlowMessages}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
          </tbody>
        </table>

        {!loading && clients.length === 0 && (
          <div className="overview-empty">
            <p>No clients found. Add a client to get started.</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="overview-legend">
        <div className="legend-group">
          <span className="legend-label">Attribution Status:</span>
          <span className="legend-item" style={{ color: "#16A34A" }}>● Excellent (≥ target)</span>
          <span className="legend-item" style={{ color: "#CA8A04" }}>● Moderate (&lt; 10pp below)</span>
          <span className="legend-item" style={{ color: "#EA580C" }}>● At Risk (10–20pp below)</span>
          <span className="legend-item" style={{ color: "#DC2626" }}>● Urgent / Poor (&gt; 20pp below)</span>
        </div>
        <div className="legend-group">
          <span className="legend-label">Split:</span>
          <span className="legend-item legend-cam">■ Campaigns</span>
          <span className="legend-item legend-flow">■ Flows</span>
        </div>
      </div>
    </div>
  );
}
