import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  IconButton,
  Slider,
  Stack,
  CircularProgress,
  Alert,
  Collapse,
  Paper
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import PercentIcon from '@mui/icons-material/Percent';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Scatter } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Tooltip as ChartTooltip, 
  Legend 
} from 'chart.js';
import axios from 'axios';
import { formatCurrency } from '../../utils/format';

// Register ChartJS components
ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  ChartTooltip,
  Legend
);

const OutlierDetectionCard = ({ title = 'Outlier Detection', height = 350 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [outliers, setOutliers] = useState([]);
  const [contamination, setContamination] = useState(0.05); // 5% outliers expected
  const [showControls, setShowControls] = useState(false);
  
  // Fetch outlier data
  const fetchOutliers = async (skipCache = false) => {
    setLoading(true);
    setError(null);
    try {
      // Use the new analytics endpoint for outlier detection
      const response = await axios.get(`http://localhost:5000/api/analytics/outliers`, {
        params: { 
          method: 'zscore',
          threshold: contamination * 20, // Convert contamination rate to Z-score threshold
          fields: ['total', 'items', 'tax'],
          skip_cache: skipCache 
        }
      });
      
      if (response.data && !response.data.error && Array.isArray(response.data.outliers)) {
        const outlierResults = response.data.outliers;
        
        if (outlierResults.length > 0) {
          // Transform the outliers into our expected format
          const detectedOutliers = outlierResults
            .map(item => ({
              id: item.id || item._id,
              amount: item.total || item.amount || item.Total || 0,
              outlier_score: item.outlier_score || item.score || 0,
              vendor: item.vendor || item.Vendor || 'Unknown',
              document_type: item.document_type || item.file_type || 'Unknown',
              date: item.date || item.Date,
              reason: item.reason || `Z-score: ${(item.outlier_score || 0).toFixed(2)}`
            }))
            .sort((a, b) => b.outlier_score - a.outlier_score) // Sort by outlier score descending
            .slice(0, 5); // Take top 5
          
          setOutliers(detectedOutliers);
        } else {
          setOutliers([]);
        }
      } else {
        setOutliers([]);
      }
    } catch (err) {
      console.error('Error fetching outlier data:', err);
      setError('Failed to load outlier data');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data on component mount and when contamination changes
  useEffect(() => {
    fetchOutliers();
  }, [contamination]);
  
  // Prepare scatter plot data for visualization
  const prepareScatterData = () => {
    if (!outliers || outliers.length === 0) return null;
    
    // Extract data points
    const dataPoints = outliers.map(outlier => ({
      x: outlier.amount || 0,
      y: outlier.outlier_score || 0,
      id: outlier.id,
      vendor: outlier.vendor || 'Unknown',
      document_type: outlier.document_type || 'Unknown',
      date: outlier.date ? new Date(outlier.date).toLocaleDateString() : 'Unknown',
      reason: outlier.reason || 'Unusual transaction'
    }));
    
    return {
      datasets: [
        {
          label: 'Outlier Transactions',
          data: dataPoints,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    };
  };
  
  const scatterData = prepareScatterData();
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Amount'
        },
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Anomaly Score'
        },
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const data = context.raw;
            return [
              `ID: ${data.id}`,
              `Amount: ${formatCurrency(data.x)}`,
              `Anomaly Score: ${data.y.toFixed(2)}`,
              `Vendor: ${data.vendor}`,
              `Type: ${data.document_type}`,
              `Date: ${data.date}`,
              `Reason: ${data.reason}`
            ];
          }
        }
      }
    }
  };
  
  // Get severity level based on outlier score
  const getOutlierSeverity = (score) => {
    if (score > 0.8) return { icon: <ErrorIcon color="error" />, level: 'High' };
    if (score > 0.5) return { icon: <WarningIcon color="warning" />, level: 'Medium' };
    return { icon: <ReportProblemIcon color="info" />, level: 'Low' };
  };
  
  return (
    <Card sx={{ height }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            <Tooltip title="Detects unusual financial transactions that deviate significantly from normal patterns">
              <HelpOutlineIcon sx={{ ml: 1, fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
            </Tooltip>
          </Box>
        }
        action={
          <Box>
            <Tooltip title="Refresh outlier detection">
              <IconButton 
                size="small" 
                onClick={() => fetchOutliers(true)}
                disabled={loading}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Detection settings">
              <IconButton 
                size="small" 
                onClick={() => setShowControls(!showControls)}
                disabled={loading}
              >
                <PercentIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      <Divider />
      
      <Collapse in={showControls}>
        <Box sx={{ px: 2, py: 1, bgcolor: 'background.paper' }}>
          <Typography variant="subtitle2" gutterBottom>
            Outlier Sensitivity
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Lower
            </Typography>
            <Slider
              value={contamination}
              onChange={(_, newValue) => setContamination(newValue)}
              min={0.01}
              max={0.20}
              step={0.01}
              valueLabelDisplay="auto"
              valueLabelFormat={value => `${(value * 100).toFixed(0)}%`}
              disabled={loading}
            />
            <Typography variant="caption" color="text.secondary">
              Higher
            </Typography>
          </Stack>
        </Box>
        <Divider />
      </Collapse>
      
      <CardContent sx={{ height: showControls ? 'calc(100% - 130px)' : 'calc(100% - 72px)', position: 'relative' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : outliers.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="textSecondary">No outliers detected</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: '100%' }}>
            {/* Scatter Plot */}
            <Box sx={{ 
              flex: 1, 
              height: { xs: '50%', md: '100%' }, 
              width: { xs: '100%', md: '50%' },
              mr: { xs: 0, md: 1 },
              mb: { xs: 1, md: 0 }
            }}>
              {scatterData && (
                <Scatter data={scatterData} options={chartOptions} />
              )}
            </Box>
            
            {/* Outliers List */}
            <Box sx={{ 
              flex: 1, 
              height: { xs: '50%', md: '100%' }, 
              width: { xs: '100%', md: '50%' },
              ml: { xs: 0, md: 1 },
              overflowY: 'auto'
            }}>
              <Paper variant="outlined" sx={{ height: '100%' }}>
                <List dense sx={{ p: 0 }}>
                  {outliers.slice(0, 10).map((outlier, index) => {
                    const severity = getOutlierSeverity(outlier.outlier_score);
                    return (
                      <React.Fragment key={outlier.id || index}>
                        <ListItem>
                          <ListItemIcon>
                            {severity.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" noWrap>
                                {formatCurrency(outlier.amount)} - {outlier.vendor || 'Unknown'}
                              </Typography>
                            }
                            secondary={
                              <Tooltip title={outlier.reason}>
                                <Typography variant="caption" noWrap color="text.secondary">
                                  {outlier.reason}
                                </Typography>
                              </Tooltip>
                            }
                          />
                        </ListItem>
                        {index < outliers.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    );
                  })}
                </List>
              </Paper>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default OutlierDetectionCard;