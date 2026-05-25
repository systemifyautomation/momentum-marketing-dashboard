import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === "number" && p.value > 1000 ? `$${p.value.toLocaleString()}` : `${p.value}${p.name.includes("Rate") ? "%" : ""}`}</strong>
        </p>
      ))}
    </div>
  );
};

export function TrendLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
        <XAxis dataKey="month" tick={{ fill: "#71717A", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#71717A", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#71717A", paddingTop: 8 }} />
        <Line type="monotone" dataKey="avgOpenRate" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} name="Avg Open Rate" />
        <Line type="monotone" dataKey="avgClickRate" stroke="#0891B2" strokeWidth={2} dot={{ r: 3 }} name="Avg Click Rate" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RevenueBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
        <XAxis dataKey="month" tick={{ fill: "#71717A", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#71717A", fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Revenue" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ClientBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: -10 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" horizontal={false} />
        <XAxis type="number" tick={{ fill: "#71717A", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
        <YAxis dataKey="client" type="category" tick={{ fill: "#71717A", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#71717A", paddingTop: 8 }} />
        <Bar dataKey="openRate" fill="#4F46E5" radius={[0, 3, 3, 0]} name="Open Rate" />
        <Bar dataKey="clickRate" fill="#0891B2" radius={[0, 3, 3, 0]} name="Click Rate" />
      </BarChart>
    </ResponsiveContainer>
  );
}

const fmt = (v) => `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const ClientRevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      <p style={{ color: "#94A3B8" }}>Total Revenue: <strong>{fmt(d.revenue)}</strong></p>
      <p style={{ color: "#4F46E5" }}>Attributed: <strong>{fmt(d.attributedRevenue)}</strong></p>
      <p style={{ color: "#059669", marginTop: 4, fontWeight: 600 }}>Attribution: {d.attributedPct}%</p>
    </div>
  );
};

export function ClientRevenueChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: "#71717A", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <YAxis
          dataKey="client"
          type="category"
          tick={{ fill: "#71717A", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip content={<ClientRevenueTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: "#71717A", paddingTop: 8 }} />
        <Bar dataKey="revenue" fill="#CBD5E1" radius={[0, 3, 3, 0]} name="Total Revenue" barSize={10} />
        <Bar dataKey="attributedRevenue" fill="#4F46E5" radius={[0, 3, 3, 0]} name="Attributed Revenue" barSize={10} />
      </BarChart>
    </ResponsiveContainer>
  );
}
