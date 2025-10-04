import React from 'react';
import { Doughnut } from 'react-chartjs-2';
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

const VendorChart = ({ data }) => {
  // Get top vendors by amount
  const prepareChartData = () => {
    if (!data || data.length === 0) return null;
    
    // Take top 5 vendors and aggregate the rest
    let topVendors = [...data];
    if (topVendors.length > 5) {
      const top5 = topVendors.slice(0, 5);
      const others = topVendors.slice(5);
      
      const othersAggregate = {
        _id: 'Others',
        count: others.reduce((sum, item) => sum + item.count, 0),
        total_amount: others.reduce((sum, item) => sum + item.total_amount, 0)
      };
      
      topVendors = [...top5, othersAggregate];
    }
    
    // Colors for chart
    const backgroundColors = [
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 99, 132, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)'
    ];
    
    const borderColors = [
      'rgba(54, 162, 235, 1)',
      'rgba(255, 99, 132, 1)',
      'rgba(255, 206, 86, 1)',
      'rgba(75, 192, 192, 1)',
      'rgba(153, 102, 255, 1)',
      'rgba(255, 159, 64, 1)'
    ];
    
    return {
      labels: topVendors.map(vendor => vendor._id),
      datasets: [
        {
          data: topVendors.map(vendor => vendor.total_amount),
          backgroundColor: backgroundColors,
          borderColor: borderColors,
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
        labels: {
          boxWidth: 12
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: $${value.toLocaleString()}`;
          }
        }
      }
    },
  };

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          Top Vendors by Amount
        </Typography>
        <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
          {chartData ? (
            <Doughnut data={chartData} options={options} />
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 10 }}>
              No vendor data available
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default VendorChart;