"""
Core analytics module for Zenalyst dashboard.
Implements advanced data analysis algorithms for financial data insights.
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.ensemble import IsolationForest
from sklearn.cluster import KMeans
from sklearn.linear_model import LinearRegression
import scipy.stats as stats
import json
import hashlib
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["zenalyst"]
collection = db["financial_documents"]
cache_collection = db["analytics_cache"]

# Initialize cache collection if it doesn't exist
if "analytics_cache" not in db.list_collection_names():
    db.create_collection("analytics_cache")
    cache_collection.create_index("cache_key", unique=True)
    cache_collection.create_index("timestamp")

class AnalyticsEngine:
    """
    Analytics engine for financial data processing and insights generation.
    Implements algorithms for trend detection, outlier detection, and data optimization.
    """
    
    def __init__(self, data=None):
        """Initialize analytics engine with optional data."""
        self.data = data
        self.cache_ttl = 3600  # Cache time-to-live in seconds (1 hour)
    
    def get_dataframe_from_mongo(self, query=None, limit=None):
        """Convert MongoDB data to pandas DataFrame."""
        if query is None:
            query = {}
            
        cursor = collection.find(query)
        if limit:
            cursor = cursor.limit(limit)
            
        data = list(cursor)
        if not data:
            return pd.DataFrame()
            
        # Convert to pandas DataFrame
        df = pd.DataFrame(data)
        
        # Convert ObjectId to string for JSON serialization
        if '_id' in df.columns:
            df['_id'] = df['_id'].astype(str)
            
        return df
    
    def compute_cache_key(self, query_name, params):
        """Compute a cache key based on query name and parameters."""
        param_str = json.dumps(params, sort_keys=True)
        key_str = f"{query_name}:{param_str}"
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def get_from_cache(self, cache_key):
        """Get data from cache if it exists and is not expired."""
        cache_entry = cache_collection.find_one({"cache_key": cache_key})
        if cache_entry:
            # Check if cache is still valid
            cache_time = cache_entry.get("timestamp")
            if cache_time:
                cache_datetime = datetime.fromisoformat(cache_time)
                if datetime.now() - cache_datetime < timedelta(seconds=self.cache_ttl):
                    return cache_entry.get("data")
        return None
    
    def save_to_cache(self, cache_key, data):
        """Save data to cache with timestamp."""
        cache_entry = {
            "cache_key": cache_key,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        # Upsert cache entry
        cache_collection.update_one(
            {"cache_key": cache_key},
            {"$set": cache_entry},
            upsert=True
        )
    
    def get_aggregated_metrics(self, time_period=None, document_type=None, use_cache=True):
        """
        Get aggregated financial metrics with caching support.
        
        Args:
            time_period: Optional time period filter (e.g., "last_30_days", "last_year")
            document_type: Optional document type filter
            use_cache: Whether to use cached results
        
        Returns:
            Dictionary with aggregated metrics
        """
        # Prepare cache parameters
        params = {
            "time_period": time_period,
            "document_type": document_type
        }
        cache_key = self.compute_cache_key("aggregated_metrics", params)
        
        # Try to get from cache first
        if use_cache:
            cached_data = self.get_from_cache(cache_key)
            if cached_data:
                return cached_data
        
        # Prepare query based on filters
        query = {}
        if document_type:
            query["document_type"] = document_type
            
        if time_period:
            date_filter = {}
            now = datetime.now()
            if time_period == "last_30_days":
                date_filter = {"$gte": (now - timedelta(days=30)).isoformat()}
            elif time_period == "last_90_days":
                date_filter = {"$gte": (now - timedelta(days=90)).isoformat()}
            elif time_period == "last_year":
                date_filter = {"$gte": (now - timedelta(days=365)).isoformat()}
                
            if date_filter:
                query["date"] = date_filter
                
        # Execute aggregation in MongoDB
        pipeline = [
            {"$match": query},
            {"$group": {
                "_id": None,
                "total_amount": {"$sum": "$total"},
                "avg_amount": {"$avg": "$total"},
                "count": {"$sum": 1},
                "min_amount": {"$min": "$total"},
                "max_amount": {"$max": "$total"}
            }}
        ]
        
        result = list(collection.aggregate(pipeline))
        
        # Format the response
        if result:
            metrics = {
                "total_amount": result[0].get("total_amount", 0),
                "average_transaction": result[0].get("avg_amount", 0),
                "transaction_count": result[0].get("count", 0),
                "min_amount": result[0].get("min_amount", 0),
                "max_amount": result[0].get("max_amount", 0)
            }
        else:
            metrics = {
                "total_amount": 0,
                "average_transaction": 0,
                "transaction_count": 0,
                "min_amount": 0,
                "max_amount": 0
            }
        
        # Save to cache
        self.save_to_cache(cache_key, metrics)
        
        return metrics
    
    def get_time_series_data(self, metric="amount", interval="month", document_type=None, use_cache=True):
        """
        Get time series data with specified aggregation interval.
        
        Args:
            metric: Metric to aggregate (amount, count)
            interval: Time interval for aggregation (day, week, month, quarter, year)
            document_type: Optional filter by document type
            use_cache: Whether to use cached results
            
        Returns:
            List of time series data points
        """
        # Prepare cache parameters
        params = {
            "metric": metric,
            "interval": interval,
            "document_type": document_type
        }
        cache_key = self.compute_cache_key("time_series", params)
        
        # Try to get from cache first
        if use_cache:
            cached_data = self.get_from_cache(cache_key)
            if cached_data:
                return cached_data
                
        # Prepare query based on filters
        query = {}
        if document_type:
            query["document_type"] = document_type
            
        # Date grouping based on interval
        date_grouping = {
            "day": {
                "year": {"$year": "$date"},
                "month": {"$month": "$date"},
                "day": {"$dayOfMonth": "$date"}
            },
            "week": {
                "year": {"$year": "$date"},
                "week": {"$week": "$date"}
            },
            "month": {
                "year": {"$year": "$date"},
                "month": {"$month": "$date"}
            },
            "quarter": {
                "year": {"$year": "$date"},
                "quarter": {"$ceil": {"$divide": [{"$month": "$date"}, 3]}}
            },
            "year": {
                "year": {"$year": "$date"}
            }
        }
        
        # Default to monthly if interval is not recognized
        group_by = date_grouping.get(interval, date_grouping["month"])
        
        # Execute aggregation in MongoDB
        pipeline = [
            {"$match": query},
            {"$group": {
                "_id": group_by,
                "total": {"$sum": "$total"},
                "count": {"$sum": 1},
                "avg": {"$avg": "$total"}
            }},
            {"$sort": {"_id.year": 1, "_id.month": 1 if "month" in group_by else -1}}
        ]
        
        result = list(collection.aggregate(pipeline))
        
        # Format the result
        time_series = []
        for item in result:
            period = item["_id"]
            
            # Format date string based on interval
            if interval == "day":
                period_str = f"{period['year']}-{period['month']:02d}-{period['day']:02d}"
            elif interval == "week":
                period_str = f"{period['year']}-W{period['week']:02d}"
            elif interval == "month":
                period_str = f"{period['year']}-{period['month']:02d}"
            elif interval == "quarter":
                period_str = f"{period['year']}-Q{period['quarter']}"
            else:  # year
                period_str = f"{period['year']}"
                
            # Select the requested metric
            if metric == "count":
                value = item["count"]
            elif metric == "average":
                value = item["avg"]
            else:  # amount (default)
                value = item["total"]
                
            time_series.append({
                "period": period_str,
                "value": value
            })
        
        # Calculate moving averages if we have enough data points
        if len(time_series) >= 3:
            values = [point["value"] for point in time_series]
            # 3-point moving average
            moving_avg = self.calculate_moving_average(values, 3)
            
            for i, avg in enumerate(moving_avg):
                if i < len(time_series):
                    time_series[i]["moving_avg"] = avg
        
        # Save to cache
        self.save_to_cache(cache_key, time_series)
        
        return time_series
    
    def calculate_moving_average(self, values, window_size=3):
        """Calculate moving average with specified window size."""
        result = []
        for i in range(len(values)):
            # Get window of values
            window_start = max(0, i - window_size + 1)
            window = values[window_start:i+1]
            # Calculate average
            avg = sum(window) / len(window)
            result.append(avg)
        return result
    
    def detect_outliers(self, data=None, features=None, contamination=0.05, use_cache=True):
        """
        Detect outliers in financial data using Isolation Forest algorithm.
        
        Args:
            data: Optional DataFrame to use (otherwise will query from MongoDB)
            features: List of features to use for outlier detection
            contamination: Expected proportion of outliers
            use_cache: Whether to use cached results
            
        Returns:
            DataFrame with outliers flagged
        """
        # Prepare cache parameters
        params = {
            "features": features,
            "contamination": contamination
        }
        cache_key = self.compute_cache_key("outliers", params)
        
        # Try to get from cache first
        if use_cache:
            cached_data = self.get_from_cache(cache_key)
            if cached_data:
                return cached_data
                
        # Get data if not provided
        if data is None:
            # Query all documents with numeric 'total' field
            df = self.get_dataframe_from_mongo({"total": {"$exists": True, "$type": "number"}})
        else:
            df = data.copy()
            
        if df.empty:
            return []
            
        # Default features if not specified
        if features is None:
            numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
            features = [col for col in numeric_cols if col in ['total', 'amount', 'unit_price', 'quantity']]
            
        # Need at least one feature
        if not features or not all(f in df.columns for f in features):
            return []
            
        # Prepare feature matrix
        X = df[features].fillna(0)
        
        # Apply Isolation Forest
        clf = IsolationForest(contamination=contamination, random_state=42)
        outliers = clf.fit_predict(X)
        
        # -1 for outliers, 1 for inliers
        df['is_outlier'] = [1 if x == -1 else 0 for x in outliers]
        
        # Calculate outlier score (higher means more anomalous)
        df['outlier_score'] = -clf.score_samples(X)
        
        # Get top outliers
        outlier_df = df[df['is_outlier'] == 1].sort_values('outlier_score', ascending=False)
        
        # Prepare result with reason for outlier
        outliers_result = []
        for _, row in outlier_df.iterrows():
            # Determine which feature(s) contributed most to outlier detection
            feature_values = {}
            for feature in features:
                value = row[feature]
                # Get z-score to see how far from mean
                if feature in df.columns:
                    feature_mean = df[feature].mean()
                    feature_std = df[feature].std()
                    if feature_std > 0:
                        z_score = (value - feature_mean) / feature_std
                    else:
                        z_score = 0
                    feature_values[feature] = {
                        'value': value,
                        'z_score': z_score
                    }
            
            # Find feature with highest absolute z-score
            max_feature = max(feature_values.items(), key=lambda x: abs(x[1]['z_score']))
            max_feature_name = max_feature[0]
            max_z_score = max_feature[1]['z_score']
            
            # Determine if high or low
            direction = "high" if max_z_score > 0 else "low"
            
            # Create outlier record
            outlier = {
                'id': str(row.get('_id', '')),
                'document_type': row.get('document_type', 'Unknown'),
                'vendor': row.get('vendor', 'Unknown'),
                'amount': row.get('total', 0),
                'date': row.get('date', ''),
                'outlier_score': row['outlier_score'],
                'primary_factor': max_feature_name,
                'z_score': max_z_score,
                'reason': f"Unusually {direction} {max_feature_name} ({abs(max_z_score):.1f} std. dev. from mean)"
            }
            outliers_result.append(outlier)
        
        # Save to cache
        self.save_to_cache(cache_key, outliers_result)
        
        return outliers_result
    
    def detect_trends(self, data=None, metric_column='total', date_column='date', use_cache=True):
        """
        Detect trends in time series data using linear regression.
        
        Args:
            data: Optional DataFrame to use
            metric_column: Column name containing the metric values
            date_column: Column name containing dates
            use_cache: Whether to use cached results
            
        Returns:
            Dictionary with trend analysis results
        """
        # Prepare cache parameters
        params = {
            "metric_column": metric_column,
            "date_column": date_column
        }
        cache_key = self.compute_cache_key("trends", params)
        
        # Try to get from cache first
        if use_cache:
            cached_data = self.get_from_cache(cache_key)
            if cached_data:
                return cached_data
                
        # Get data if not provided
        if data is None:
            # Get time series data by month for trend analysis
            time_series = self.get_time_series_data(metric="amount", interval="month")
            
            # Convert to DataFrame
            df = pd.DataFrame(time_series)
            if df.empty or 'period' not in df.columns or 'value' not in df.columns:
                return {
                    "trend_direction": "neutral",
                    "trend_strength": 0,
                    "trend_confidence": 0,
                    "forecast": []
                }
                
            # Rename columns to match expected names
            df = df.rename(columns={'period': date_column, 'value': metric_column})
        else:
            df = data.copy()
            
        if df.empty or metric_column not in df.columns or date_column not in df.columns:
            return {
                "trend_direction": "neutral",
                "trend_strength": 0,
                "trend_confidence": 0,
                "forecast": []
            }
            
        # Convert date to ordinal for regression
        if isinstance(df[date_column].iloc[0], str):
            # Handle different date formats
            try:
                df['date_ordinal'] = pd.to_datetime(df[date_column]).map(datetime.toordinal)
            except:
                # If date conversion fails, just use index
                df['date_ordinal'] = np.arange(len(df))
        else:
            df['date_ordinal'] = np.arange(len(df))
            
        # Prepare X and y
        X = df['date_ordinal'].values.reshape(-1, 1)
        y = df[metric_column].values
        
        # Apply linear regression
        model = LinearRegression()
        model.fit(X, y)
        
        # Get slope and intercept
        slope = model.coef_[0]
        intercept = model.intercept_
        
        # Calculate R-squared
        y_pred = model.predict(X)
        ss_total = np.sum((y - np.mean(y)) ** 2)
        ss_residual = np.sum((y - y_pred) ** 2)
        r_squared = 1 - (ss_residual / ss_total) if ss_total != 0 else 0
        
        # Determine trend direction and strength
        if abs(slope) < 0.001:
            trend_direction = "neutral"
            trend_strength = 0
        elif slope > 0:
            trend_direction = "increasing"
            trend_strength = min(1, abs(slope) * 10)  # Normalize to 0-1 scale
        else:
            trend_direction = "decreasing"
            trend_strength = min(1, abs(slope) * 10)  # Normalize to 0-1 scale
            
        # Calculate forecast for next 3 periods
        forecast = []
        last_date_ordinal = df['date_ordinal'].iloc[-1]
        
        for i in range(1, 4):
            next_date_ordinal = last_date_ordinal + i
            next_value = model.predict([[next_date_ordinal]])[0]
            
            # Ensure forecast value is not negative for financial data
            next_value = max(0, next_value)
            
            forecast.append({
                "period_index": i,
                "value": next_value
            })
            
        # Calculate trend confidence (based on R-squared)
        trend_confidence = max(0, min(1, r_squared))
        
        result = {
            "trend_direction": trend_direction,
            "trend_strength": float(trend_strength),
            "trend_confidence": float(trend_confidence),
            "forecast": forecast
        }
        
        # Save to cache
        self.save_to_cache(cache_key, result)
        
        return result
    
    def segment_data(self, data=None, features=None, n_clusters=3, use_cache=True):
        """
        Segment data using K-means clustering.
        
        Args:
            data: Optional DataFrame to use
            features: List of features to use for clustering
            n_clusters: Number of clusters to create
            use_cache: Whether to use cached results
            
        Returns:
            Dictionary with clustering results
        """
        # Prepare cache parameters
        params = {
            "features": features,
            "n_clusters": n_clusters
        }
        cache_key = self.compute_cache_key("segments", params)
        
        # Try to get from cache first
        if use_cache:
            cached_data = self.get_from_cache(cache_key)
            if cached_data:
                return cached_data
                
        # Get data if not provided
        if data is None:
            df = self.get_dataframe_from_mongo({"total": {"$exists": True, "$type": "number"}})
        else:
            df = data.copy()
            
        if df.empty:
            return {
                "clusters": [],
                "cluster_stats": []
            }
            
        # Default features if not specified
        if features is None:
            numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
            features = [col for col in numeric_cols if col in ['total', 'amount', 'unit_price', 'quantity']]
            
        # Need at least one feature
        if not features or not all(f in df.columns for f in features):
            return {
                "clusters": [],
                "cluster_stats": []
            }
            
        # Prepare feature matrix
        X = df[features].fillna(df[features].mean())
        
        # Apply K-means clustering
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        df['cluster'] = kmeans.fit_predict(X)
        
        # Calculate cluster statistics
        cluster_stats = []
        for i in range(n_clusters):
            cluster_df = df[df['cluster'] == i]
            
            # Skip empty clusters
            if cluster_df.empty:
                continue
                
            # Calculate statistics for each feature
            feature_stats = {}
            for feature in features:
                if feature in cluster_df:
                    feature_stats[feature] = {
                        "mean": float(cluster_df[feature].mean()),
                        "min": float(cluster_df[feature].min()),
                        "max": float(cluster_df[feature].max())
                    }
            
            # Determine dominant characteristics
            characteristics = []
            for feature in features:
                if feature in feature_stats:
                    # Compare to overall mean
                    overall_mean = df[feature].mean()
                    cluster_mean = feature_stats[feature]["mean"]
                    
                    if cluster_mean > overall_mean * 1.5:
                        characteristics.append(f"Very high {feature}")
                    elif cluster_mean > overall_mean * 1.2:
                        characteristics.append(f"High {feature}")
                    elif cluster_mean < overall_mean * 0.5:
                        characteristics.append(f"Very low {feature}")
                    elif cluster_mean < overall_mean * 0.8:
                        characteristics.append(f"Low {feature}")
            
            cluster_stats.append({
                "cluster_id": i,
                "size": len(cluster_df),
                "percentage": round(len(cluster_df) / len(df) * 100, 1),
                "features": feature_stats,
                "characteristics": characteristics
            })
        
        # Calculate cluster centers for visualization
        centers = kmeans.cluster_centers_
        clusters = []
        
        for i, center in enumerate(centers):
            cluster = {
                "cluster_id": i,
                "center": {}
            }
            for j, feature in enumerate(features):
                cluster["center"][feature] = float(center[j])
            clusters.append(cluster)
        
        result = {
            "clusters": clusters,
            "cluster_stats": cluster_stats
        }
        
        # Save to cache
        self.save_to_cache(cache_key, result)
        
        return result
    
    def get_kpis(self, use_cache=True):
        """
        Get key performance indicators (KPIs) for the dashboard.
        
        Args:
            use_cache: Whether to use cached results
            
        Returns:
            Dictionary with KPI data
        """
        # Prepare cache key
        cache_key = self.compute_cache_key("kpis", {})
        
        # Try to get from cache first
        if use_cache:
            cached_data = self.get_from_cache(cache_key)
            if cached_data:
                return cached_data
                
        # Get aggregated metrics
        metrics = self.get_aggregated_metrics()
        
        # Get time series data
        time_series = self.get_time_series_data(metric="amount", interval="month")
        
        # Calculate month-over-month growth
        mom_growth = 0
        if len(time_series) >= 2:
            current = time_series[-1]["value"]
            previous = time_series[-2]["value"]
            mom_growth = ((current - previous) / previous) * 100 if previous != 0 else 0
        
        # Calculate average transaction value
        avg_transaction = metrics["average_transaction"]
        
        # Get vendor stats
        vendor_pipeline = [
            {"$match": {"vendor": {"$exists": True}}},
            {"$group": {
                "_id": "$vendor",
                "total_amount": {"$sum": "$total"},
                "transaction_count": {"$sum": 1}
            }},
            {"$sort": {"total_amount": -1}},
            {"$limit": 1}
        ]
        
        top_vendor_result = list(collection.aggregate(vendor_pipeline))
        top_vendor = {
            "name": top_vendor_result[0]["_id"] if top_vendor_result else "Unknown",
            "amount": top_vendor_result[0]["total_amount"] if top_vendor_result else 0,
            "transaction_count": top_vendor_result[0]["transaction_count"] if top_vendor_result else 0
        }
        
        # Get document type stats
        doc_pipeline = [
            {"$group": {
                "_id": "$document_type",
                "count": {"$sum": 1},
                "total_amount": {"$sum": "$total"}
            }},
            {"$sort": {"count": -1}},
            {"$limit": 1}
        ]
        
        top_doc_result = list(collection.aggregate(doc_pipeline))
        top_document_type = {
            "type": top_doc_result[0]["_id"] if top_doc_result else "Unknown",
            "count": top_doc_result[0]["count"] if top_doc_result else 0,
            "amount": top_doc_result[0]["total_amount"] if top_doc_result else 0
        }
        
        # Detect outliers
        outliers = self.detect_outliers()
        outlier_count = len(outliers)
        
        # Detect trends
        trend_analysis = self.detect_trends()
        
        kpis = {
            "total_transactions": metrics["transaction_count"],
            "total_amount": metrics["total_amount"],
            "average_transaction": avg_transaction,
            "month_over_month_growth": mom_growth,
            "top_vendor": top_vendor,
            "top_document_type": top_document_type,
            "outlier_count": outlier_count,
            "trend_direction": trend_analysis["trend_direction"],
            "trend_strength": trend_analysis["trend_strength"],
            "trend_confidence": trend_analysis["trend_confidence"]
        }
        
        # Save to cache
        self.save_to_cache(cache_key, kpis)
        
        return kpis