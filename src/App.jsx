import { useState, useMemo } from "react";
import { BarChart2, Mail, MousePointer2, DollarSign, Users, Zap, TrendingUp } from "lucide-react";
import MetricCard from "./components/MetricCard";
import CampaignsTable from "./components/CampaignsTable";
import ActivityFeed from "./components/ActivityFeed";
import { TrendLineChart, RevenueBarChart, ClientBarChart } from "./components/Charts";
import { clients, campaigns, monthlyTrends, clientComparison, recentActivity } from "./data/mockData";
import "./App.css";

export default function App() {
  const [activeClient, setActiveClient] = useState("all");
  const [activeChartTab, setActiveChartTab] = useState("performance");

  const filteredCampaigns = useMemo(
    () => (activeClient === "all" ? campaigns : campaigns.filter((c) => c.clientId === activeClient)),
    [activeClient]
  );

  const sentCampaigns = filteredCampaigns.filter((c) => c.status === "Sent");

  const kpis = useMemo(() => {
    const totalCampaigns = filteredCampaigns.length;
    const totalSent = sentCampaigns.reduce((s, c) => s + c.delivered, 0);
    const avgOpenRate = sentCampaigns.length
      ? (sentCampaigns.reduce((s, c) => s + c.openRate, 0) / sentCampaigns.length).toFixed(1)
      : 0;
    const avgClickRate = sentCampaigns.length
      ? (sentCampaigns.reduce((s, c) => s + c.clickRate, 0) / sentCampaigns.length).toFixed(1)
      : 0;
    const totalRevenue = sentCampaigns.reduce((s, c) => s + c.revenue, 0);
    const totalRecipients = sentCampaigns.reduce((s, c) => s + c.recipients, 0);
    return { totalCampaigns, totalSent, avgOpenRate, avgClickRate, totalRevenue, totalRecipients };
  }, [filteredCampaigns, sentCampaigns]);

  const activeClientData = clients.find((c) => c.id === activeClient);

  return (
    <div className="app">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="brand-logo">
            <Zap size={20} />
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
                <div className="nav-item__dot" style={{ background: "linear-gradient(135deg,#8B5CF6,#06B6D4)" }} />
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
                  <span className="topbar__sub">{clients.length - 1} clients · {campaigns.length} campaigns total</span>
                </>
              ) : (
                <>
                  <span className="topbar__greeting">{activeClientData?.name}</span>
                  <span className="topbar__sub">{activeClientData?.industry} · {filteredCampaigns.length} campaigns</span>
                </>
              )}
            </div>
          </div>
          <div className="topbar__right">
            <div className="topbar__period">
              <BarChart2 size={14} />
              <span>May 2026</span>
            </div>
            <div className="topbar__klaviyo">
              <div className="klaviyo-badge">
                <Zap size={12} />
                Klaviyo
              </div>
            </div>
          </div>
        </header>

        {/* KPI Cards */}
        <section className="kpi-grid">
          <MetricCard
            title="Total Campaigns"
            value={kpis.totalCampaigns}
            subtitle="vs last month"
            trend="up"
            trendValue="+2 campaigns"
            icon={Mail}
            color="#8B5CF6"
          />
          <MetricCard
            title="Emails Delivered"
            value={kpis.totalSent.toLocaleString()}
            subtitle="deliverability rate"
            trend="up"
            trendValue="99.1%"
            icon={Users}
            color="#06B6D4"
          />
          <MetricCard
            title="Avg. Open Rate"
            value={kpis.avgOpenRate}
            suffix="%"
            subtitle="industry avg: 21.5%"
            trend="up"
            trendValue="+1.8% vs Apr"
            icon={Mail}
            color="#10B981"
          />
          <MetricCard
            title="Avg. Click Rate"
            value={kpis.avgClickRate}
            suffix="%"
            subtitle="industry avg: 2.3%"
            trend="up"
            trendValue="+0.8% vs Apr"
            icon={MousePointer2}
            color="#F59E0B"
          />
          <MetricCard
            title="Total Revenue"
            prefix="$"
            value={kpis.totalRevenue.toLocaleString()}
            subtitle="attributed to email"
            trend="up"
            trendValue="+15.6% vs Apr"
            icon={DollarSign}
            color="#EC4899"
          />
          <MetricCard
            title="Total Recipients"
            value={kpis.totalRecipients.toLocaleString()}
            subtitle="across all campaigns"
            trend="up"
            trendValue="+8.2% vs Apr"
            icon={TrendingUp}
            color="#6366F1"
          />
        </section>

        {/* Charts Row */}
        <section className="charts-section">
          <div className="chart-card chart-card--wide">
            <div className="chart-card__header">
              <div>
                <h3>Performance Trends</h3>
                <p>6-month email engagement overview</p>
              </div>
              <div className="chart-tabs">
                <button
                  className={`chart-tab ${activeChartTab === "performance" ? "chart-tab--active" : ""}`}
                  onClick={() => setActiveChartTab("performance")}
                >Open &amp; Click Rates</button>
                <button
                  className={`chart-tab ${activeChartTab === "revenue" ? "chart-tab--active" : ""}`}
                  onClick={() => setActiveChartTab("revenue")}
                >Revenue</button>
              </div>
            </div>
            <div className="chart-body">
              {activeChartTab === "performance"
                ? <TrendLineChart data={monthlyTrends} />
                : <RevenueBarChart data={monthlyTrends} />}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card__header">
              <div>
                <h3>Client Comparison</h3>
                <p>Open &amp; click rates by client</p>
              </div>
            </div>
            <div className="chart-body">
              <ClientBarChart data={clientComparison} />
            </div>
          </div>
        </section>

        {/* Campaigns Table + Activity Feed */}
        <section className="bottom-section">
          <div className="table-card">
            <div className="section-header">
              <div>
                <h3>Campaigns</h3>
                <p>{filteredCampaigns.length} campaigns · click columns to sort</p>
              </div>
              <div className="campaign-count-badges">
                <span className="count-badge count-badge--sent">
                  {sentCampaigns.length} Sent
                </span>
                <span className="count-badge count-badge--scheduled">
                  {filteredCampaigns.filter((c) => c.status === "Scheduled").length} Scheduled
                </span>
                <span className="count-badge count-badge--draft">
                  {filteredCampaigns.filter((c) => c.status === "Draft").length} Draft
                </span>
              </div>
            </div>
            <CampaignsTable campaigns={filteredCampaigns} clients={clients} />
          </div>

          <div className="activity-card">
            <div className="section-header">
              <div>
                <h3>Recent Activity</h3>
                <p>Latest campaign events</p>
              </div>
            </div>
            <ActivityFeed activities={recentActivity} />
          </div>
        </section>
      </main>
    </div>
  );
}
