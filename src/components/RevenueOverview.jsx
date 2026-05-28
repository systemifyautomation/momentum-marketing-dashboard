import { TrendingDown, TrendingUp, Users, Send, Zap, Mail, MessageSquare } from "lucide-react";

const fmt$ = (n) =>
  "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtPct = (n) => Number(n).toFixed(2) + "%";

function TrendPill({ value }) {
  if (value === null || value === undefined) return null;
  const down = value < 0;
  return (
    <span className={`rov-pill ${down ? "rov-pill--down" : "rov-pill--up"}`}>
      {down ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
      {Math.abs(value)}%
    </span>
  );
}

function BreakdownItem({ icon: Icon, label, amount, pct }) {
  return (
    <div className="rov-breakdown__item">
      <div className="rov-breakdown__item-head">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <div className="rov-breakdown__amount">{fmt$(amount)}</div>
      {pct !== undefined && <div className="rov-breakdown__pct">{fmtPct(pct)}</div>}
    </div>
  );
}

export default function RevenueOverview({ data }) {
  if (!data || (data.totalRevenue == null && data.attributedRevenue === 0)) {
    return (
      <div className="rov-wrap">
        <div className="rov-hero">
          <div className="rov-hero__empty">No revenue data for the selected client and period.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rov-wrap">
      {/* Hero metrics */}
      <div className="rov-hero">
        <div className="rov-hero__col">
          <div className="rov-hero__amount">{data.totalRevenue != null ? fmt$(data.totalRevenue) : "—"}</div>
          <div className="rov-hero__label">Total revenue</div>
          <div className="rov-hero__trend">
            <TrendPill value={data.revenueTrend} />
          </div>
        </div>
        <div className="rov-divider--v" />
        <div className="rov-hero__col">
          <div className="rov-hero__amount">{fmt$(data.attributedRevenue)}</div>
          <div className="rov-hero__label">
            Attributed revenue{data.attributedPct !== null ? ` (${fmtPct(data.attributedPct)} of total)` : ""}
          </div>
          <div className="rov-hero__trend">
            <TrendPill value={data.attributedTrend} />
          </div>
        </div>
      </div>

      {/* Attributed breakdown */}
      <div className="rov-breakdown">
        <div className="rov-breakdown__title">Attributed revenue</div>
        <div className="rov-breakdown__grid">
          <BreakdownItem icon={Users} label="Per recipient" amount={data.perRecipient} />
          <div className="rov-divider--v" />
          <BreakdownItem
            icon={Send}
            label="Campaigns"
            amount={data.campaignRevenue}
            pct={data.campaignPct}
          />
          <div className="rov-divider--v" />
          <BreakdownItem
            icon={Zap}
            label="Flows"
            amount={data.flowRevenue}
            pct={data.flowPct}
          />
          <div className="rov-divider--v" />
          <BreakdownItem
            icon={Mail}
            label="Email"
            amount={data.emailRevenue}
            pct={data.emailPct}
          />
          <div className="rov-divider--v" />
          <BreakdownItem
            icon={MessageSquare}
            label="Text message"
            amount={data.smsRevenue}
            pct={data.smsPct}
          />
        </div>
      </div>
    </div>
  );
}
