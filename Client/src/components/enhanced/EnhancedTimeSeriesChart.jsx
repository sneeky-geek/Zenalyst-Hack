import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip as ChartTooltip, 
  Legend,
  Filler
} from 'chart.js';
import axios from 'axios';
import { formatCurrency } from '../../utils/format';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const EnhancedTimeSeriesChart = ({ title = 'Time Series Analysis', height = 350 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [trendAnalysis, setTrendAnalysis] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('amount');
  const [selectedInterval, setSelectedInterval] = useState('month');
  
  // Fetch time series data and trend analysis
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the new analytics endpoints
        const [timeSeriesResponse, forecastResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/analytics/time-series`, {
            params: { 
              time_field: 'date',
              value_field: 'total',
              window: 7
            }
          }),
          axios.get(`http://localhost:5000/api/analytics/forecast`, {
            params: { 
              days: 30
            }
          })
        ]);
        
        if (timeSeriesResponse.data && !timeSeriesResponse.data.error) {
          const timeSeriesData = timeSeriesResponse.data.time_series || [];
          
          // Transform data for chart
          const timeSeriesArray = timeSeriesData.map(item => ({
            period: item.date,
            value: selectedMetric === 'amount' ? item.total : item.count,
            moving_avg: item.moving_avg || null
          }));
          
          // Sort by date
          timeSeriesArray.sort((a, b) => a.period.localeCompare(b.period));
          
          setTimeSeriesData(timeSeriesArray);
          
          // Simple trend analysis
          if (timeSeriesArray.length >= 2) {
            const firstValue = timeSeriesArray[0].value;
            const lastValue = timeSeriesArray[timeSeriesArray.length - 1].value;
            const trend = lastValue > firstValue ? 'increasing' : lastValue < firstValue ? 'decreasing' : 'stable';
            
            setTrendAnalysis({
              trend,
              confidence: 0.7,
              description: `Overall ${trend} trend detected in the data.`
            });
          }
        }
      } catch (err) {
        console.error('Error fetching time series data:', err);
        setError('Failed to load time series data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedMetric, selectedInterval]);
  
  // Prepare chart data
  const chartData = {
    labels: timeSeriesData.map(item => item.period),
    datasets: [
      {
        label: selectedMetric === 'amount' ? 'Amount' : selectedMetric === 'count' ? 'Count' : 'Average',
        data: timeSeriesData.map(item => item.value),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderWidth: 2,
        pointRadius: 4,
        tension: 0.3,
        fill: false
      },
      {
        label: 'Moving Average',
        data: timeSeriesData.map(item => item.moving_avg || null),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.0)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0.4,
        fill: false
      }
    ]
  };
  
  // Add forecast if available
  if (trendAnalysis && trendAnalysis.forecast && trendAnalysis.forecast.length > 0) {
    // Get last period from time series
    const lastPeriod = timeSeriesData.length > 0 ? timeSeriesData[timeSeriesData.length - 1].period : '';
    
    // Generate forecast periods
    const forecastPeriods = [];
    if (lastPeriod) {
      // Simple approach for month increments
      if (selectedInterval === 'month' && lastPeriod.includes('-')) {
        const [year, month] = lastPeriod.split('-').map(Number);
        trendAnalysis.forecast.forEach((_, i) => {
          let nextMonth = month + i + 1;
          let nextYear = year;
          if (nextMonth > 12) {
            nextMonth -= 12;
            nextYear += 1;
          }
          forecastPeriods.push(`${nextYear}-${String(nextMonth).padStart(2, '0')}`);
        });
      } else {
        // For other intervals, just add a label
        trendAnalysis.forecast.forEach((_, i) => {
          forecastPeriods.push(`Forecast ${i + 1}`);
        });
      }
    }
    
    // Create extended labels
    const extendedLabels = [...chartData.labels];
    forecastPeriods.forEach(period => extendedLabels.push(period));
    
    // Create extended data
    const mainData = [...chartData.datasets[0].data];
    const lastValue = mainData[mainData.length - 1] || 0;
    const forecastValues = trendAnalysis.forecast.map(f => f.value);
    
    // Add null value between actual and forecast to break the line
    mainData.push(null);
    forecastValues.unshift(null);
    
    // Update chart data
    chartData.labels = extendedLabels;
    chartData.datasets[0].data = mainData;
    
    // Add forecast dataset
    chartData.datasets.push({
      label: 'Forecast',
      data: [...Array(mainData.length - 1).fill(null), lastValue, ...forecastValues.slice(1)],
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderWidth: 2,
      pointRadius: 4,
      pointStyle: 'triangle',
      tension: 0.3,
      borderDash: [5, 5],
      fill: false
    });
  }
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value) {
            if (selectedMetric === 'amount') {
              return formatCurrency(value);
            }
            return value;
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (selectedMetric === 'amount') {
              label += formatCurrency(context.raw);
            } else {
              label += context.raw;
            }
            return label;
          }
        }
      }
    }
  };
  
  // Render trend icon and label
  const renderTrendIndicator = () => {
    if (!trendAnalysis) return null;
    
    const { trend_direction, trend_strength, trend_confidence } = trendAnalysis;
    
    let icon, color, label;
    
    switch (trend_direction) {
      case 'increasing':
        icon = <TrendingUpIcon />;
        color = 'success';
        label = 'Increasing';
        break;
      case 'decreasing':
        icon = <TrendingDownIcon />;
        color = 'error';
        label = 'Decreasing';
        break;
      default:
        icon = <TrendingFlatIcon />;
        color = 'warning';
        label = 'Stable';
    }
    
    return (
      <Tooltip title={`Trend confidence: ${Math.round(trend_confidence * 100)}%, Strength: ${Math.round(trend_strength * 100)}%`}>
        <Chip 
          icon={icon} 
          label={label} 
          color={color} 
          size="small" 
          sx={{ ml: 1 }}
        />
      </Tooltip>
    );
  };
  
  return (
    <Card sx={{ height: height }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            {!loading && !error && renderTrendIndicator()}
            <Tooltip title="Analyzes financial patterns over time and forecasts future trends">
              <HelpOutlineIcon sx={{ ml: 1, fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
            </Tooltip>
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControl size="small" sx={{ mr: 1, minWidth: 120 }}>
              <InputLabel id="metric-select-label">Metric</InputLabel>
              <Select
                labelId="metric-select-label"
                value={selectedMetric}
                label="Metric"
                onChange={(e) => setSelectedMetric(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="amount">Amount</MenuItem>
                <MenuItem value="count">Count</MenuItem>
                <MenuItem value="average">Average</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="interval-select-label">Interval</InputLabel>
              <Select
                labelId="interval-select-label"
                value={selectedInterval}
                label="Interval"
                onChange={(e) => setSelectedInterval(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="day">Daily</MenuItem>
                <MenuItem value="week">Weekly</MenuItem>
                <MenuItem value="month">Monthly</MenuItem>
                <MenuItem value="quarter">Quarterly</MenuItem>
                <MenuItem value="year">Yearly</MenuItem>
              </Select>
            </FormControl>
          </Box>
        }
      />
      <Divider />
      <CardContent sx={{ height: 'calc(100% - 72px)', position: 'relative' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : timeSeriesData.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="textSecondary">No time series data available</Typography>
          </Box>
        ) : (
          <Box sx={{ height: '100%', position: 'relative' }}>
            <Line data={chartData} options={chartOptions} />
            
            {trendAnalysis && trendAnalysis.trend_direction !== 'neutral' && (
              <Box sx={{ position: 'absolute', bottom: 16, right: 16 }}>
                <Tooltip title="AI-powered forecast based on historical patterns">
                  <Chip 
                    label="AI Forecast" 
                    color="primary" 
                    size="small" 
                    variant="outlined" 
                  />
                </Tooltip>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedTimeSeriesChart;