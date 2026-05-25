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
        <CartesianGrid strokeDasharray="3 3" stroke="#1E2D3D" />
        <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#94A3B8", paddingTop: 8 }} />
        <Line type="monotone" dataKey="avgOpenRate" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3 }} name="Avg Open Rate" />
        <Line type="monotone" dataKey="avgClickRate" stroke="#06B6D4" strokeWidth={2.5} dot={{ r: 3 }} name="Avg Click Rate" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RevenueBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E2D3D" />
        <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="revenue" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Revenue" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ClientBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: -10 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#1E2D3D" horizontal={false} />
        <XAxis type="number" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
        <YAxis dataKey="client" type="category" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#94A3B8", paddingTop: 8 }} />
        <Bar dataKey="openRate" fill="#8B5CF6" radius={[0, 3, 3, 0]} name="Open Rate" />
        <Bar dataKey="clickRate" fill="#06B6D4" radius={[0, 3, 3, 0]} name="Click Rate" />
      </BarChart>
    </ResponsiveContainer>
  );
}
