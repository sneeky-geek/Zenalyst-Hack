"""
Enhanced API server with optimized analytics endpoints.
Implements advanced aggregation, caching, and analytics algorithms.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import pymongo
import datetime
import pandas as pd
import json
from analytics.core import AnalyticsEngine

app = Flask(__name__)
CORS(app)

# Initialize MongoDB connection
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["zenalyst"]
collection = db["financial_documents"]

# Initialize analytics engine
analytics = AnalyticsEngine()

@app.route('/api/health', methods=['GET'])
def health_check():
    """API health check endpoint."""
    try:
        # Check MongoDB connection
        client.server_info()
        return jsonify({
            "status": "healthy",
            "mongo_connected": True,
            "timestamp": datetime.datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "mongo_connected": False,
            "error": str(e),
            "timestamp": datetime.datetime.now().isoformat()
        }), 500

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """Get optimized dashboard metrics."""
    try:
        # Get query parameters
        time_period = request.args.get('time_period')
        document_type = request.args.get('document_type')
        skip_cache = request.args.get('skip_cache', '').lower() == 'true'
        
        # Get aggregated metrics from analytics engine
        metrics = analytics.get_aggregated_metrics(
            time_period=time_period,
            document_type=document_type,
            use_cache=not skip_cache
        )
        
        # Get monthly trend data
        monthly_trend = analytics.get_time_series_data(
            metric="amount",
            interval="month",
            document_type=document_type,
            use_cache=not skip_cache
        )
        
        # Get document type distribution
        doc_pipeline = [
            {"$group": {"_id": "$document_type", "count": {"$sum": 1}}},
            {"$match": {"_id": {"$ne": None}}},
            {"$sort": {"count": -1}}
        ]
        document_types = list(collection.aggregate(doc_pipeline))
        
        # Get value by document type
        value_pipeline = [
            {"$match": {"total": {"$exists": True}}},
            {"$group": {"_id": "$document_type", "total_value": {"$sum": "$total"}}},
            {"$sort": {"total_value": -1}}
        ]
        values_by_type = list(collection.aggregate(value_pipeline))
        
        # Get KPIs
        kpis = analytics.get_kpis(use_cache=not skip_cache)
        
        return jsonify({
            "totalDocuments": metrics["transaction_count"],
            "documentTypes": document_types,
            "valuesByType": values_by_type,
            "monthlyTrend": monthly_trend,
            "kpis": kpis
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get paginated transactions with optimized filtering."""
    try:
        # Parse query parameters
        limit = int(request.args.get('limit', 10))
        skip = int(request.args.get('skip', 0))
        document_type = request.args.get('document_type')
        
        # Build query
        query = {}
        if document_type:
            query["document_type"] = document_type
        
        # Add date range filter if present
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if start_date or end_date:
            date_query = {}
            if start_date:
                date_query["$gte"] = start_date
            if end_date:
                date_query["$lte"] = end_date
            query["date"] = date_query
            
        # First get total count for pagination
        total_count = collection.count_documents(query)
        
        # Then get paginated results
        cursor = collection.find(query).sort("date", -1).skip(skip).limit(limit)
        transactions = list(cursor)
        
        # Convert ObjectId to string for JSON serialization
        for transaction in transactions:
            if '_id' in transaction:
                transaction['_id'] = str(transaction['_id'])
            if 'date' in transaction and transaction['date']:
                if isinstance(transaction['date'], datetime.datetime):
                    transaction['date'] = transaction['date'].isoformat()
        
        # Enhance transactions with analytics
        if transactions:
            # Get outliers for highlighting unusual transactions
            outliers = analytics.detect_outliers()
            outlier_ids = [o['id'] for o in outliers]
            
            # Mark outliers in the results
            for transaction in transactions:
                transaction_id = str(transaction.get('_id', ''))
                transaction['is_outlier'] = transaction_id in outlier_ids
                
                # Add a reason if it's an outlier
                if transaction['is_outlier']:
                    matching_outlier = next((o for o in outliers if o['id'] == transaction_id), None)
                    if matching_outlier:
                        transaction['outlier_reason'] = matching_outlier['reason']
        
        return jsonify({
            "results": transactions,
            "total": total_count,
            "page": skip // limit + 1 if limit > 0 else 1,
            "pages": (total_count + limit - 1) // limit if limit > 0 else 1
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vendors', methods=['GET'])
def get_vendors():
    """Get vendor statistics with trend detection."""
    try:
        # Get vendor statistics
        pipeline = [
            {"$match": {"vendor": {"$exists": True}, "total": {"$exists": True}}},
            {"$group": {
                "_id": "$vendor",
                "totalAmount": {"$sum": "$total"},
                "transactionCount": {"$sum": 1},
                "firstTransaction": {"$min": "$date"},
                "lastTransaction": {"$max": "$date"}
            }},
            {"$match": {"_id": {"$ne": None}}},
            {"$sort": {"totalAmount": -1}},
            {"$limit": 10},
            {"$project": {
                "name": "$_id",
                "totalAmount": 1,
                "transactionCount": 1,
                "firstTransaction": 1,
                "lastTransaction": 1,
                "_id": 0
            }}
        ]
        vendors = list(collection.aggregate(pipeline))
        
        # Format dates
        for vendor in vendors:
            if 'firstTransaction' in vendor and vendor['firstTransaction']:
                if isinstance(vendor['firstTransaction'], datetime.datetime):
                    vendor['firstTransaction'] = vendor['firstTransaction'].isoformat()
            if 'lastTransaction' in vendor and vendor['lastTransaction']:
                if isinstance(vendor['lastTransaction'], datetime.datetime):
                    vendor['lastTransaction'] = vendor['lastTransaction'].isoformat()
        
        # Enhance with vendor growth trends
        for vendor in vendors:
            # Get vendor's monthly transactions
            vendor_name = vendor['name']
            vendor_monthly_pipeline = [
                {"$match": {"vendor": vendor_name, "total": {"$exists": True}}},
                {"$project": {
                    "month": {"$month": "$date"},
                    "year": {"$year": "$date"},
                    "total": 1
                }},
                {"$group": {
                    "_id": {"month": "$month", "year": "$year"},
                    "total_value": {"$sum": "$total"}
                }},
                {"$sort": {"_id.year": 1, "_id.month": 1}}
            ]
            monthly_data = list(collection.aggregate(vendor_monthly_pipeline))
            
            # Calculate growth trends
            if len(monthly_data) >= 2:
                months = len(monthly_data)
                first_month = monthly_data[0]["total_value"]
                last_month = monthly_data[-1]["total_value"]
                
                # Calculate growth rate
                if first_month > 0:
                    growth_rate = ((last_month - first_month) / first_month) * 100
                else:
                    growth_rate = 0
                
                vendor["growth_rate"] = growth_rate
                vendor["growth_trend"] = "increasing" if growth_rate > 5 else ("decreasing" if growth_rate < -5 else "stable")
                vendor["months_of_data"] = months
            else:
                vendor["growth_rate"] = 0
                vendor["growth_trend"] = "not_enough_data"
                vendor["months_of_data"] = len(monthly_data)
        
        return jsonify(vendors)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/outliers', methods=['GET'])
def get_outliers():
    """Get outlier transactions for further investigation."""
    try:
        # Get parameters
        contamination = float(request.args.get('contamination', 0.05))
        skip_cache = request.args.get('skip_cache', '').lower() == 'true'
        
        # Get outliers from analytics engine
        outliers = analytics.detect_outliers(contamination=contamination, use_cache=not skip_cache)
        
        return jsonify({
            "outliers": outliers,
            "count": len(outliers)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/trends', methods=['GET'])
def get_trends():
    """Get trend analysis for financial metrics."""
    try:
        # Get parameters
        metric = request.args.get('metric', 'amount')
        interval = request.args.get('interval', 'month')
        document_type = request.args.get('document_type')
        skip_cache = request.args.get('skip_cache', '').lower() == 'true'
        
        # Get time series data
        time_series = analytics.get_time_series_data(
            metric=metric,
            interval=interval,
            document_type=document_type,
            use_cache=not skip_cache
        )
        
        # Get trend analysis
        trend_analysis = analytics.detect_trends(use_cache=not skip_cache)
        
        return jsonify({
            "time_series": time_series,
            "trend_analysis": trend_analysis
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/segments', methods=['GET'])
def get_segments():
    """Get customer/vendor segmentation analysis."""
    try:
        # Get parameters
        n_clusters = int(request.args.get('clusters', 3))
        skip_cache = request.args.get('skip_cache', '').lower() == 'true'
        
        # Get segmentation results
        segments = analytics.segment_data(n_clusters=n_clusters, use_cache=not skip_cache)
        
        return jsonify(segments)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/kpis', methods=['GET'])
def get_kpis():
    """Get key performance indicators for the dashboard."""
    try:
        # Get parameters
        skip_cache = request.args.get('skip_cache', '').lower() == 'true'
        
        # Get KPIs from analytics engine
        kpis = analytics.get_kpis(use_cache=not skip_cache)
        
        return jsonify(kpis)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/search', methods=['GET'])
def search_transactions():
    """Search transactions with optimized relevance scoring."""
    try:
        # Get search query
        query_text = request.args.get('query', '')
        if not query_text:
            return jsonify({"results": [], "count": 0})
            
        # Create text search query
        search_query = {
            "$or": [
                {"vendor": {"$regex": query_text, "$options": "i"}},
                {"document_type": {"$regex": query_text, "$options": "i"}},
                {"item": {"$regex": query_text, "$options": "i"}},
                {"description": {"$regex": query_text, "$options": "i"}}
            ]
        }
        
        # Get results with limit
        limit = int(request.args.get('limit', 10))
        results = list(collection.find(search_query).limit(limit))
        
        # Convert ObjectId to string
        for result in results:
            if '_id' in result:
                result['_id'] = str(result['_id'])
            if 'date' in result and result['date']:
                if isinstance(result['date'], datetime.datetime):
                    result['date'] = result['date'].isoformat()
        
        return jsonify({
            "results": results,
            "count": len(results)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)