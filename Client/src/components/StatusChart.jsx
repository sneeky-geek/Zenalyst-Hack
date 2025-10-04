import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Card, CardContent, Typography, Box } from '@mui/material';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

const StatusChart = ({ data }) => {
  // Generate random colors for the chart
  const generateColors = (count) => {
    const colors = [];
    const backgroundColors = [];
    for (let i = 0; i < count; i++) {
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      colors.push(`rgba(${r}, ${g}, ${b}, 1)`);
      backgroundColors.push(`rgba(${r}, ${g}, ${b}, 0.6)`);
    }
    return { colors, backgroundColors };
  };

  // Transform data for chart
  const prepareChartData = () => {
    if (!data || data.length === 0) return null;
    
    const labels = data.map(item => item._id || 'Unknown');
    const values = data.map(item => item.count);
    const { colors, backgroundColors } = generateColors(data.length);
    
    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: backgroundColors,
          borderColor: colors,
          borderWidth: 1,
        },
      ],
    };
  };

  const chartData = prepareChartData();
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          Transaction Status Breakdown
        </Typography>
        <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
          {chartData ? (
            <Pie data={chartData} options={options} />
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 10 }}>
              No status data available
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatusChart;