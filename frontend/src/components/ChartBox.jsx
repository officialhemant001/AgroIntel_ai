import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Area,
  AreaChart,
} from "recharts";

const data = [
  { day: "Mon", health: 80, moisture: 60 },
  { day: "Tue", health: 75, moisture: 65 },
  { day: "Wed", health: 90, moisture: 70 },
  { day: "Thu", health: 85, moisture: 68 },
  { day: "Fri", health: 95, moisture: 72 },
  { day: "Sat", health: 88, moisture: 66 },
  { day: "Sun", health: 92, moisture: 74 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "rgba(19, 42, 30, 0.95)",
          border: "1px solid rgba(34, 197, 94, 0.2)",
          borderRadius: "10px",
          padding: "12px 16px",
          backdropFilter: "blur(10px)",
        }}
      >
        <p
          style={{
            color: "#ecfdf5",
            fontWeight: 600,
            fontSize: "13px",
            marginBottom: "6px",
            fontFamily: "Poppins",
          }}
        >
          {label}
        </p>
        {payload.map((entry, index) => (
          <p
            key={index}
            style={{
              color: entry.color,
              fontSize: "12px",
              margin: "3px 0",
              fontFamily: "Poppins",
            }}
          >
            {entry.name}: {entry.value}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ChartBox() {
  return (
    <div className="content-card">
      {/* Header */}
      <div className="content-card-header">
        <span className="content-card-title">📈 Crop Analytics</span>
        <span className="content-card-badge live">Live</span>
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: "280px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(34, 197, 94, 0.08)"
              vertical={false}
            />

            <XAxis
              dataKey="day"
              stroke="#5e7d6a"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "rgba(34, 197, 94, 0.1)" }}
              fontFamily="Poppins"
            />
            <YAxis
              stroke="#5e7d6a"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              fontFamily="Poppins"
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              wrapperStyle={{
                fontFamily: "Poppins",
                fontSize: "12px",
                color: "#94b8a3",
              }}
            />

            <Area
              type="monotone"
              dataKey="health"
              stroke="#22c55e"
              strokeWidth={2.5}
              fill="url(#healthGradient)"
              dot={{ r: 4, fill: "#22c55e", stroke: "#132a1e", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#22c55e", stroke: "#ecfdf5", strokeWidth: 2 }}
              name="Health"
            />

            <Area
              type="monotone"
              dataKey="moisture"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fill="url(#moistureGradient)"
              dot={{ r: 4, fill: "#06b6d4", stroke: "#132a1e", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#06b6d4", stroke: "#ecfdf5", strokeWidth: 2 }}
              name="Moisture"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Stats */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          marginTop: "20px",
          paddingTop: "18px",
          borderTop: "1px solid rgba(34, 197, 94, 0.1)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "#94b8a3" }}>🌿 Avg Health</p>
          <p
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#22c55e",
              marginTop: "4px",
            }}
          >
            86%
          </p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "#94b8a3" }}>💧 Avg Moisture</p>
          <p
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#06b6d4",
              marginTop: "4px",
            }}
          >
            68%
          </p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "#94b8a3" }}>📈 Trend</p>
          <p
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#4ade80",
              marginTop: "4px",
            }}
          >
            ↑ 5%
          </p>
        </div>
      </div>
    </div>
  );
}