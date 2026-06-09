import { useState } from "react";
import { ChevronUp, ChevronDown, Mail, MessageSquare } from "lucide-react";

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ChevronUp size={12} style={{ opacity: 0.3 }} />;
  return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
}

const CHANNEL_CONFIG = {
  email: { Icon: Mail,           label: "Email" },
  sms:   { Icon: MessageSquare,  label: "SMS"   },
};

export default function FlowsTable({ flows, clients }) {
  const [sortField, setSortField] = useState("revenue");
  const [sortDir,   setSortDir]   = useState("desc");

  const clientMap = Object.fromEntries((clients ?? []).map((c) => [c.id, c]));

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const sorted = [...flows].sort((a, b) => {
    let av = a[sortField];
    let bv = b[sortField];
    if (typeof av === "string") av = av.toLowerCase();
    if (typeof bv === "string") bv = bv.toLowerCase();
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const cols = [
    { key: "name",        label: "Flow Message", sortable: true,  width: "30%" },
    { key: "channel",     label: "Type",         sortable: true,  width: "10%" },
    { key: "delivered",   label: "Deliveries",   sortable: true,  width: "12%" },
    { key: "openRate",    label: "Open Rate",    sortable: true,  width: "13%" },
    { key: "clickRate",   label: "Click Rate",   sortable: true,  width: "13%" },
    { key: "revenue",     label: "Placed Order", sortable: true,  width: "16%" },
  ];

  if (flows.length === 0) {
    return (
      <div className="table-container">
        <p style={{ padding: "20px 16px", color: "var(--text-muted)", fontSize: "12px" }}>
          No flow messages for the selected period.
        </p>
      </div>
    );
  }

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
          {sorted.map((f) => {
            const client   = clientMap[f.clientId];
            const chCfg    = CHANNEL_CONFIG[f.channel?.toLowerCase()] ?? CHANNEL_CONFIG.email;
            const { Icon } = chCfg;

            return (
              <tr key={f.id} className="table-row">
                {/* Name */}
                <td>
                  <div className="campaign-name-cell">
                    <div className="campaign-icon" style={{ background: (client?.color ?? "#6366f1") + "22", color: client?.color ?? "#6366f1" }}>
                      <Icon size={13} />
                    </div>
                    <div>
                      <div className="campaign-name">{f.name}</div>
                      {f.type && f.type !== "—" && (
                        <div className="campaign-subject">{f.type}</div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Type / Channel */}
                <td>
                  <span
                    className="badge"
                    style={{
                      background: f.channel?.toLowerCase() === "sms" ? "#06B6D420" : "#4F46E520",
                      color:      f.channel?.toLowerCase() === "sms" ? "#06B6D4"   : "#4F46E5",
                    }}
                  >
                    {chCfg.label}
                  </span>
                </td>

                {/* Deliveries */}
                <td className="num-cell">{(f.delivered ?? 0).toLocaleString()}</td>

                {/* Open Rate */}
                <td>
                  <div className="rate-cell">
                    <div
                      className="rate-bar"
                      style={{
                        width: `${Math.min(f.openRate, 60)}%`,
                        background: f.openRate >= 40 ? "#10B981" : f.openRate >= 30 ? "#F59E0B" : "#EF4444",
                      }}
                    />
                    <span>{f.openRate}%</span>
                  </div>
                </td>

                {/* Click Rate */}
                <td>
                  <div className="rate-cell">
                    <div
                      className="rate-bar"
                      style={{
                        width: `${Math.min(f.clickRate * 3, 70)}%`,
                        background: f.clickRate >= 12 ? "#10B981" : f.clickRate >= 8 ? "#F59E0B" : "#EF4444",
                      }}
                    />
                    <span>{f.clickRate}%</span>
                  </div>
                </td>

                {/* Placed Order */}
                <td className="num-cell revenue-cell">
                  <div>${(f.revenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 }}>
                    ${(f.revenuePerRecipient ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / recipient
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
