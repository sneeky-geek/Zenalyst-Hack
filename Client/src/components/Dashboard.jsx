import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Typography, 
  Box, 
  CircularProgress, 
  Alert, 
  Button,
  Snackbar,
  Paper
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BusinessIcon from '@mui/icons-material/Business';
import DescriptionIcon from '@mui/icons-material/Description';

import Header from './Header';
import SummaryCard from './SummaryCard';
import MonthlyChart from './MonthlyChart';
import StatusChart from './StatusChart';
import VendorChart from './VendorChart';
import TransactionTable from './TransactionTable';

import api from '../services/api';
import styles from './styles/Dashboard.module.css';

const Dashboard = ({ data, isLoading }) => {
  // State variables
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [vendorData, setVendorData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [connectionStatus, setConnectionStatus] = useState({ status: 'connected', message: 'Connected to API server' });

  // Use data from props when available, otherwise load from API
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      // Use data from props
      processPropsData(data);
      setLoading(false);
    } else {
      // Fall back to loading from API
      checkApiConnection();
      loadAllData();
    }
  }, [data, isLoading]);
  
  // Process data received from props
  const processPropsData = (data) => {
    // Process metrics for summary
    if (data.metrics) {
      const summaryData = {
        financial_summary: {
          total_amount: data.metrics.valuesByType?.reduce((total, item) => total + item.total_value, 0) || 0
        },
        total_records: data.metrics.totalDocuments || 0,
        document_types: data.documentCounts || {}
      };
      setSummary(summaryData);
      
      // Process monthly data
      if (data.metrics.monthlyTrend) {
        const monthlyTrendData = data.metrics.monthlyTrend.map(item => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
          amount: item.total_value || 0,
          count: item.count || 0
        }));
        setMonthlyData(monthlyTrendData);
      }
      
      // Process status data
      if (data.metrics.documentTypes) {
        const statusData = data.metrics.documentTypes.map(item => ({
          name: item._id || 'Unknown',
          value: item.count || 0
        }));
        setStatusData(statusData);
      }
    }
    
    // Process vendor data
    if (data.vendors) {
      setVendorData(data.vendors);
    }
    
    // Process transactions
    if (data.transactions) {
      setTransactions(data.transactions.slice(0, 10));
      setTotalTransactions(data.transactions.length);
    }
  };

  // Check API connection
  const checkApiConnection = async () => {
    try {
      const health = await api.checkHealth();
      if (health.status === 'healthy') {
        setConnectionStatus({ 
          status: 'connected', 
          message: 'Connected to API server' 
        });
      } else {
        setConnectionStatus({
          status: 'error',
          message: 'API server reports issues'
        });
      }
    } catch (err) {
      setConnectionStatus({
        status: 'error',
        message: 'Failed to connect to API server. Make sure it is running.'
      });
      setError('Failed to connect to the API server. Please ensure the backend is running.');
    }
  };

  // Load all dashboard data
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load all data in parallel
      const [summaryData, monthlyTransactions, vendorStats, statusSummary, transactionData] = await Promise.all([
        api.getSummary(),
        api.getMonthlyData(),
        api.getVendorStats(),
        api.getStatusSummary(),
        api.getTransactions({ limit: 10, skip: 0 })
      ]);
      
      // Set state with fetched data
      setSummary(summaryData);
      setMonthlyData(monthlyTransactions);
      setVendorData(vendorStats);
      setStatusData(statusSummary);
      setTransactions(transactionData.results);
      setTotalTransactions(transactionData.total);
      
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  // Handle page change in transaction table
  const handlePageChange = async (page, rowsPerPage) => {
    try {
      const skip = page * rowsPerPage;
      const { results, total } = await api.getTransactions({ 
        limit: rowsPerPage, 
        skip 
      });
      
      setTransactions(results);
      setTotalTransactions(total);
    } catch (err) {
      console.error('Error fetching transaction page:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load transactions',
        severity: 'error'
      });
    }
  };

  // Handle transaction search
  const handleTransactionSearch = async (query) => {
    try {
      if (!query || query.trim() === '') {
        // Reset to normal transaction view
        const { results, total } = await api.getTransactions({ 
          limit: 10, 
          skip: 0 
        });
        
        setTransactions(results);
        setTotalTransactions(total);
      } else {
        // Search for transactions
        const results = await api.searchTransactions(query);
        setTransactions(results);
        setTotalTransactions(results.length);
      }
    } catch (err) {
      console.error('Error searching transactions:', err);
      setSnackbar({
        open: true,
        message: 'Search failed',
        severity: 'error'
      });
    }
  };

  // Format numbers for display
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '-';
    return Number(num).toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  // Handle refresh button click
  const handleRefresh = () => {
    loadAllData();
    setSnackbar({
      open: true,
      message: 'Dashboard refreshed',
      severity: 'success'
    });
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box className="app-container">
      <Header />
      
      <Container maxWidth="xl" className="app-main dashboard-container">
        {/* Connection Status */}
        {connectionStatus.status === 'error' && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
          >
            {connectionStatus.message}
          </Alert>
        )}
        
        {/* Dashboard Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 500 }}>
            Finance Dashboard
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh Data
          </Button>
        </Box>
        
        {/* Loading or Error State */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <CircularProgress size={60} thickness={4} />
          </div>
        ) : error ? (
          <Alert severity="error" className={styles.errorContainer}>
            {error}
            <Button
              variant="text"
              color="inherit"
              startIcon={<RefreshIcon />}
              onClick={loadDashboardData}
              sx={{ ml: 2 }}
            >
              Retry
            </Button>
          </Alert>
        ) : (
          <>
            {/* Dashboard Grid Layout */}
            <div className={styles.dashboardGrid}>
              {/* Summary Section */}
              <div className={styles.summarySection}>
                <Paper elevation={2} className="dashboard-card">
                  <SummaryCard
                    title="Total Amount"
                    value={`$${formatNumber(summary?.financial_summary?.total_amount || 0)}`}
                    subtitle="All transactions"
                    icon={<AttachMoneyIcon sx={{ color: 'white' }} />}
                    color="#4caf50"
                  />
                </Paper>
                <Paper elevation={2} className="dashboard-card">
                  <SummaryCard
                    title="Total Transactions"
                    value={summary?.total_records || 0}
                    subtitle="Processed documents"
                    icon={<ReceiptIcon sx={{ color: 'white' }} />}
                    color="#2196f3"
                  />
                </Paper>
                <Paper elevation={2} className="dashboard-card">
                  <SummaryCard
                    title="Vendors"
                    value={vendorData?.length || 0}
                    subtitle="Unique suppliers"
                    icon={<BusinessIcon sx={{ color: 'white' }} />}
                    color="#ff9800"
                  />
                </Paper>
                <Paper elevation={2} className="dashboard-card">
                  <SummaryCard
                    title="Document Types"
                    value={Object.keys(summary?.document_types || {}).length}
                    subtitle="Different types"
                    icon={<DescriptionIcon sx={{ color: 'white' }} />}
                    color="#9c27b0"
                  />
                </Paper>
              </div>
              
              {/* Chart Section */}
              <div className={styles.chartSection}>
                <Paper elevation={2} className={`${styles.monthlyChart} dashboard-card`}>
                  <MonthlyChart data={monthlyData} />
                </Paper>
                <Paper elevation={2} className={`${styles.statusChart} dashboard-card`}>
                  <StatusChart data={statusData} />
                </Paper>
                <Paper elevation={2} className={`${styles.vendorChart} dashboard-card`}>
                  <VendorChart data={vendorData} />
                </Paper>
              </div>

            {/* Table Section */}
            <div className={styles.tableSection}>
              <Paper elevation={2} className="dashboard-card">
                <TransactionTable 
                  transactions={transactions}
                  total={totalTransactions}
                  onPageChange={handlePageChange}
                  onSearch={handleTransactionSearch}
                />
              </Paper>
            </div>
          </div>
          </>
        )}
      </Container>

      {/* Notification Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;