"""
API Server for Zenalyst Dashboard
=================================

This module provides REST API endpoints to serve data from MongoDB to the dashboard.
"""

import os
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import json_util
from datetime import datetime, timedelta
import pandas as pd

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load configuration from config.env
def load_config():
    """Load configuration from config.env file"""
    config = {}
    config_file = "config.env"
    if os.path.exists(config_file):
        with open(config_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    config[key] = value
    return config

config = load_config()
mongo_uri = config.get('MONGODB_URI', 'mongodb://localhost:27017/')
db_name = 'finance_db'
collection_name = 'transactions'

# Connect to MongoDB
client = MongoClient(mongo_uri)
db = client[db_name]
collection = db[collection_name]

# Helper function to parse MongoDB BSON to JSON
def parse_json(data):
    """Convert MongoDB BSON to JSON serializable format"""
    return json.loads(json_util.dumps(data))

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        client.server_info()  # Check if MongoDB is accessible
        return jsonify({"status": "healthy", "message": "API server is running and connected to MongoDB"})
    except Exception as e:
        return jsonify({"status": "unhealthy", "message": str(e)}), 500

@app.route('/api/summary', methods=['GET'])
def get_summary():
    """Get summary statistics of all transactions"""
    try:
        # Count total documents
        total_docs = collection.count_documents({})
        
        # Get summary statistics
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_amount": {"$sum": {"$toDouble": "$Amount"}},
                    "total_tax": {"$sum": {"$toDouble": "$Tax"}},
                    "total_invoices": {"$sum": 1},
                    "avg_amount": {"$avg": {"$toDouble": "$Amount"}},
                    "max_amount": {"$max": {"$toDouble": "$Amount"}},
                    "min_amount": {"$min": {"$toDouble": "$Amount"}}
                }
            }
        ]
        summary = list(collection.aggregate(pipeline))
        
        # Get document types count
        document_types = collection.distinct("document_type")
        type_counts = {}
        for doc_type in document_types:
            count = collection.count_documents({"document_type": doc_type})
            type_counts[doc_type] = count
        
        return jsonify({
            "total_records": total_docs,
            "document_types": type_counts,
            "financial_summary": parse_json(summary[0]) if summary else {}
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get transactions with optional filtering and pagination"""
    try:
        # Get query parameters
        limit = int(request.args.get('limit', 100))
        skip = int(request.args.get('skip', 0))
        document_type = request.args.get('document_type')
        
        # Build query
        query = {}
        if document_type:
            query["document_type"] = document_type
            
        # Get transactions
        transactions = list(collection.find(query).skip(skip).limit(limit))
        
        # Return results
        return jsonify({
            "total": collection.count_documents(query),
            "results": parse_json(transactions)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/transactions/monthly', methods=['GET'])
def get_monthly_transactions():
    """Get monthly transaction totals"""
    try:
        pipeline = [
            {
                "$addFields": {
                    "parsed_date": {"$dateFromString": {"dateString": "$Date", "onError": datetime.now()}}
                }
            },
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$parsed_date"},
                        "month": {"$month": "$parsed_date"}
                    },
                    "count": {"$sum": 1},
                    "total_amount": {"$sum": {"$toDouble": "$Amount"}},
                }
            },
            {
                "$sort": {"_id.year": 1, "_id.month": 1}
            }
        ]
        
        results = list(collection.aggregate(pipeline))
        return jsonify(parse_json(results))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vendors', methods=['GET'])
def get_vendors():
    """Get vendor statistics"""
    try:
        pipeline = [
            {
                "$group": {
                    "_id": "$Vendor",
                    "count": {"$sum": 1},
                    "total_amount": {"$sum": {"$toDouble": "$Amount"}},
                    "transactions": {"$push": "$_id"}
                }
            },
            {
                "$sort": {"total_amount": -1}
            }
        ]
        
        results = list(collection.aggregate(pipeline))
        return jsonify(parse_json(results))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/transactions/status', methods=['GET'])
def get_status_summary():
    """Get transaction status summary"""
    try:
        pipeline = [
            {
                "$group": {
                    "_id": "$Status",
                    "count": {"$sum": 1},
                    "total_amount": {"$sum": {"$toDouble": "$Amount"}}
                }
            }
        ]
        
        results = list(collection.aggregate(pipeline))
        return jsonify(parse_json(results))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/search', methods=['GET'])
def search_transactions():
    """Search transactions"""
    try:
        query = request.args.get('query', '')
        
        if not query:
            return jsonify({"error": "Search query is required"}), 400
        
        # Text search query
        search_results = list(collection.find(
            {"$text": {"$search": query}}
        ).limit(100))
        
        if not search_results:
            # Fallback to regex search if no text index
            search_regex = {"$regex": query, "$options": "i"}
            search_results = list(collection.find({
                "$or": [
                    {"Invoice_No": search_regex},
                    {"Vendor": search_regex},
                    {"Status": search_regex}
                ]
            }).limit(100))
        
        return jsonify(parse_json(search_results))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Create text index for search if it doesn't exist
    try:
        collection.create_index([
            ("Invoice_No", "text"),
            ("Vendor", "text"),
            ("Status", "text")
        ])
        print("Search index created successfully")
    except Exception as e:
        print(f"Warning: Could not create search index: {e}")
        
    # Run the Flask server
    app.run(host='0.0.0.0', port=5000, debug=True)