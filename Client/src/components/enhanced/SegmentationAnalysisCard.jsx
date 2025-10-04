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
  Tooltip,
  IconButton,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Badge
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Bubble } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  LinearScale, 
  PointElement, 
  Tooltip as ChartTooltip, 
  Legend 
} from 'chart.js';
import axios from 'axios';
import { formatCurrency } from '../../utils/format';

// Register ChartJS components
ChartJS.register(
  LinearScale,
  PointElement,
  ChartTooltip,
  Legend
);

// Custom plugin to draw cluster labels on chart
const clusterLabelsPlugin = {
  id: 'clusterLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    
    // Get cluster centers
    const clusterCenters = chart.config.options.clusterCenters || [];
    
    ctx.save();
    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    clusterCenters.forEach(cluster => {
      const xScale = chart.scales.x;
      const yScale = chart.scales.y;
      
      const x = xScale.getPixelForValue(cluster.center.total);
      const y = yScale.getPixelForValue(cluster.center.unit_price || 0);
      
      // Draw circle
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();
      
      // Draw text
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillText(`Cluster ${cluster.cluster_id + 1}`, x, y);
    });
    
    ctx.restore();
  }
};

ChartJS.register(clusterLabelsPlugin);

const CLUSTER_COLORS = [
  'rgba(255, 99, 132, 0.6)',  // Red
  'rgba(54, 162, 235, 0.6)',  // Blue
  'rgba(255, 206, 86, 0.6)',  // Yellow
  'rgba(75, 192, 192, 0.6)',  // Teal
  'rgba(153, 102, 255, 0.6)', // Purple
  'rgba(255, 159, 64, 0.6)'   // Orange
];

