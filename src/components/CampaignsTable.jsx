import { useState } from "react";
import { ChevronUp, ChevronDown, Mail } from "lucide-react";

const STATUS_CONFIG = {
  Sent: { bg: "#10B98120", color: "#10B981", label: "Sent" },
  Scheduled: { bg: "#3B82F620", color: "#3B82F6", label: "Scheduled" },
  Draft: { bg: "#6B728020", color: "#9CA3AF", label: "Draft" },
  Sending: { bg: "#F59E0B20", color: "#F59E0B", label: "Sending" },
};

const TYPE_CONFIG = {
  Promotional: { bg: "#EC489920", color: "#EC4899" },
  Newsletter: { bg: "#8B5CF620", color: "#8B5CF6" },
  "Product Launch": { bg: "#F59E0B20", color: "#F59E0B" },
  "Win-Back": { bg: "#EF444420", color: "#EF4444" },
  Content: { bg: "#10B98120", color: "#10B981" },
  Event: { bg: "#06B6D420", color: "#06B6D4" },
};

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ChevronUp size={12} style={{ opacity: 0.3 }} />;
  return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
}

export default function CampaignsTable({ campaigns, clients }) {
  const [sortField, setSortField] = useState("sentDate");
  const [sortDir, setSortDir] = useState("desc");

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const sorted = [...campaigns].sort((a, b) => {
    let av = a[sortField];
    let bv = b[sortField];
    if (typeof av === "string") av = av.toLowerCase();
    if (typeof bv === "string") bv = bv.toLowerCase();
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const cols = [
    { key: "name", label: "Campaign", sortable: true, width: "22%" },
    { key: "clientId", label: "Client", sortable: true, width: "14%" },
    { key: "type", label: "Type", sortable: true, width: "10%" },
    { key: "sentDate", label: "Date", sortable: true, width: "9%" },
    { key: "recipients", label: "Recipients", sortable: true, width: "9%" },
    { key: "openRate", label: "Open Rate", sortable: true, width: "9%" },
    { key: "clickRate", label: "Click Rate", sortable: true, width: "9%" },
    { key: "revenue", label: "Revenue", sortable: true, width: "9%" },
    { key: "status", label: "Status", sortable: true, width: "9%" },
  ];

  return (
    <div className="table-container">
      <table className="campaigns-table">
        <thead>
          <tr>
            {cols.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={col.sortable ? "sortable" : ""}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <span>{col.label}</span>
                {col.sortable && <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => {
            const client = clientMap[c.clientId];
            const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.Draft;
            const typeCfg = TYPE_CONFIG[c.type] || { bg: "#6B728020", color: "#9CA3AF" };
            const isSent = c.status === "Sent";

            return (
              <tr key={c.id} className="table-row">
                <td>
                  <div className="campaign-name-cell">
                    <div className="campaign-icon" style={{ background: client?.color + "22", color: client?.color }}>
                      <Mail size={13} />
                    </div>
                    <div>
                      <div className="campaign-name">{c.name}</div>
                      <div className="campaign-subject">{c.subject}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="client-cell" style={{ color: client?.color }}>
                    <div className="client-dot" style={{ background: client?.color }} />
                    <span>{client?.name}</span>
                  </div>
                </td>
                <td>
                  <span className="badge" style={{ background: typeCfg.bg, color: typeCfg.color }}>
                    {c.type}
                  </span>
                </td>
                <td className="text-muted">
                  {c.status === "Sent"
                    ? new Date(c.sentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : c.sentDate
                    ? new Date(c.sentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "—"}
                </td>
                <td className="num-cell">{isSent ? c.recipients.toLocaleString() : "—"}</td>
                <td>
                  {isSent ? (
                    <div className="rate-cell">
                      <div
                        className="rate-bar"
                        style={{
                          width: `${Math.min(c.openRate, 60)}%`,
                          background: c.openRate >= 40 ? "#10B981" : c.openRate >= 30 ? "#F59E0B" : "#EF4444",
                        }}
                      />
                      <span>{c.openRate}%</span>
                    </div>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td>
                  {isSent ? (
                    <div className="rate-cell">
                      <div
                        className="rate-bar"
                        style={{
                          width: `${Math.min(c.clickRate * 3, 70)}%`,
                          background: c.clickRate >= 12 ? "#10B981" : c.clickRate >= 8 ? "#F59E0B" : "#EF4444",
                        }}
                      />
                      <span>{c.clickRate}%</span>
                    </div>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="num-cell revenue-cell">
                  {isSent && c.revenue > 0 ? `$${c.revenue.toLocaleString()}` : isSent ? "$0" : "—"}
                </td>
                <td>
                  <span className="badge" style={{ background: statusCfg.bg, color: statusCfg.color }}>
                    {statusCfg.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
