# Zenalyst Analytics Engine

This document describes the advanced analytics algorithms implemented in the Zenalyst backend.

## Implemented Algorithms

### 1. GroupBy & Window Functions
- **Implementation**: `group_by_aggregate()` and `window_function_analysis()`
- **Endpoints**: 
  - `/api/analytics/group-by`
  - `/api/analytics/time-series`
- **Description**: Aggregates financial data by categories and calculates moving averages over time windows.
- **Use Cases**: 
  - Identify top vendors by total spend
  - Calculate monthly averages for transaction values
  - Track daily/weekly/monthly transaction trends

### 2. Linear Regression / Forecasting
- **Implementation**: `linear_regression_forecast()`
- **Endpoint**: `/api/analytics/forecast`
- **Description**: Applies linear regression to time series data and forecasts future values.
- **Use Cases**:
  - Predict future spending trends
  - Forecast transaction volumes
  - Identify seasonal patterns

### 3. Z-Score Outlier Detection
- **Implementation**: `detect_outliers()`
- **Endpoint**: `/api/analytics/outliers`
- **Description**: Uses statistical z-score method to identify unusual transactions.
- **Use Cases**:
  - Detect potentially fraudulent transactions
  - Highlight unusual spending patterns
  - Find data entry errors

### 4. K-Means Clustering
- **Implementation**: `kmeans_clustering()`
- **Endpoints**: 
  - `/api/analytics/clusters`
  - `/api/segments` (compatible with existing frontend)
- **Description**: Groups similar transactions or vendors based on multiple features.
- **Use Cases**:
  - Segment vendors by spending patterns
  - Group transactions by type and amount
  - Identify similar purchase behaviors

### 5. Adaptive Binning
- **Implementation**: `adaptive_binning()`
- **Endpoint**: `/api/analytics/bins`
- **Description**: Uses Freedman-Diaconis rule to create optimal histogram bins.
- **Use Cases**:
  - Create optimal data visualizations
  - Group transactions into meaningful value ranges
  - Optimize dashboard charts for clarity

## How to Use the Analytics API

### Example API Calls:

#### Group By Analysis
```
GET /api/analytics/group-by?field=vendor&agg_field=total&function=sum
```

#### Time Series with Moving Averages
```
GET /api/analytics/time-series?time_field=date&value_field=total&window=7
```

#### Linear Regression Forecast
```
GET /api/analytics/forecast?days=30
```

#### Outlier Detection
```
GET /api/analytics/outliers?field=total&threshold=2.5
```

#### K-Means Clustering
```
GET /api/analytics/clusters?clusters=3&features=total,quantity,unit_price
```

#### Adaptive Binning
```
GET /api/analytics/bins?field=total&max_bins=20
```

## Integration with Frontend

The analytics endpoints can be used directly with the existing frontend components:

- **EnhancedTimeSeriesChart** - use `/api/analytics/time-series` and `/api/analytics/forecast`
- **OutlierDetectionCard** - use `/api/analytics/outliers`
- **SegmentationAnalysisCard** - use `/api/segments` (wrapper around k-means clustering)
- **EnhancedKpiSummary** - use regular metrics API and `/api/analytics/group-by`

All endpoints return properly formatted JSON that can be used directly with the existing visualization components.