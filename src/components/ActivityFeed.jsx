import { Send, Star, Calendar, FileEdit } from "lucide-react";

const ACTIVITY_ICONS = {
  sent: { icon: Send, color: "#10B981", bg: "#10B98120" },
  milestone: { icon: Star, color: "#F59E0B", bg: "#F59E0B20" },
  scheduled: { icon: Calendar, color: "#3B82F6", bg: "#3B82F620" },
  draft: { icon: FileEdit, color: "#9CA3AF", bg: "#6B728020" },
};

export default function ActivityFeed({ activities }) {
  return (
    <div className="activity-feed">
      {activities.map((item) => {
        const cfg = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.sent;
        const Icon = cfg.icon;
        return (
          <div key={item.id} className="activity-item">
            <div className="activity-icon" style={{ background: cfg.bg, color: cfg.color }}>
              <Icon size={14} />
            </div>
            <div className="activity-content">
              <div className="activity-campaign">{item.campaign}</div>
              <div className="activity-client">{item.client}</div>
            </div>
            <div className="activity-meta">
              <div className="activity-metric">{item.metric}</div>
              <div className="activity-time">{item.time}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
