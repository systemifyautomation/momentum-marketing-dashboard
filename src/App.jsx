import { useState, useMemo, useEffect } from "react";
import { BarChart2, LogOut, ChevronLeft, ChevronRight, Menu, LayoutGrid } from "lucide-react";
import DateRangePicker from "./components/DateRangePicker";
import NewClientModal from "./components/NewClientModal";
import LoginScreen, { getSession, clearSession } from "./components/LoginScreen";
import ClientOverviewTable from "./components/ClientOverviewTable";
import { getCampaigns, getFlows, getClients, clearCache, localDateStr, getAllRevenues, getScheduledCampaigns } from "./services/dataService";
import "./App.css";

// Default date range: month-to-date in UTC+9:30
const now0 = new Date();
const DEFAULT_END   = localDateStr(now0);
const DEFAULT_START = `${DEFAULT_END.slice(0, 7)}-01`; // first of current month

export default function App() {
  const [authed, setAuthed] = useState(() => Boolean(getSession()));
  const [clients, setClients] = useState([]);
  // All components for all clients — loaded once per date range
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [allFlowMessages, setAllFlowMessages] = useState([]);
  // Map<clientId, totalRevenue> — loaded once per date range
  const [allRevenues, setAllRevenues] = useState(new Map());
  const [scheduledCampaigns, setScheduledCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(DEFAULT_START);
  const [endDate, setEndDate]     = useState(DEFAULT_END);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load client list once on mount — default view is overview (activeClient stays null)
  useEffect(() => {
    getClients()
      .then(setClients)
      .catch((err) => console.error("Failed to load clients:", err));
    getScheduledCampaigns()
      .then(setScheduledCampaigns)
      .catch((err) => console.error("Failed to load scheduled campaigns:", err));
  }, []);

  // Load ALL components + ALL revenues in one pass whenever dates change
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCampaigns(startDate, endDate),
      getFlows(startDate, endDate),
      getAllRevenues(startDate, endDate),
    ])
      .then(([campaigns, flowMessages, revenues]) => {
        setAllCampaigns(campaigns);
        setAllFlowMessages(flowMessages);
        setAllRevenues(revenues);
      })
      .catch((err) => console.error("Failed to load data:", err))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

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
          <div className="nav-section-label">Overview</div>
          <button
            className="nav-item nav-item--active nav-item--overview"
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutGrid size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
            <div className="nav-item__info">
              <span className="nav-item__name">All Clients</span>
            </div>
          </button>
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
              <span className="topbar__greeting">All Clients</span>
              <span className="topbar__sub">{clients.length} active accounts</span>
            </div>
          </div>
          <div className="topbar__right">
            <button
              className="btn-new-client"
              onClick={() => setShowNewClientModal(true)}
            >
              + New Client
            </button>
            <DateRangePicker
              start={startDate}
              end={endDate}
              onApply={(s, e) => { clearCache(); setStartDate(s); setEndDate(e); }}
            />
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

          {/* ── All-Client Overview ── */}
          <ClientOverviewTable
            clients={clients}
            allCampaigns={allCampaigns}
            allFlowMessages={allFlowMessages}
            allRevenues={allRevenues}
            scheduledCampaigns={scheduledCampaigns}
            loading={loading}
            startDate={startDate}
            endDate={endDate}
          />

        </div>
      </main>

      {showNewClientModal && <NewClientModal onClose={() => setShowNewClientModal(false)} />}
    </div>
  );
}
