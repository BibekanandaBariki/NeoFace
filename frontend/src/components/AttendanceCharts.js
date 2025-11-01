import React from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#4ade80', '#f87171', '#fbbf24', '#667eea', '#764ba2'];

const AttendanceCharts = ({ analytics }) => {
  const pieData = analytics?.subjects?.map((subject, index) => ({
    name: subject.subjectName || `Subject ${index + 1}`,
    value: subject.attendance || 0,
    present: subject.present || 0,
    absent: subject.absent || 0
  })) || [];

  // Daily trend data
  const dailyData = analytics?.dailyHeatmap ? Object.entries(analytics.dailyHeatmap)
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      present: data.present,
      absent: data.absent,
      total: data.total
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-30) : [];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '1.5rem'
    }}>
      {/* Pie Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card"
      >
        <h3 style={{ color: 'white', marginBottom: '1rem' }}>Subject-wise Attendance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '8px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Line Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card"
      >
        <h3 style={{ color: 'white', marginBottom: '1rem' }}>Daily Attendance Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />
            <XAxis
              dataKey="date"
              stroke="rgba(255, 255, 255, 0.7)"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="rgba(255, 255, 255, 0.7)" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                background: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="present"
              stroke="#4ade80"
              strokeWidth={2}
              name="Present"
            />
            <Line
              type="monotone"
              dataKey="absent"
              stroke="#f87171"
              strokeWidth={2}
              name="Absent"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default AttendanceCharts;

