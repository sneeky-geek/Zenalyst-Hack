import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import DescriptionIcon from '@mui/icons-material/Description';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { formatCurrency } from '../utils/format';

const DocumentInsights = ({ data, isLoading }) => {
  const [insights, setInsights] = useState({
    documentTypes: [],
    topVendors: [],
    unusualTransactions: [],
    keyFindings: []
  });

  useEffect(() => {
    if (data) {
      // Generate insights from the data
      generateInsights(data);
    }
  }, [data]);

  const generateInsights = (data) => {
    // Document type analysis
    const documentTypes = [];
    if (data.documentCounts) {
      Object.entries(data.documentCounts).forEach(([type, count]) => {
        documentTypes.push({ type, count });
      });
    }

    // Top vendors by transaction value
    const topVendors = [];
    if (data.vendors) {
      const sortedVendors = [...data.vendors]
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5);
      
      topVendors.push(...sortedVendors);
    }

    // Unusual transactions (outliers based on standard deviation)
    const unusualTransactions = [];
    if (data.transactions) {
      const amounts = data.transactions.map(t => t.amount);
      const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
      const stdDev = Math.sqrt(
        amounts.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / amounts.length
      );
      
      // Identify outliers (more than 2 standard deviations from the mean)
      data.transactions.forEach(transaction => {
        if (Math.abs(transaction.amount - mean) > 2 * stdDev) {
          unusualTransactions.push({
            ...transaction,
            reason: transaction.amount > mean ? 'High value transaction' : 'Low value transaction'
          });
        }
      });
    }

    // Key findings
    const keyFindings = [];
    
    // Most common document type
    if (documentTypes.length > 0) {
      const mostCommonDoc = documentTypes.sort((a, b) => b.count - a.count)[0];
      keyFindings.push({
        message: `Most common document type: ${mostCommonDoc.type} (${mostCommonDoc.count} documents)`,
        icon: 'description'
      });
    }
    
    // Top vendor
    if (topVendors.length > 0) {
      keyFindings.push({
        message: `Top vendor is ${topVendors[0].name} with ${formatCurrency(topVendors[0].totalAmount)} in transactions`,
        icon: 'vendor'
      });
    }
    
    // Time period
    if (data.transactions && data.transactions.length > 0) {
      const dates = data.transactions
        .map(t => new Date(t.date))
        .sort((a, b) => a - b);
      
      const firstDate = dates[0];
      const lastDate = dates[dates.length - 1];
      const months = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + 
                     (lastDate.getMonth() - firstDate.getMonth());
      
      keyFindings.push({
        message: `Data spans ${months} months, from ${firstDate.toLocaleDateString()} to ${lastDate.toLocaleDateString()}`,
        icon: 'time'
      });
    }

    setInsights({
      documentTypes,
      topVendors,
      unusualTransactions,
      keyFindings
    });
  };

  const getIconForFinding = (type) => {
    switch (type) {
      case 'description':
        return <DescriptionIcon color="primary" />;
      case 'vendor':
        return <LocalAtmIcon color="primary" />;
      case 'time':
        return <InsightsIcon color="primary" />;
      default:
        return <InsightsIcon color="primary" />;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        Upload documents to see insights about your financial data
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <InsightsIcon sx={{ mr: 1 }} color="primary" />
        <Typography variant="h6">
          Document Insights
        </Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={3}>
        {/* Key Findings */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Key Findings
              </Typography>
              <List dense>
                {insights.keyFindings.map((finding, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {getIconForFinding(finding.icon)}
                    </ListItemIcon>
                    <ListItemText primary={finding.message} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Top Vendors */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Top Vendors
              </Typography>
              <List dense>
                {insights.topVendors.map((vendor, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <LocalAtmIcon color={index < 3 ? "primary" : "action"} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={vendor.name} 
                      secondary={`${formatCurrency(vendor.totalAmount)} · ${vendor.transactionCount} transactions`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Document Types */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Document Types
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {insights.documentTypes.map((doc, index) => (
                  <Chip 
                    key={index}
                    icon={<ReceiptIcon />}
                    label={`${doc.type}: ${doc.count}`}
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Unusual Transactions */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Unusual Transactions
              </Typography>
              <List dense>
                {insights.unusualTransactions.length > 0 ? (
                  insights.unusualTransactions.slice(0, 5).map((transaction, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {transaction.amount > 0 ? 
                          <TrendingUpIcon color="success" /> : 
                          <TrendingDownIcon color="error" />
                        }
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${transaction.vendor || 'Unknown'} - ${formatCurrency(transaction.amount)}`}
                        secondary={`${transaction.reason} · ${new Date(transaction.date).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No unusual transactions detected" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default DocumentInsights;