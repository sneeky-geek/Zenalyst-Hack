import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import Dashboard from './components/Dashboard';
import EnhancedDashboard from './components/enhanced/EnhancedDashboard';
import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Create a custom theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  const [dashboardData, setDashboardData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get metrics
        const metricsResponse = await axios.get('http://localhost:5000/api/metrics');
        
        // Get transactions
        const transactionsResponse = await axios.get('http://localhost:5000/api/transactions');
        
        // Get vendor data
        const vendorsResponse = await axios.get('http://localhost:5000/api/vendors');

        // Get document counts
        const documentCounts = {};
        if (metricsResponse.data && metricsResponse.data.documentTypes) {
          metricsResponse.data.documentTypes.forEach(type => {
            if (type._id) {
              documentCounts[type._id] = type.count;
            }
          });
        }
        
        setDashboardData({
          metrics: metricsResponse.data,
          transactions: transactionsResponse.data,
          vendors: vendorsResponse.data,
          documentCounts
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [refresh]);

  const handleUploadComplete = (uploadData) => {
    // Update dashboard data with the new data from upload
    setDashboardData(prevData => ({
      ...prevData,
      metrics: uploadData.metrics || prevData.metrics,
      transactions: uploadData.transactions || prevData.transactions,
      vendors: uploadData.vendors || prevData.vendors,
      documentCounts: uploadData.documentCounts || prevData.documentCounts
    }));
    
    // Trigger a refresh of the data
    setRefresh(prev => prev + 1);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box>
        {/* Use the new enhanced dashboard that includes FileUploader and DocumentInsights */}
        <EnhancedDashboard 
          data={dashboardData} 
          isLoading={isLoading} 
          onUploadComplete={handleUploadComplete}
        />
        {/* Legacy dashboard kept for reference/comparison */}
        {/* <Dashboard data={dashboardData} isLoading={isLoading} /> */}
      </Box>
    </ThemeProvider>
  );
}

export default App;
