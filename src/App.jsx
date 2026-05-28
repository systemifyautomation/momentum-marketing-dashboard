import { useState, useMemo, useEffect } from "react";
import { BarChart2, LogOut, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import RevenueOverview from "./components/RevenueOverview";
import NewClientModal from "./components/NewClientModal";
import LoginScreen, { getSession, clearSession } from "./components/LoginScreen";
import { getCampaigns, getFlows, getClients, getClientRevenue, clearCache, localDateStr } from "./services/dataService";
import "./App.css";

// Default date range: month-to-date in UTC+9:30
const now0 = new Date();
const DEFAULT_END   = localDateStr(now0);
const DEFAULT_START = `${DEFAULT_END.slice(0, 7)}-01`; // first of current month

export default function App() {
  const [authed, setAuthed] = useState(() => Boolean(getSession()));
  const [activeClient, setActiveClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [allFlowMessages, setAllFlowMessages] = useState([]);
  const [clientTotalRevenue, setClientTotalRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(DEFAULT_START);
  const [endDate, setEndDate]     = useState(DEFAULT_END);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load client list once on mount, then default to first client
  useEffect(() => {
    getClients()
      .then((clientList) => {
        setClients(clientList);
        if (clientList.length > 0) setActiveClient(clientList[0].id);
      })
      .catch((err) => console.error("Failed to load clients:", err));
  }, []);

  // Reload campaign + flow data when client or dates change
  useEffect(() => {
    if (!activeClient) return;
    setLoading(true);
    Promise.all([
      getCampaigns(activeClient, startDate, endDate),
      getFlows(activeClient, startDate, endDate),
      getClientRevenue(activeClient, startDate, endDate),
    ])
      .then(([campaigns, flowMessages, totalRev]) => {
        setAllCampaigns(campaigns);
        setAllFlowMessages(flowMessages);
        setClientTotalRevenue(totalRev);
      })
      .catch((err) => console.error("Failed to load data:", err))
      .finally(() => setLoading(false));
  }, [activeClient, startDate, endDate]);

  // Campaigns for the active client
  const filteredCampaigns = useMemo(
    () => activeClient ? allCampaigns.filter((c) => c.clientId === activeClient) : [],
    [allCampaigns, activeClient]
  );

  // Aggregate live flow messages by flow (group by flowId, sum metrics)
  const aggregatedFlows = useMemo(() => {
    const source = (activeClient
      ? allFlowMessages.filter((m) => m.clientId === activeClient)
      : []
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
    const liveMessages = (activeClient
      ? allFlowMessages.filter((m) => m.clientId === activeClient)
      : []
    ).filter((m) => m.status === "live");
    const emailRev =
      filteredCampaigns.filter((c) => c.channel?.toLowerCase() === "email").reduce((s, c) => s + c.revenue, 0) +
      liveMessages.filter((m) => m.channel?.toLowerCase() === "email").reduce((s, m) => s + m.revenue, 0);
    const smsRev =
      filteredCampaigns.filter((c) => c.channel?.toLowerCase() === "sms").reduce((s, c) => s + c.revenue, 0) +
      liveMessages.filter((m) => m.channel?.toLowerCase() === "sms").reduce((s, m) => s + m.revenue, 0);

    // Total store revenue from webhook — used for attributed %
    const totalRevenue = clientTotalRevenue;
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
  }, [filteredCampaigns, aggregatedFlows, allFlowMessages, activeClient, clientTotalRevenue]);

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

  const activeClientData = clients.find((c) => c.id === activeClient);

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  return (
    <div className="app">
      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`sidebar${sidebarCollapsed ? " sidebar--collapsed" : ""}${sidebarOpen ? " sidebar--open" : ""}`}>
        <div className="sidebar__brand">
          <div className="brand-logo">
            <svg viewBox="0 0 22 22" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
              <text x="11" y="17" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="16" fontWeight="800" fill="#ffffff">M</text>
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">Momentum</span>
            <span className="brand-sub">Marketing</span>
          </div>
          <button
            className="sidebar__toggle"
            onClick={() => { setSidebarOpen(false); setSidebarCollapsed((c) => !c); }}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className="sidebar__nav">
          <div className="nav-section-label">Clients</div>
          {clients.map((client) => (
            <button
              key={client.id}
              className={`nav-item ${activeClient === client.id ? "nav-item--active" : ""}`}
              onClick={() => { setActiveClient(client.id); setSidebarOpen(false); }}
              style={activeClient === client.id ? { borderColor: client.color, color: client.color, background: client.color + "15" } : {}}
            >
              <div className="nav-item__dot" style={{ background: client.color }} />
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
          <button
            className="btn-logout-sidebar"
            onClick={() => { clearSession(); setAuthed(false); }}
            title="Sign out"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main">
        {/* Header */}
        <header className="topbar">
          <div className="topbar__left">
            <button
              className="btn-menu"
              onClick={() => setSidebarOpen(true)}
              title="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="topbar__title">
              <span className="topbar__greeting">{activeClientData?.name}</span>
              <span className="topbar__sub">{filteredCampaigns.length} campaigns</span>
            </div>
          </div>
          <div className="topbar__right">
            <button
              className="btn-new-client"
              onClick={() => setShowNewClientModal(true)}
            >
              + New Client
            </button>
            <div className="topbar__period">
              <input
                type="date"
                className="date-input"
                value={startDate}
                max={endDate}
                onChange={(e) => { clearCache(); setStartDate(e.target.value); }}
              />
              <span className="date-sep">→</span>
              <input
                type="date"
                className="date-input"
                value={endDate}
                min={startDate}
                max={localDateStr(new Date())}
                onChange={(e) => { clearCache(); setEndDate(e.target.value); }}
              />
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

          {loading ? (
            <div className="dash-col">
              <div className="skeleton-loader">
                <div className="skeleton-loader__label">
                  <span className="skeleton-pulse skeleton-pulse--text" style={{ width: "160px" }} />
                  <span className="skeleton-loader__dot" />
                  <span className="skeleton-loader__dot" />
                  <span className="skeleton-loader__dot" />
                </div>
                <div className="skeleton-hero">
                  <div className="skeleton-hero__col">
                    <span className="skeleton-pulse skeleton-pulse--amount" />
                    <span className="skeleton-pulse skeleton-pulse--label" style={{ width: "90px" }} />
                  </div>
                  <div className="skeleton-divider" />
                  <div className="skeleton-hero__col">
                    <span className="skeleton-pulse skeleton-pulse--amount" />
                    <span className="skeleton-pulse skeleton-pulse--label" style={{ width: "130px" }} />
                  </div>
                </div>
                <div className="skeleton-breakdown">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="skeleton-breakdown__item">
                      <span className="skeleton-pulse skeleton-pulse--label" style={{ width: "60px" }} />
                      <span className="skeleton-pulse skeleton-pulse--amount" style={{ width: "80px" }} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="skeleton-lists">
                {["Campaigns", "Flows"].map((label) => (
                  <div key={label} className="rank-card">
                    <div className="rank-card__header">
                      <h3>Top {label}</h3>
                      <p>By attributed revenue</p>
                    </div>
                    <ol className="rank-list">
                      {[1,2,3].map((i) => (
                        <li key={i} className="rank-item">
                          <span className="rank-item__num">{i}</span>
                          <div className="rank-item__info" style={{ flex: 1 }}>
                            <span className="skeleton-pulse" style={{ width: `${140 - i * 20}px`, height: "12px", borderRadius: "4px", display: "block" }} />
                            <span className="skeleton-pulse" style={{ width: "70px", height: "10px", borderRadius: "4px", display: "block", marginTop: "5px" }} />
                          </div>
                          <span className="skeleton-pulse" style={{ width: "60px", height: "14px", borderRadius: "4px" }} />
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          ) : (

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
                  {topCampaigns.length === 0 ? (
                    <li className="rank-item rank-item--empty">No campaigns in the last 30 days.</li>
                  ) : topCampaigns.map((c, i) => {
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
                    <li className="rank-item rank-item--empty">No flows in the last 30 days.</li>
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

          )} {/* end loading conditional */}

        </div>
      </main>

      {showNewClientModal && <NewClientModal onClose={() => setShowNewClientModal(false)} />}
    </div>
  );
}
