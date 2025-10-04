# Analytics Integration Documentation

## Overview

This document outlines the integration between the frontend components and the new analytics API endpoints. The integration enhances the dashboard with advanced analytics capabilities including time series analysis, outlier detection, vendor segmentation, and KPI calculations.

## Components Updated

### 1. EnhancedTimeSeriesChart

**Original Approach:** 
- Client-side grouping of transactions by month
- Basic visualization without trends or forecasts

**New Integration:**
- Uses `/api/analytics/time-series` for time series data
- Uses `/api/analytics/forecast` for predictive analytics
- Now displays:
  - Historical time series data
  - Moving averages
  - Trend forecasting
  - Period-over-period comparisons

**API Parameters:**
- `time_field`: Field used for time grouping (typically "date")
- `value_field`: Field to aggregate (typically "total")
- `window`: Window size for moving averages

### 2. SegmentationAnalysisCard

**Original Approach:**
- Simple client-side vendor clustering using basic rules
- Limited clustering capabilities and visualization

**New Integration:**
- Uses `/api/analytics/clustering` with k-means algorithm
- Features:
  - Customizable cluster count
  - Multi-feature clustering (total_spent, transaction_count, average_value)
  - Detailed cluster characteristics

**API Parameters:**
- `n_clusters`: Number of clusters to generate
- `entity_type`: Type of entity to cluster (vendor)
- `features`: Array of features to use for clustering
- `algorithm`: Clustering algorithm (kmeans)

### 3. OutlierDetectionCard

**Original Approach:**
- Basic outlier detection using standard deviation
- Limited to amount-based detection

**New Integration:**
- Uses `/api/analytics/outliers` with Z-score method
- Features:
  - Statistical anomaly detection
  - Multi-field outlier scoring
  - Adjustable threshold sensitivity
  - Detailed anomaly explanations

**API Parameters:**
- `method`: Detection algorithm (zscore)
- `threshold`: Sensitivity threshold
- `fields`: Array of fields to analyze for outliers

### 4. EnhancedKpiSummary

**Original Approach:**
- Basic metrics without trends or comparisons
- Limited to current period data

**New Integration:**
- Uses `/api/analytics/kpis` for enriched metrics
- Features:
  - Period-over-period comparisons
  - Trend indicators (up/down/flat)
  - Percentage changes
  - Enhanced KPI calculations

**API Parameters:**
- `compare_to_previous`: Enable period comparisons
- `period`: Time period for comparison (day, week, month)

### 5. EnhancedTransactionTable

**Original Approach:**
- Basic transaction listing
- Client-side filtering and pagination

**New Integration:**
- Uses `/api/analytics/transactions` for enhanced transaction data
- Features:
  - Server-side pagination and filtering
  - Enriched transaction metadata
  - Anomaly scores for each transaction
  - Performance optimizations

**API Parameters:**
- `query`: Search query
- `page`: Current page number
- `limit`: Results per page
- `include_metrics`: Add computed metrics to transactions
- `include_anomaly_scores`: Add outlier detection scores

## Error Handling

All components now include proper error handling for API failures:
- Graceful fallback to previous functionality
- Clear error messaging
- Retry mechanisms where appropriate

## Caching Strategy

Components support cache invalidation through the `skip_cache` parameter, allowing for:
- Forced refresh of data
- Cache-first strategy for better performance
- Optimized data loading

## Sample Data Support

When no data is available, the analytics API will use sample data to demonstrate functionality. This ensures that the dashboard is always populated with meaningful visualizations.