const SegmentationAnalysisCard = ({ title = 'Vendor Segmentation', height = 350 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [segments, setSegments] = useState({ clusters: [], cluster_stats: [] });
  const [clusterCount, setClusterCount] = useState(3);
  
  // Simple k-means segmentation implementation
  const performSegmentation = (data, k) => {
    if (!data || data.length === 0) return { clusters: [], cluster_stats: [] };
    
    // Extract features
    const vendors = data.map(vendor => ({
      name: vendor.name,
      total: vendor.totalAmount || 0,
      count: vendor.transactionCount || 0,
      unit_price: vendor.totalAmount / Math.max(1, vendor.transactionCount),
    }));

    // Choose k random centroids
    let centroids = [];
    const used = new Set();
    
    while(centroids.length < k && centroids.length < vendors.length) {
      const idx = Math.floor(Math.random() * vendors.length);
      if (!used.has(idx)) {
        used.add(idx);
        centroids.push({
          total: vendors[idx].total,
          unit_price: vendors[idx].unit_price,
          count: vendors[idx].count
        });
      }
    }
    
    // Assign vendors to clusters
    const assignToClusters = () => {
      const clusters = Array(k).fill().map(() => []);
      
      vendors.forEach(vendor => {
        let minDist = Infinity;
        let clusterIdx = 0;
        
        centroids.forEach((centroid, idx) => {
          // Simple Euclidean distance on normalized values
          const totalDiff = (vendor.total - centroid.total) ** 2;
          const priceDiff = (vendor.unit_price - centroid.unit_price) ** 2;
          const countDiff = (vendor.count - centroid.count) ** 2;
          
          const dist = Math.sqrt(totalDiff + priceDiff + countDiff);
          
          if (dist < minDist) {
            minDist = dist;
            clusterIdx = idx;
          }
        });
        
        clusters[clusterIdx].push({...vendor, cluster_id: clusterIdx});
      });
      
      return clusters;
    };
    
    // Update centroids
    const updateCentroids = (clusters) => {
      return clusters.map((cluster, idx) => {
        if (cluster.length === 0) return centroids[idx];
        
        const total = cluster.reduce((sum, v) => sum + v.total, 0) / cluster.length;
        const unit_price = cluster.reduce((sum, v) => sum + v.unit_price, 0) / cluster.length;
        const count = cluster.reduce((sum, v) => sum + v.count, 0) / cluster.length;
        
        return { total, unit_price, count };
      });
    };
    
    // Run k-means for a few iterations
    let clusters;
    const MAX_ITERATIONS = 10;
    
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      clusters = assignToClusters();
      const newCentroids = updateCentroids(clusters);
      centroids = newCentroids;
    }
    
    // Format the result similar to what the API would return
    const result = {
      clusters: centroids.map((center, idx) => ({
        cluster_id: idx,
        center
      })),
      cluster_stats: clusters.map((cluster, idx) => {
        // Calculate stats
        const total = cluster.reduce((sum, v) => sum + v.total, 0);
        const avgTotal = cluster.length > 0 ? total / cluster.length : 0;
        const avgUnitPrice = cluster.length > 0 ? 
          cluster.reduce((sum, v) => sum + v.unit_price, 0) / cluster.length : 0;
        const avgCount = cluster.length > 0 ? 
          cluster.reduce((sum, v) => sum + v.count, 0) / cluster.length : 0;
          
        // Determine characteristics
        const characteristics = [];
        
        if (avgTotal > data.reduce((sum, v) => sum + v.totalAmount, 0) / data.length) {
          characteristics.push("High Transaction Value");
        } else {
          characteristics.push("Low Transaction Value");
        }
        
        if (avgUnitPrice > data.reduce((sum, v) => sum + (v.totalAmount / Math.max(1, v.transactionCount)), 0) / data.length) {
          characteristics.push("High Unit Price");
        } else {
          characteristics.push("Low Unit Price");
        }
        
        if (avgCount > data.reduce((sum, v) => sum + v.transactionCount, 0) / data.length) {
          characteristics.push("Frequent Transactions");
        } else {
          characteristics.push("Infrequent Transactions");
        }
        
        return {
          cluster_id: idx,
          size: cluster.length,
          percentage: Math.round((cluster.length / vendors.length) * 100),
          features: {
            total: { mean: avgTotal, median: avgTotal },
            unit_price: { mean: avgUnitPrice, median: avgUnitPrice }
          },
          characteristics
        };
      })
    };
    
    return result;
  };

  // Fetch vendor data and perform segmentation using the analytics API
  const fetchSegments = async (skipCache = false) => {
    setLoading(true);
    setError(null);
    try {
      // Using the new analytics/clustering endpoint with k-means
      const response = await axios.get(`http://localhost:5000/api/analytics/clustering`, {
        params: { 
          n_clusters: clusterCount,
          entity_type: 'vendor',
          features: ['total_spent', 'transaction_count', 'average_value'],
          algorithm: 'kmeans',
          skip_cache: skipCache 
        }
      });
      
      if (response.data && !response.data.error) {
        const clusteringResults = response.data;
        
        // Transform the clustering results to match our expected format
        const transformedResults = {
          clusters: [],
          cluster_stats: []
        };
        
        // Group by clusters
        const clusterMap = new Map();
        
        if (Array.isArray(clusteringResults.clusters)) {
          clusteringResults.clusters.forEach(item => {
            const clusterId = item.cluster_id || 0;
            if (!clusterMap.has(clusterId)) {
              clusterMap.set(clusterId, []);
            }
            clusterMap.get(clusterId).push(item);
          });
          
          // Process clusters
          clusterMap.forEach((members, clusterId) => {
            // Calculate cluster center
            const totalSum = members.reduce((sum, m) => sum + (m.total_spent || 0), 0);
            const countSum = members.reduce((sum, m) => sum + (m.transaction_count || 0), 0);
            const priceSum = members.reduce((sum, m) => sum + (m.average_value || 0), 0);
            
            const center = {
              total: totalSum / members.length,
              unit_price: priceSum / members.length,
              count: countSum / members.length
            };
            
            transformedResults.clusters.push({
              cluster_id: clusterId,
              center: center
            });
            
            // Calculate stats and characteristics
            const characteristics = [];
            if (center.total > totalSum / clusterMap.size) {
              characteristics.push("High Transaction Value");
            } else {
              characteristics.push("Low Transaction Value");
            }
            
            if (center.unit_price > priceSum / clusterMap.size) {
              characteristics.push("High Unit Price");
            } else {
              characteristics.push("Low Unit Price");
            }
            
            if (center.count > countSum / clusterMap.size) {
              characteristics.push("Frequent Transactions");
            } else {
              characteristics.push("Infrequent Transactions");
            }
            
            transformedResults.cluster_stats.push({
              cluster_id: clusterId,
              size: members.length,
              percentage: Math.round((members.length / clusteringResults.clusters.length) * 100),
              features: {
                total: { mean: center.total, median: center.total },
                unit_price: { mean: center.unit_price, median: center.unit_price }
              },
              characteristics
            });
          });
        }
        
        setSegments(transformedResults);
      }
    } catch (err) {
      console.error('Error fetching vendor data for segmentation:', err);
      setError('Failed to load segmentation data');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data on component mount and when clusterCount changes
  useEffect(() => {
    fetchSegments();
  }, [clusterCount]);
  
  // Prepare bubble chart data for visualization
  const prepareBubbleData = () => {
    if (!segments || !segments.clusters || segments.clusters.length === 0) return null;
    
    // Create datasets for each cluster
    const datasets = segments.cluster_stats.map((stat, index) => {
      const clusterCenter = segments.clusters.find(c => c.cluster_id === stat.cluster_id)?.center || {};
      
      return {
        label: `Cluster ${stat.cluster_id + 1}`,
        data: [{
          x: clusterCenter.total || 0,
          y: clusterCenter.unit_price || 0,
          r: Math.max(10, Math.min(40, stat.size / 2)) // Size based on cluster size
        }],
        backgroundColor: CLUSTER_COLORS[index % CLUSTER_COLORS.length],
        borderColor: CLUSTER_COLORS[index % CLUSTER_COLORS.length].replace('0.6', '1'),
        borderWidth: 1
      };
    });
    
    return {
      datasets
    };
  };
  
  const bubbleData = prepareBubbleData();
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    clusterCenters: segments.clusters.map(cluster => ({
      cluster_id: cluster.cluster_id,
      center: cluster.center
    })),
    scales: {
      x: {
        title: {
          display: true,
          text: 'Transaction Amount'
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
          text: 'Unit Price'
        },
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const clusterStat = segments.cluster_stats[context.datasetIndex];
            return [
              `Cluster ${clusterStat.cluster_id + 1}`,
              `Size: ${clusterStat.size} items (${clusterStat.percentage}%)`,
              `Avg. Amount: ${formatCurrency(clusterStat.features.total?.mean || 0)}`,
              `Avg. Unit Price: ${formatCurrency(clusterStat.features.unit_price?.mean || 0)}`,
              `Characteristics:`,
              ...clusterStat.characteristics.map(c => `- ${c}`)
            ];
          }
        }
      }
    }
  };
  
  return (
    <Card sx={{ height }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            <Tooltip title="Groups vendors and transactions into meaningful segments based on similar characteristics">
              <HelpOutlineIcon sx={{ ml: 1, fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
            </Tooltip>
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControl size="small" sx={{ mr: 1, minWidth: 120 }}>
              <InputLabel id="cluster-select-label">Clusters</InputLabel>
              <Select
                labelId="cluster-select-label"
                value={clusterCount}
                label="Clusters"
                onChange={(e) => setClusterCount(e.target.value)}
                disabled={loading}
              >
                <MenuItem value={2}>2 Clusters</MenuItem>
                <MenuItem value={3}>3 Clusters</MenuItem>
                <MenuItem value={4}>4 Clusters</MenuItem>
                <MenuItem value={5}>5 Clusters</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Refresh segmentation">
              <IconButton 
                size="small" 
                onClick={() => fetchSegments(true)}
                disabled={loading}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
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
        ) : segments.cluster_stats.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="textSecondary">No segmentation data available</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: '100%' }}>
            {/* Bubble Chart */}
            <Box sx={{ 
              flex: 1, 
              height: { xs: '50%', md: '100%' }, 
              width: { xs: '100%', md: '50%' },
              mr: { xs: 0, md: 1 },
              mb: { xs: 1, md: 0 }
            }}>
              {bubbleData && (
                <Bubble data={bubbleData} options={chartOptions} />
              )}
            </Box>
            
            {/* Clusters List */}
            <Box sx={{ 
              flex: 1, 
              height: { xs: '50%', md: '100%' }, 
              width: { xs: '100%', md: '50%' },
              ml: { xs: 0, md: 1 },
              overflowY: 'auto'
            }}>
              <List>
                {segments.cluster_stats.map((cluster, index) => (
                  <React.Fragment key={cluster.cluster_id}>
                    <ListItem
                      sx={{ 
                        borderLeft: `4px solid ${CLUSTER_COLORS[index % CLUSTER_COLORS.length]}`,
                        mb: 1,
                        bgcolor: 'background.paper',
                        borderRadius: '4px'
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Badge 
                              badgeContent={cluster.cluster_id + 1} 
                              color="primary" 
                              sx={{ mr: 1 }}
                            >
                              <GroupWorkIcon />
                            </Badge>
                            <Typography variant="subtitle1">
                              Cluster {cluster.cluster_id + 1}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                              ({cluster.size} items, {cluster.percentage}%)
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" gutterBottom>
                              <strong>Average Amount:</strong> {formatCurrency(cluster.features.total?.mean || 0)}
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                              {cluster.characteristics.map((char, i) => (
                                <Chip 
                                  key={i} 
                                  label={char}
                                  size="small"
                                  variant="outlined"
                                  color={char.includes('High') ? 'success' : 'error'}
                                />
                              ))}
                            </Stack>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < segments.cluster_stats.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SegmentationAnalysisCard;