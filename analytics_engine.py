import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.linear_model import LinearRegression
import datetime

class AnalyticsEngine:
    """Analytics engine with various algorithms for financial data analysis."""
    
    def __init__(self, db_collection):
        """Initialize with MongoDB collection."""
        self.collection = db_collection
    
    def get_transactions_df(self, limit=1000):
        """Get transactions as a pandas DataFrame."""
        pipeline = [
            {"$match": {"total": {"$exists": True}}},
            {"$limit": limit}
        ]
        transactions = list(self.collection.aggregate(pipeline))
        return pd.DataFrame(transactions)
    
    def group_by_aggregate(self, group_field, agg_field="total", agg_func="sum"):
        """Group by and aggregate data.
        
        Args:
            group_field: Field to group by (e.g., 'vendor', 'document_type')
            agg_field: Field to aggregate (e.g., 'total')
            agg_func: Aggregation function ('sum', 'avg', 'min', 'max', 'count')
        
        Returns:
            List of aggregated results
        """
        func_map = {
            "sum": "$sum", 
            "avg": "$avg", 
            "min": "$min", 
            "max": "$max",
            "count": "$sum"
        }
        
        agg_value = 1 if agg_func == "count" else f"${agg_field}"
        
        pipeline = [
            {"$match": {group_field: {"$exists": True}, agg_field: {"$exists": True}}},
            {"$group": {
                "_id": f"${group_field}",
                "value": {func_map[agg_func]: agg_value},
                "count": {"$sum": 1}
            }},
            {"$sort": {"value": -1}},
            {"$project": {
                "category": "$_id",
                "value": 1,
                "count": 1,
                "_id": 0
            }}
        ]
        
        results = list(self.collection.aggregate(pipeline))
        return results
    
    def window_function_analysis(self, time_field="date", value_field="total", window=7):
        """Perform window function analysis (moving averages, etc).
        
        Args:
            time_field: Field containing date/time
            value_field: Field to analyze
            window: Window size for moving calculations
            
        Returns:
            Dictionary with time series and window calculations
        """
        # Get data sorted by time
        pipeline = [
            {"$match": {time_field: {"$exists": True}, value_field: {"$exists": True}}},
            {"$sort": {time_field: 1}},
            {"$project": {
                "date": f"${time_field}",
                "value": f"${value_field}",
                "_id": 0
            }}
        ]
        
        results = list(self.collection.aggregate(pipeline))
        
        # Convert to pandas for easy window calculations
        if not results:
            return {"error": "No data available"}
            
        df = pd.DataFrame(results)
        
        # Make sure date is a datetime
        if isinstance(df['date'].iloc[0], str):
            df['date'] = pd.to_datetime(df['date'])
            
        # Group by date to get daily totals
        df_daily = df.groupby(df['date'].dt.date)['value'].agg(['sum', 'mean', 'count']).reset_index()
        df_daily = df_daily.sort_values('date')
        
        # Calculate moving averages
        if len(df_daily) >= window:
            df_daily['moving_avg'] = df_daily['sum'].rolling(window=window).mean()
            df_daily['moving_std'] = df_daily['sum'].rolling(window=window).std()
        
        # Format for output
        output = []
        for _, row in df_daily.iterrows():
            entry = {
                'date': row['date'].strftime('%Y-%m-%d'),
                'total': float(row['sum']),
                'average': float(row['mean']),
                'count': int(row['count'])
            }
            
            if 'moving_avg' in df_daily.columns and not np.isnan(row['moving_avg']):
                entry['moving_avg'] = float(row['moving_avg'])
                entry['moving_std'] = float(row['moving_std']) if not np.isnan(row['moving_std']) else 0
                
            output.append(entry)
            
        return {
            "time_series": output,
            "window_size": window
        }
        
    def linear_regression_forecast(self, time_field="date", value_field="total", days_to_forecast=30):
        """Perform linear regression and forecast future values.
        
        Args:
            time_field: Field containing date/time
            value_field: Field to forecast
            days_to_forecast: Number of days to forecast into the future
            
        Returns:
            Dictionary with historical and forecasted values
        """
        # Get data sorted by time
        pipeline = [
            {"$match": {time_field: {"$exists": True}, value_field: {"$exists": True}}},
            {"$sort": {time_field: 1}},
            {"$project": {
                "date": f"${time_field}",
                "value": f"${value_field}",
                "_id": 0
            }}
        ]
        
        results = list(self.collection.aggregate(pipeline))
        
        if not results:
            return {"error": "No data available"}
            
        df = pd.DataFrame(results)
        
        # Make sure date is a datetime
        if isinstance(df['date'].iloc[0], str):
            df['date'] = pd.to_datetime(df['date'])
            
        # Group by date and get daily totals
        df_daily = df.groupby(df['date'].dt.date)['value'].sum().reset_index()
        
        if len(df_daily) < 5:  # Need enough data points for regression
            return {"error": "Not enough data points for regression"}
            
        # Create feature: days since first date
        first_date = df_daily['date'].min()
        df_daily['day_number'] = (df_daily['date'] - first_date).dt.days
        
        # Fit linear regression
        X = df_daily[['day_number']]
        y = df_daily['value']
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Create forecast dates
        last_date = df_daily['date'].max()
        forecast_dates = [last_date + datetime.timedelta(days=i+1) for i in range(days_to_forecast)]
        forecast_day_numbers = [(date - first_date).days for date in forecast_dates]
        
        # Predict values
        forecast_values = model.predict(np.array(forecast_day_numbers).reshape(-1, 1))
        
        # Format results
        historical = [
            {"date": row['date'].strftime('%Y-%m-%d'), "value": float(row['value']), "type": "historical"}
            for _, row in df_daily.iterrows()
        ]
        
        forecasted = [
            {"date": date.strftime('%Y-%m-%d'), "value": float(value), "type": "forecast"}
            for date, value in zip(forecast_dates, forecast_values)
        ]
        
        return {
            "historical": historical,
            "forecast": forecasted,
            "slope": float(model.coef_[0]),
            "intercept": float(model.intercept_),
            "r_squared": float(model.score(X, y))
        }
        
    def detect_outliers(self, value_field="total", z_threshold=2.5):
        """Detect outliers using z-score method.
        
        Args:
            value_field: Field to analyze for outliers
            z_threshold: Z-score threshold for outlier detection
            
        Returns:
            Dictionary with outliers and statistics
        """
        pipeline = [
            {"$match": {value_field: {"$exists": True}}},
            {"$project": {
                "value": f"${value_field}",
                "document_type": 1,
                "vendor": 1,
                "date": 1,
                "source_file": 1,
                "_id": 1
            }}
        ]
        
        results = list(self.collection.aggregate(pipeline))
        
        if not results:
            return {"error": "No data available"}
            
        df = pd.DataFrame(results)
        
        # Calculate z-scores
        mean = df['value'].mean()
        std = df['value'].std()
        
        if std == 0:  # Handle case where all values are the same
            df['z_score'] = 0
        else:
            df['z_score'] = (df['value'] - mean) / std
            
        # Identify outliers
        outliers = df[abs(df['z_score']) > z_threshold].copy()
        outliers['_id'] = outliers['_id'].astype(str)  # Convert ObjectId to string
        
        if len(outliers) == 0:
            return {
                "outliers": [],
                "mean": float(mean),
                "std": float(std),
                "threshold": z_threshold
            }
            
        # Format outliers for output
        outlier_list = []
        for _, row in outliers.sort_values(by='z_score', ascending=False).iterrows():
            outlier = {
                "id": row['_id'],
                "amount": float(row['value']),
                "z_score": float(row['z_score']),
                "vendor": row.get('vendor', 'Unknown'),
                "document_type": row.get('document_type', 'Unknown'),
                "date": row['date'].isoformat() if isinstance(row.get('date'), datetime.datetime) else row.get('date', ''),
                "source_file": row.get('source_file', '')
            }
            outlier_list.append(outlier)
            
        return {
            "outliers": outlier_list,
            "mean": float(mean),
            "std": float(std),
            "threshold": z_threshold,
            "count": len(outlier_list)
        }
        
    def kmeans_clustering(self, n_clusters=3, features=None):
        """Perform k-means clustering on transaction data.
        
        Args:
            n_clusters: Number of clusters to form
            features: List of features to use for clustering (defaults to amount and date)
            
        Returns:
            Dictionary with clusters and their characteristics
        """
        if features is None:
            features = ['total', 'quantity', 'unit_price']
            
        # Get data with required features
        match_condition = {feature: {"$exists": True} for feature in features}
        
        pipeline = [
            {"$match": match_condition},
            {"$project": {
                **{feature: f"${feature}" for feature in features},
                "vendor": 1,
                "document_type": 1,
                "_id": 1
            }}
        ]
        
        results = list(self.collection.aggregate(pipeline))
        
        if not results or len(results) < n_clusters:
            return {"error": f"Not enough data points for {n_clusters} clusters"}
            
        df = pd.DataFrame(results)
        
        # Handle missing values
        for feature in features:
            if feature in df.columns:
                df[feature] = pd.to_numeric(df[feature], errors='coerce')
                df[feature].fillna(df[feature].mean(), inplace=True)
            else:
                # If feature doesn't exist, create it with zeros
                df[feature] = 0
                
        # Standardize features
        feature_data = df[features].copy()
        feature_means = feature_data.mean()
        feature_stds = feature_data.std()
        
        # Handle zero std (all values the same)
        for feature in features:
            if feature_stds[feature] == 0:
                feature_stds[feature] = 1
                
        standardized_data = (feature_data - feature_means) / feature_stds
        
        # Apply k-means
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        df['cluster'] = kmeans.fit_predict(standardized_data)
        
        # Get cluster information
        clusters = []
        for i in range(n_clusters):
            cluster_data = df[df['cluster'] == i]
            
            # Get cluster center in original feature space
            center = {}
            for feature in features:
                center[feature] = float(cluster_data[feature].mean())
                
            # Calculate statistics for each feature
            feature_stats = {}
            for feature in features:
                feature_stats[feature] = {
                    "mean": float(cluster_data[feature].mean()),
                    "min": float(cluster_data[feature].min()),
                    "max": float(cluster_data[feature].max()),
                    "std": float(cluster_data[feature].std())
                }
                
            # Determine cluster characteristics
            characteristics = []
            for feature in features:
                global_mean = float(df[feature].mean())
                cluster_mean = float(cluster_data[feature].mean())
                
                if cluster_mean > global_mean * 1.2:
                    characteristics.append(f"High {feature}")
                elif cluster_mean < global_mean * 0.8:
                    characteristics.append(f"Low {feature}")
                    
            # Create cluster info
            cluster_info = {
                "cluster_id": i,
                "size": len(cluster_data),
                "percentage": round((len(cluster_data) / len(df)) * 100, 2),
                "center": center,
                "features": feature_stats,
                "characteristics": characteristics
            }
            clusters.append(cluster_info)
            
        return {
            "clusters": clusters,
            "cluster_stats": clusters,  # For compatibility with frontend
            "features_used": features,
            "total_records": len(df)
        }
        
    def adaptive_binning(self, value_field="total", max_bins=20):
        """Apply adaptive binning using Freedman-Diaconis rule.
        
        Args:
            value_field: Field to bin
            max_bins: Maximum number of bins
            
        Returns:
            Dictionary with bin information
        """
        pipeline = [
            {"$match": {value_field: {"$exists": True}}},
            {"$project": {
                "value": f"${value_field}",
                "_id": 0
            }}
        ]
        
        results = list(self.collection.aggregate(pipeline))
        
        if not results:
            return {"error": "No data available"}
            
        values = [r['value'] for r in results]
        
        # Apply Freedman-Diaconis rule for optimal bin width
        q75, q25 = np.percentile(values, [75, 25])
        iqr = q75 - q25
        n = len(values)
        
        if iqr == 0:  # Handle case where IQR is zero
            bin_width = (max(values) - min(values)) / 10  # Fallback
        else:
            bin_width = 2 * iqr * (n ** (-1/3))  # Freedman-Diaconis rule
            
        # Calculate number of bins
        data_range = max(values) - min(values)
        n_bins = min(int(data_range / bin_width) if bin_width > 0 else max_bins, max_bins)
        n_bins = max(n_bins, 5)  # At least 5 bins
        
        # Create histogram
        hist, bin_edges = np.histogram(values, bins=n_bins)
        
        # Format for output
        bins = []
        for i in range(len(hist)):
            bin_info = {
                "bin": i,
                "min": float(bin_edges[i]),
                "max": float(bin_edges[i+1]),
                "count": int(hist[i]),
                "percentage": float(hist[i] / n * 100)
            }
            bins.append(bin_info)
            
        return {
            "bins": bins,
            "bin_width": float(bin_width),
            "total_count": n,
            "min_value": float(min(values)),
            "max_value": float(max(values)),
            "bin_method": "freedman_diaconis"
        }