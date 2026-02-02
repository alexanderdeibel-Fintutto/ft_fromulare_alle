import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

/**
 * Chart Card
 * Wrapper for Recharts with common styling
 */

export default function ChartCard({
  title,
  data,
  type = 'line',
  dataKey,
  color = '#4F46E5',
  height = 300,
  showLegend = true,
  showGrid = true
}) {
  const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const chartProps = {
    data,
    margin: { top: 5, right: 30, left: 0, bottom: 5 }
  };

  let ChartComponent, chartContent;

  if (type === 'line') {
    ChartComponent = LineChart;
    chartContent = (
      <>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
        <XAxis dataKey="name" stroke="#9CA3AF" />
        <YAxis stroke="#9CA3AF" />
        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
        {showLegend && <Legend />}
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
      </>
    );
  } else if (type === 'bar') {
    ChartComponent = BarChart;
    chartContent = (
      <>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
        <XAxis dataKey="name" stroke="#9CA3AF" />
        <YAxis stroke="#9CA3AF" />
        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
        {showLegend && <Legend />}
        <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
      </>
    );
  } else if (type === 'pie') {
    ChartComponent = PieChart;
    chartContent = (
      <>
        <Pie data={data} dataKey={dataKey} cx="50%" cy="50%" outerRadius={100} label>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
        {showLegend && <Legend />}
      </>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent {...chartProps}>
          {chartContent}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}