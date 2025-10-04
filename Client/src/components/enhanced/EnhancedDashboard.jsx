import React from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Paper,
  Divider
} from '@mui/material';
import Header from '../Header';
import EnhancedKpiSummary from './EnhancedKpiSummary';
import EnhancedTimeSeriesChart from './EnhancedTimeSeriesChart';
import OutlierDetectionCard from './OutlierDetectionCard';
import SegmentationAnalysisCard from './SegmentationAnalysisCard';
import EnhancedTransactionTable from './EnhancedTransactionTable';
import FileUploader from '../FileUploader';
import DocumentInsights from '../DocumentInsights';

const EnhancedDashboard = ({ data, isLoading, onUploadComplete }) => {
  return (
    <Box className="app-container">
      <Header />
      
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Dashboard Title */}
        <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Financial Analytics Dashboard
          </Typography>
          <Typography variant="body1">
            Optimized data insights with AI-powered trend detection, anomaly identification, and automatic segmentation
          </Typography>
        </Paper>
        
        {/* File Upload Section */}
        <FileUploader onUploadComplete={onUploadComplete} />
        
        {/* Document Insights */}
        <DocumentInsights data={data} isLoading={isLoading} />
        
        {/* KPI Summary */}
        <Box sx={{ mb: 4 }}>
          <EnhancedKpiSummary />
        </Box>
        
        {/* Charts Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Time Series Analysis */}
          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 8' } }}>
            <EnhancedTimeSeriesChart height={400} />
          </Grid>
          
          {/* Outlier Detection */}
          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
            <OutlierDetectionCard height={400} />
          </Grid>
          
          {/* Segmentation Analysis */}
          <Grid sx={{ gridColumn: 'span 12' }}>
            <SegmentationAnalysisCard height={500} />
          </Grid>
        </Grid>
        
        {/* Transactions Table */}
        <Box sx={{ mb: 4 }}>
          <EnhancedTransactionTable />
        </Box>
        
        {/* Dashboard Footer */}
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary" align="center">
            Zenalyst Financial Analytics Dashboard — Optimized for Performance and Insight
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default EnhancedDashboard;