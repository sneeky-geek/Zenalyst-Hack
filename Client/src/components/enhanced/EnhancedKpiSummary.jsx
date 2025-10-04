import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Tooltip, 
  IconButton, 
  CircularProgress, 
  Divider,
  Alert,
  Paper,
  Stack
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BusinessIcon from '@mui/icons-material/Business';
import DescriptionIcon from '@mui/icons-material/Description';
import WarningIcon from '@mui/icons-material/Warning';
import axios from 'axios';
import { formatCurrency } from '../../utils/format';

const EnhancedKpiSummary = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState(null);
  
  // Fetch KPI data
  const fetchKpis = async (skipCache = false) => {
    setLoading(true);
    setError(null);
    try {
      // Use our new analytics KPI endpoint
      const response = await axios.get('http://localhost:5000/api/analytics/kpis', {
        params: { 
          compare_to_previous: true,
          skip_cache: skipCache 
        }
      });
      
      if (response.data && !response.data.error) {
        // Use the new analytics API response format
        const transformedData = {
          totalTransactions: {
            value: response.data.total_transactions?.current || 0,
            change: response.data.total_transactions?.change_percent || 0,
            trend: getTrendDirection(response.data.total_transactions?.change_percent || 0)
          },
          totalAmount: {
            value: response.data.total_amount?.current || 0,
            change: response.data.total_amount?.change_percent || 0,
            trend: getTrendDirection(response.data.total_amount?.change_percent || 0)
          },
          averageTransaction: {
            value: response.data.average_transaction?.current || 0,
            change: response.data.average_transaction?.change_percent || 0,
            trend: getTrendDirection(response.data.average_transaction?.change_percent || 0)
          },
          topCategory: {
            value: response.data.top_category?.name || 'Unknown',
            change: response.data.top_category?.percentage || 0,
            trend: 'flat'
          },
          uniqueVendors: {
            value: response.data.unique_vendors?.current || 0,
            change: response.data.unique_vendors?.change_percent || 0,
            trend: getTrendDirection(response.data.unique_vendors?.change_percent || 0)
          }
        };
        
        // Helper function to determine trend direction
        function getTrendDirection(changePercent) {
          if (changePercent > 2) return 'up';
          if (changePercent < -2) return 'down';
          return 'flat';
        }
        setKpis(transformedData);
      }
    } catch (err) {
      console.error('Error fetching KPI data:', err);
      setError('Failed to load KPI data');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data on component mount
  useEffect(() => {
    fetchKpis();
  }, []);
  
  // Helper function to render trend icon
  const renderTrendIcon = (trend, strength) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUpIcon sx={{ color: 'success.main' }} />;
      case 'decreasing':
        return <TrendingDownIcon sx={{ color: 'error.main' }} />;
      default:
        return <TrendingFlatIcon sx={{ color: 'warning.main' }} />;
    }
  };
  
  // KPI card component
  const KpiCard = ({ title, value, icon, trend, subtitle, color = '#1976d2' }) => {
    return (
      <Paper 
        elevation={2} 
        sx={{
          borderTop: `4px solid ${color}`,
          height: '100%',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h5" component="div" fontWeight="bold">
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  {trend && renderTrendIcon(trend)}
                  <span style={{ marginLeft: trend ? 4 : 0 }}>{subtitle}</span>
                </Typography>
              )}
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: color,
              p: 1,
              borderRadius: 1,
              color: 'white'
            }}>
              {icon}
            </Box>
          </Box>
        </Box>
      </Paper>
    );
  };
  
  // Format numbers for display
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '-';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return Number(num).toLocaleString();
  };
  
  return (
    <Card>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Key Performance Indicators</Typography>
        <Tooltip title="Refresh KPIs">
          <IconButton size="small" onClick={() => fetchKpis(true)} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Divider />
      <CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !kpis ? (
          <Alert severity="info">No KPI data available</Alert>
        ) : (
          <Grid container spacing={2}>
            {/* Total Amount */}
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
              <KpiCard 
                title="Total Amount" 
                value={formatCurrency(kpis?.totalAmount?.value || 0)} 
                icon={<AttachMoneyIcon />}
                subtitle={
                  kpis?.totalAmount?.change !== undefined ? 
                  `${kpis.totalAmount.change > 0 ? '+' : ''}${kpis.totalAmount.change}% change` :
                  'All transactions'
                }
                trend={kpis?.totalAmount?.trend || 'flat'}
                color="#4caf50"
              />
            </Grid>
            
            {/* Transaction Count */}
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
              <KpiCard 
                title="Total Transactions" 
                value={formatNumber(kpis?.totalTransactions?.value || 0)} 
                icon={<ReceiptIcon />}
                subtitle="Processed documents"
                color="#2196f3"
              />
            </Grid>
            
            {/* Top Category */}
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
              <KpiCard 
                title="Top Category" 
                value={kpis?.topCategory?.value || 'N/A'} 
                icon={<BusinessIcon />}
                subtitle="Most common document type"
                color="#ff9800"
              />
            </Grid>
            
            {/* Average Transaction */}
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
              <KpiCard 
                title="Average Transaction" 
                value={formatCurrency(kpis?.averageTransaction?.value || 0)} 
                icon={<DescriptionIcon />}
                subtitle="Average document value"
                color="#f44336"
              />
            </Grid>
            
            {/* Additional KPIs can be added as needed */}
          </Grid>
        )}
        
        {/* Summary Info */}
        {kpis && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle2">Dashboard Status:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ ml: 0.5 }}>
                  <strong>Data Successfully Loaded</strong> - {kpis?.totalTransactions?.value || 0} documents processed
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedKpiSummary;