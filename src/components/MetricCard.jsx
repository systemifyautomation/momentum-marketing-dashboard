import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function MetricCard({ title, value, subtitle, trend, trendValue, icon: Icon, color, prefix = "", suffix = "" }) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "#10B981" : trend === "down" ? "#EF4444" : "#6B7280";

  return (
    <div className="metric-card">
      <div className="metric-card__header">
        <span className="metric-card__title">{title}</span>
        <div className="metric-card__icon" style={{ background: `${color}22`, color }}>
          <Icon size={18} />
        </div>
      </div>
      <div className="metric-card__value">
        {prefix}<span>{value}</span>{suffix}
      </div>
      <div className="metric-card__footer">
        <div className="metric-card__trend" style={{ color: trendColor }}>
          <TrendIcon size={13} />
          <span>{trendValue}</span>
        </div>
        <span className="metric-card__subtitle">{subtitle}</span>
      </div>
    </div>
  );
}
