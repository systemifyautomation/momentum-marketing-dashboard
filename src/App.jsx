import { useState, useMemo, useEffect } from "react";
import { BarChart2 } from "lucide-react";
import RevenueOverview from "./components/RevenueOverview";
import { ClientRevenueChart } from "./components/Charts";
import { getCampaigns, getFlows, getClients } from "./services/dataService";
import "./App.css";

// Actual store total revenue per client (hardcoded until API provides it)
const TOTAL_REVENUES = {
  "2": 531_130.42,  // Live 2 Live
  "3":  57_822.65,  // Steadfast
  "4": 102_663.75,  // CanineDrops
  "5":  99_428.86,  // Moments With Him
  "6": 130_170.56,  // Nuvary
  "7":  72_796.19,  // Oxyfuel
  "8":  99_507.43,  // Sauna Protocol
};

export default function App() {
  const [activeClient, setActiveClient] = useState("all");
  const [clients, setClients] = useState([{ id: "all", name: "All Clients", color: "#4F46E5" }]);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [allFlowMessages, setAllFlowMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getClients(), getCampaigns(), getFlows()])
      .then(([clientList, campaigns, flowMessages]) => {
        setClients(clientList);
        setAllCampaigns(campaigns);
        setAllFlowMessages(flowMessages);
      })
      .catch((err) => console.error("Failed to load data:", err))
      .finally(() => setLoading(false));
  }, []);

  // Campaigns filtered by active client
  const filteredCampaigns = useMemo(
    () => activeClient === "all" ? allCampaigns : allCampaigns.filter((c) => c.clientId === activeClient),
    [allCampaigns, activeClient]
  );

  // Aggregate live flow messages by flow (group by flowId, sum metrics)
  const aggregatedFlows = useMemo(() => {
    const source = (activeClient === "all"
      ? allFlowMessages
      : allFlowMessages.filter((m) => m.clientId === activeClient)
    ).filter((m) => m.status === "live");
    const flowMap = new Map();
    for (const msg of source) {
      if (!flowMap.has(msg.flowId)) {
        flowMap.set(msg.flowId, {
          id: msg.flowId, clientId: msg.clientId, clientName: msg.clientName,
          name: msg.name, type: msg.type,
          revenue: 0, delivered: 0, opens: 0, clicks: 0,
        });
      }
      const f = flowMap.get(msg.flowId);
      f.revenue += msg.revenue;
      f.delivered += msg.delivered;
      f.opens += msg.opens;
      f.clicks += msg.clicks;
    }
    return Array.from(flowMap.values());
  }, [allFlowMessages, activeClient]);

  // Revenue overview computed from real CSV data
  const revOverview = useMemo(() => {
    const campaignRev = filteredCampaigns.reduce((s, c) => s + c.revenue, 0);
    const flowRev = aggregatedFlows.reduce((s, f) => s + f.revenue, 0);
    const total = campaignRev + flowRev;
    const delivered = filteredCampaigns.reduce((s, c) => s + c.delivered, 0);

    // Channel split: email vs SMS across campaigns + live flow messages
    const liveMessages = (activeClient === "all"
      ? allFlowMessages
      : allFlowMessages.filter((m) => m.clientId === activeClient)
    ).filter((m) => m.status === "live");
    const emailRev =
      filteredCampaigns.filter((c) => c.channel?.toLowerCase() === "email").reduce((s, c) => s + c.revenue, 0) +
      liveMessages.filter((m) => m.channel?.toLowerCase() === "email").reduce((s, m) => s + m.revenue, 0);
    const smsRev =
      filteredCampaigns.filter((c) => c.channel?.toLowerCase() === "sms").reduce((s, c) => s + c.revenue, 0) +
      liveMessages.filter((m) => m.channel?.toLowerCase() === "sms").reduce((s, m) => s + m.revenue, 0);

    // Total store revenue (hardcoded) — used for attributed %
    const totalRevenue = activeClient === "all"
      ? Object.values(TOTAL_REVENUES).reduce((s, v) => s + v, 0)
      : (TOTAL_REVENUES[activeClient] ?? total);
    const attributedPct = totalRevenue > 0 ? +(total / totalRevenue * 100).toFixed(2) : null;

    return {
      totalRevenue,
      revenueTrend: null,
      attributedRevenue: total,
      attributedTrend: null,
      attributedPct,
      perRecipient: delivered > 0 ? total / delivered : 0,
      campaignRevenue: campaignRev,
      campaignPct: total > 0 ? +(campaignRev / total * 100).toFixed(2) : 0,
      flowRevenue: flowRev,
      flowPct: total > 0 ? +(flowRev / total * 100).toFixed(2) : 0,
      emailRevenue: emailRev,
      emailPct: total > 0 ? +(emailRev / total * 100).toFixed(2) : 0,
      smsRevenue: smsRev,
      smsPct: total > 0 ? +(smsRev / total * 100).toFixed(2) : 0,
    };
  }, [filteredCampaigns, aggregatedFlows, allFlowMessages, activeClient]);

  // Top 5 campaigns by revenue
  const topCampaigns = useMemo(
    () => [...filteredCampaigns].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    [filteredCampaigns]
  );

  // Top 5 flows by aggregated revenue
  const topFlows = useMemo(
    () => [...aggregatedFlows].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    [aggregatedFlows]
  );

  // Client comparison: total store revenue vs attributed (campaign + flow) revenue per client
  const clientComparison = useMemo(() => {
    return clients
      .filter((c) => c.id !== "all")
      .map((client) => {
        const campaignRev = allCampaigns.filter((c) => c.clientId === client.id).reduce((s, c) => s + c.revenue, 0);
        const flowRev = allFlowMessages.filter((m) => m.clientId === client.id && m.status === "live").reduce((s, m) => s + m.revenue, 0);
        const totalRev = TOTAL_REVENUES[client.id] ?? 0;
        const attrRev = campaignRev + flowRev;
        return {
          client: client.name,
          revenue: totalRev,
          attributedRevenue: attrRev,
          attributedPct: totalRev > 0 ? +(attrRev / totalRev * 100).toFixed(1) : 0,
        };
      })
      .filter((c) => c.revenue > 0 || c.attributedRevenue > 0);
  }, [allCampaigns, allFlowMessages]);

  const activeClientData = clients.find((c) => c.id === activeClient);

  return (
    <div className="app">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="brand-logo">
            <svg viewBox="0 0 22 22" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
              <text x="11" y="17" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="800" fill="#ffffff">M</text>
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">Momentum</span>
            <span className="brand-sub">Marketing</span>
          </div>
        </div>

        <nav className="sidebar__nav">
          <div className="nav-section-label">Clients</div>
          {clients.map((client) => (
            <button
              key={client.id}
              className={`nav-item ${activeClient === client.id ? "nav-item--active" : ""}`}
              onClick={() => setActiveClient(client.id)}
              style={activeClient === client.id ? { borderColor: client.color, color: client.color, background: client.color + "15" } : {}}
            >
              {client.id === "all" ? (
                <div className="nav-item__dot" style={{ background: "linear-gradient(135deg,#4F46E5,#0891B2)" }} />
              ) : (
                <div className="nav-item__dot" style={{ background: client.color }} />
              )}
              <div className="nav-item__info">
                <span className="nav-item__name">{client.name}</span>
                {client.industry && <span className="nav-item__industry">{client.industry}</span>}
              </div>
            </button>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar-status">
            <div className="status-dot" />
            <span>Klaviyo Connected</span>
          </div>
          <div className="sidebar-updated">Last synced: just now</div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main">
        {/* Header */}
        <header className="topbar">
          <div className="topbar__left">
            <div className="topbar__title">
              {activeClient === "all" ? (
                <>
                  <span className="topbar__greeting">All Clients Overview</span>
                  <span className="topbar__sub">{clients.length - 1} clients · {allCampaigns.length} campaigns total</span>
                </>
              ) : (
                <>
                  <span className="topbar__greeting">{activeClientData?.name}</span>
                  <span className="topbar__sub">{filteredCampaigns.length} campaigns</span>
                </>
              )}
            </div>
          </div>
          <div className="topbar__right">
            <a
              className="btn-new-client"
              href="https://momentummarketing.app.n8n.cloud/form/d608769e-0296-49cd-bd11-76aae470501e"
              target="_blank"
              rel="noreferrer"
            >
              + New Client
            </a>
            <div className="topbar__period">
              <span>Last 30 days</span>
            </div>
            <div className="topbar__klaviyo">
              <div className="klaviyo-badge">
                <BarChart2 size={12} />
                Klaviyo
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="dash-grid">

          {/* Left 2/3: Revenue overview + ranked lists */}
          <div className="dash-col">
            <RevenueOverview data={revOverview} />
            <div className="top-lists">

              {/* Top Campaigns */}
              <div className="rank-card">
                <div className="rank-card__header">
                  <h3>Top Campaigns</h3>
                  <p>By attributed revenue</p>
                </div>
                <ol className="rank-list">
                  {topCampaigns.map((c, i) => {
                    const cl = clients.find((x) => x.id === c.clientId);
                    return (
                      <li key={c.id} className="rank-item">
                        <span className="rank-item__num">{i + 1}</span>
                        <div className="rank-item__info">
                          <span className="rank-item__name">{c.name}</span>
                          <span className="rank-item__meta">
                            <span className="rank-item__dot" style={{ background: cl?.color }} />
                            {cl?.name}
                          </span>
                        </div>
                        <span className="rank-item__value">
                          ${Math.round(c.revenue).toLocaleString()}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Top Flows */}
              <div className="rank-card">
                <div className="rank-card__header">
                  <h3>Top Flows</h3>
                  <p>By attributed revenue</p>
                </div>
                <ol className="rank-list">
                  {topFlows.length === 0 ? (
                    <li className="rank-item rank-item--empty">No flows for this client.</li>
                  ) : topFlows.map((f, i) => {
                    const cl = clients.find((x) => x.id === f.clientId);
                    return (
                      <li key={f.id} className="rank-item">
                        <span className="rank-item__num">{i + 1}</span>
                        <div className="rank-item__info">
                          <span className="rank-item__name">{f.name}</span>
                          <span className="rank-item__meta">
                            <span className="rank-item__dot" style={{ background: cl?.color }} />
                            {cl?.clientName ?? cl?.name}
                          </span>
                        </div>
                        <span className="rank-item__value">
                          ${Math.round(f.revenue).toLocaleString()}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>

            </div>
          </div>

          {/* Right 1/3: Client revenue comparison */}
          <div className="dash-col">
            <div className="chart-card">
              <div className="chart-card__header">
                <div>
                  <h3>Client Revenue</h3>
                  <p>Campaign revenue vs flow revenue</p>
                </div>
              </div>
              <div className="chart-body">
                <ClientRevenueChart data={clientComparison} />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
