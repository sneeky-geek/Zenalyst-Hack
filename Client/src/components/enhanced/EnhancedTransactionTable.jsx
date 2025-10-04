import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import axios from 'axios';
import { formatCurrency } from '../../utils/format';

const EnhancedTransactionTable = ({ title = 'Recent Transactions' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch transactions
  const fetchTransactions = async (skipCache = false) => {
    setLoading(true);
    setError(null);
    try {
      // Use the enhanced transactions API with analytics enrichment
      const response = await axios.get('http://localhost:5000/api/analytics/transactions', {
        params: {
          query: searchQuery,
          page: page + 1,
          limit: rowsPerPage,
          include_metrics: true,
          include_anomaly_scores: true,
          skip_cache: skipCache
        }
      });
      
      if (response.data && !response.data.error) {
        // Handle paginated response with metadata
        if (response.data.transactions && Array.isArray(response.data.transactions)) {
          setTransactions(response.data.transactions);
          setTotal(response.data.total || response.data.transactions.length);
        } else if (Array.isArray(response.data)) {
          // Fallback to old format if needed
          let filteredTransactions = response.data;
          
          // Apply search filter if query exists
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filteredTransactions = filteredTransactions.filter(tx => 
              (tx.vendor && tx.vendor.toLowerCase().includes(query)) ||
              (tx.document_type && tx.document_type.toLowerCase().includes(query)) ||
              (tx.source_file && tx.source_file.toLowerCase().includes(query))
            );
          }
          
          // Apply pagination
          const start = page * rowsPerPage;
          const end = start + rowsPerPage;
          const paginatedTransactions = filteredTransactions.slice(start, end);
          
          setTransactions(paginatedTransactions);
          setTotal(filteredTransactions.length);
        }
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data when component mounts or when pagination/search changes
  useEffect(() => {
    fetchTransactions();
  }, [page, rowsPerPage]);
  
  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0); // Reset to first page
    fetchTransactions();
  };
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };
  
  // Export transactions to CSV
  const exportToCsv = () => {
    // Prepare CSV headers
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Document Type,Vendor,Amount,Status,Document ID\n";
    
    // Add transaction data
    transactions.forEach(tx => {
      const row = [
        formatDate(tx.date || ''),
        tx.document_type || '',
        tx.vendor || '',
        tx.amount || tx.total || 0,
        tx.status || 'Processed',
        tx._id || ''
      ].map(cell => {
        // Escape commas and quotes
        cell = String(cell).replace(/"/g, '""');
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(',');
      csvContent += row + "\n";
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <Card>
      <CardHeader
        title={<Typography variant="h6">{title}</Typography>}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <form onSubmit={handleSearch}>
              <TextField
                size="small"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mr: 1 }}
              />
            </form>
            <Tooltip title="Refresh data">
              <IconButton 
                size="small" 
                onClick={() => fetchTransactions(true)}
                disabled={loading}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export to CSV">
              <IconButton 
                size="small" 
                onClick={exportToCsv}
                disabled={loading || transactions.length === 0}
              >
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      <Divider />
      <CardContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : transactions.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="textSecondary">
              No transactions found
              {searchQuery && ` matching "${searchQuery}"`}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((transaction, index) => {
                    const isOutlier = transaction.is_outlier;
                    
                    return (
                      <TableRow 
                        key={transaction._id || index}
                        sx={{ 
                          backgroundColor: isOutlier ? 'rgba(255, 235, 235, 0.5)' : 'inherit',
                          '&:hover': { 
                            backgroundColor: isOutlier ? 'rgba(255, 235, 235, 0.8)' : 'rgba(0, 0, 0, 0.04)' 
                          }
                        }}
                      >
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={transaction.document_type || 'Unknown'}
                            size="small"
                            variant="outlined"
                            color={
                              transaction.document_type?.includes('Invoice') ? 'primary' :
                              transaction.document_type?.includes('Order') ? 'success' :
                              'default'
                            }
                          />
                        </TableCell>
                        <TableCell>{transaction.vendor || 'N/A'}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(transaction.amount || transaction.total || 0)}
                        </TableCell>
                        <TableCell align="center">
                          {isOutlier ? (
                            <Tooltip title={transaction.outlier_reason || 'Unusual transaction'}>
                              <Chip 
                                icon={<WarningIcon />}
                                label="Anomaly"
                                size="small"
                                color="warning"
                              />
                            </Tooltip>
                          ) : (
                            <Chip 
                              label="Normal"
                              size="small"
                              color="default"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedTransactionTable;