from flask import Flask, request, jsonify
from flask_cors import CORS
import pymongo
import os
import json
import pandas as pd
import numpy as np
import datetime
from werkzeug.utils import secure_filename
import re
import traceback
from analytics_engine import AnalyticsEngine

app = Flask(__name__)
CORS(app)

# MongoDB connection
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["zenalyst"]
collection = db["financial_documents"]

# File upload configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'csv', 'pdf'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/upload', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        return jsonify({'message': 'No files part in the request'}), 400
    
    files = request.files.getlist('files')
    
    if not files or files[0].filename == '':
        return jsonify({'message': 'No files selected'}), 400

    uploaded_files = []
    
    # Create timestamp-based folder to organize uploads
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    batch_folder = os.path.join(app.config['UPLOAD_FOLDER'], f"batch_{timestamp}")
    if not os.path.exists(batch_folder):
        os.makedirs(batch_folder)
    
    for file in files:
        if file and allowed_file(file.filename):
            # Check for relative path (folder upload)
            relative_path = getattr(file, 'filename', '').split('/')
            
            if len(relative_path) > 1:
                # Create directory structure to preserve folder organization
                directory_path = os.path.join(batch_folder, *relative_path[:-1])
                if not os.path.exists(directory_path):
                    os.makedirs(directory_path)
                
                filename = secure_filename(relative_path[-1])
                file_path = os.path.join(directory_path, filename)
            else:
                # Regular file upload
                filename = secure_filename(file.filename)
                file_path = os.path.join(batch_folder, filename)
                
            file.save(file_path)
            # Get relative path from batch folder for display purposes
            rel_path = os.path.relpath(file_path, batch_folder)
            folder_structure = os.path.dirname(rel_path)
            
            uploaded_files.append({
                'filename': filename,
                'path': file_path,
                'size': os.path.getsize(file_path),
                'type': filename.rsplit('.', 1)[1].lower(),
                'folder': folder_structure if folder_structure != '.' else '',
                'relativePath': rel_path
            })
    
    return jsonify({
        'message': f'{len(uploaded_files)} files uploaded successfully',
        'uploadedFiles': uploaded_files,
        'batchFolder': batch_folder
    })

@app.route('/api/process', methods=['POST'])
def process_files():
    data = request.json
    if not data or 'files' not in data:
        return jsonify({'message': 'No files provided for processing'}), 400
    
    files = data['files']
    processed_files = []
    
    for file in files:
        try:
            filename = file['filename']
            file_path = file['path']
            file_type = file['type']
            
            # Process based on file type
            if file_type in ['xlsx', 'xls']:
                # Process Excel file
                result = process_excel_file(file_path, filename)
            elif file_type == 'csv':
                # Process CSV file
                result = process_csv_file(file_path, filename)
            elif file_type == 'pdf':
                # Process PDF file (simplified for this example)
                result = process_pdf_file(file_path, filename)
            else:
                result = {
                    'filename': filename,
                    'success': False,
                    'message': 'Unsupported file format'
                }
            
            processed_files.append(result)
            
        except Exception as e:
            processed_files.append({
                'filename': file['filename'],
                'success': False,
                'message': str(e),
                'error': traceback.format_exc()
            })
    
    # Get updated metrics after processing
    metrics = get_metrics()
    transactions = get_transactions()
    vendors = get_vendors()
    document_counts = get_document_counts()
    
    return jsonify({
        'message': f'Processed {len(processed_files)} files',
        'processedFiles': processed_files,
        'metrics': metrics,
        'transactions': transactions,
        'vendors': vendors,
        'documentCounts': document_counts
    })

def process_excel_file(file_path, filename):
    try:
        # Read Excel file
        df = pd.read_excel(file_path)
        
        # Determine document type based on columns and content
        document_type = detect_document_type(df, filename)
        
        # Extract data based on document type
        records = []
        
        if document_type == "Inventory":
            # Process inventory data
            for _, row in df.iterrows():
                try:
                    record = {
                        'item_code': str(row.get('Item Code', '')),
                        'description': str(row.get('Description', '')),
                        'quantity': float(row.get('Quantity', 0)),
                        'unit_price': float(row.get('Unit Price', 0)),
                        'total_value': float(row.get('Total Value', 0)),
                        'document_type': 'Inventory',
                        'source_file': filename,
                        'processed_date': datetime.datetime.now()
                    }
                    records.append(record)
                except Exception as e:
                    print(f"Error processing row: {e}")
                    continue
        
        elif document_type == "Purchase Order":
            # Process PO data
            for _, row in df.iterrows():
                try:
                    record = {
                        'po_number': str(row.get('PO Number', '')),
                        'vendor': str(row.get('Vendor', '')),
                        'date': pd.to_datetime(row.get('Date')),
                        'item': str(row.get('Item', '')),
                        'quantity': float(row.get('Quantity', 0)),
                        'unit_price': float(row.get('Unit Price', 0)),
                        'total': float(row.get('Total', 0)),
                        'document_type': 'Purchase Order',
                        'source_file': filename,
                        'processed_date': datetime.datetime.now()
                    }
                    records.append(record)
                except Exception as e:
                    print(f"Error processing row: {e}")
                    continue
        
        else:
            # Generic processing for unknown formats
            headers = df.columns.tolist()
            for _, row in df.iterrows():
                record = {
                    'document_type': document_type,
                    'source_file': filename,
                    'processed_date': datetime.datetime.now()
                }
                
                # Add all columns from the dataframe
                for col in headers:
                    try:
                        value = row[col]
                        # Convert pandas timestamp to datetime
                        if isinstance(value, pd.Timestamp):
                            value = value.to_pydatetime()
                        # Convert numpy types to native Python types
                        elif hasattr(value, 'item'):
                            value = value.item()
                        record[col.lower().replace(' ', '_')] = value
                    except:
                        record[col.lower().replace(' ', '_')] = None
                
                records.append(record)
        
        # Insert into MongoDB
        if records:
            collection.insert_many(records)
        
        return {
            'filename': filename,
            'success': True,
            'message': f'Processed {len(records)} records as {document_type}',
            'recordsExtracted': len(records),
            'documentType': document_type
        }
    
    except Exception as e:
        return {
            'filename': filename,
            'success': False,
            'message': f'Error processing Excel file: {str(e)}',
            'error': traceback.format_exc()
        }

def process_csv_file(file_path, filename):
    try:
        # Read CSV file
        df = pd.read_csv(file_path)
        
        # Process similar to Excel
        document_type = detect_document_type(df, filename)
        
        # Generic processing for CSV
        headers = df.columns.tolist()
        records = []
        
        for _, row in df.iterrows():
            record = {
                'document_type': document_type,
                'source_file': filename,
                'processed_date': datetime.datetime.now()
            }
            
            for col in headers:
                try:
                    value = row[col]
                    if isinstance(value, pd.Timestamp):
                        value = value.to_pydatetime()
                    elif hasattr(value, 'item'):
                        value = value.item()
                    record[col.lower().replace(' ', '_')] = value
                except:
                    record[col.lower().replace(' ', '_')] = None
            
            records.append(record)
        
        # Insert into MongoDB
        if records:
            collection.insert_many(records)
        
        return {
            'filename': filename,
            'success': True,
            'message': f'Processed {len(records)} records as {document_type}',
            'recordsExtracted': len(records),
            'documentType': document_type
        }
    
    except Exception as e:
        return {
            'filename': filename,
            'success': False,
            'message': f'Error processing CSV file: {str(e)}',
            'error': traceback.format_exc()
        }

def process_pdf_file(file_path, filename):
    # For PDF files, we would use a PDF parser library
    # This is a simplified version that just records the file metadata
    try:
        # Detect document type from filename
        document_type = "Unknown"
        if "GRN" in filename:
            document_type = "Goods Receipt Note"
        elif "PI-" in filename:
            document_type = "Purchase Invoice"
        elif "PO-" in filename:
            document_type = "Purchase Order"
        elif "SI-" in filename:
            document_type = "Sales Invoice"
        
        # Insert record about the PDF file
        record = {
            'document_type': document_type,
            'source_file': filename,
            'file_path': file_path,
            'processed_date': datetime.datetime.now(),
            'status': 'Metadata only'
        }
        
        collection.insert_one(record)
        
        return {
            'filename': filename,
            'success': True,
            'message': f'Recorded metadata for PDF file as {document_type}',
            'recordsExtracted': 1,
            'documentType': document_type
        }
    
    except Exception as e:
        return {
            'filename': filename,
            'success': False,
            'message': f'Error processing PDF file: {str(e)}',
            'error': traceback.format_exc()
        }

def detect_document_type(df, filename):
    """Detect document type based on dataframe columns and filename"""
    columns = [col.lower() for col in df.columns]
    
    # Check filename first
    if "inventory" in filename.lower():
        return "Inventory"
    if "purchase" in filename.lower() and "order" in filename.lower():
        return "Purchase Order"
    if "invoice" in filename.lower():
        return "Invoice"
    if "grn" in filename.lower():
        return "Goods Receipt Note"
    
    # Check columns
    if 'item code' in columns and 'description' in columns and 'quantity' in columns:
        return "Inventory"
    if 'po number' in columns and 'vendor' in columns:
        return "Purchase Order"
    if 'invoice number' in columns or 'bill number' in columns:
        return "Invoice"
    
    # Default type
    return "Financial Document"

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    try:
        # Total document count
        total_documents = collection.count_documents({})
        
        # Document type counts
        pipeline = [
            {"$group": {"_id": "$document_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        document_types = list(collection.aggregate(pipeline))
        
        # Total value by document type
        value_pipeline = [
            {"$match": {"total": {"$exists": True}}},
            {"$group": {"_id": "$document_type", "total_value": {"$sum": "$total"}}},
            {"$sort": {"total_value": -1}}
        ]
        values_by_type = list(collection.aggregate(value_pipeline))
        
        # Monthly trend
        monthly_pipeline = [
            {"$match": {"date": {"$exists": True}}},
            {"$project": {
                "month": {"$month": "$date"},
                "year": {"$year": "$date"},
                "total": 1
            }},
            {"$group": {
                "_id": {"month": "$month", "year": "$year"},
                "count": {"$sum": 1},
                "total_value": {"$sum": "$total"}
            }},
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]
        monthly_trend = list(collection.aggregate(monthly_pipeline))
        
        return {
            "totalDocuments": total_documents,
            "documentTypes": document_types,
            "valuesByType": values_by_type,
            "monthlyTrend": monthly_trend
        }
    except Exception as e:
        return {"error": str(e)}

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    try:
        # Get the latest transactions
        pipeline = [
            {"$match": {"total": {"$exists": True}}},
            {"$project": {
                "document_type": 1,
                "vendor": 1,
                "date": 1,
                "amount": "$total",
                "source_file": 1
            }},
            {"$sort": {"date": -1}},
            {"$limit": 100}
        ]
        transactions = list(collection.aggregate(pipeline))
        
        # Convert ObjectId to string for JSON serialization
        for transaction in transactions:
            if '_id' in transaction:
                transaction['_id'] = str(transaction['_id'])
            if 'date' in transaction and transaction['date']:
                transaction['date'] = transaction['date'].isoformat()
        
        return transactions
    except Exception as e:
        return {"error": str(e)}

@app.route('/api/vendors', methods=['GET'])
def get_vendors():
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
                vendor['firstTransaction'] = vendor['firstTransaction'].isoformat()
            if 'lastTransaction' in vendor and vendor['lastTransaction']:
                vendor['lastTransaction'] = vendor['lastTransaction'].isoformat()
        
        return vendors
    except Exception as e:
        return {"error": str(e)}

def get_document_counts():
    try:
        pipeline = [
            {"$group": {"_id": "$document_type", "count": {"$sum": 1}}},
            {"$match": {"_id": {"$ne": None}}},
            {"$project": {"document_type": "$_id", "count": 1, "_id": 0}}
        ]
        
        results = list(collection.aggregate(pipeline))
        
        # Convert to dictionary
        document_counts = {}
        for doc in results:
            if 'document_type' in doc:
                document_counts[doc['document_type']] = doc['count']
        
        return document_counts
    
    except Exception as e:
        print(f"Error getting document counts: {e}")
        return {}

# Initialize analytics engine
analytics = AnalyticsEngine(collection)

@app.route('/api/analytics/group-by', methods=['GET'])
def get_group_by_analysis():
    try:
        group_field = request.args.get('field', 'vendor')
        agg_field = request.args.get('agg_field', 'total')
        agg_func = request.args.get('function', 'sum')
        
        results = analytics.group_by_aggregate(group_field, agg_field, agg_func)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/analytics/time-series', methods=['GET'])
def get_time_series_analysis():
    try:
        time_field = request.args.get('time_field', 'date')
        value_field = request.args.get('value_field', 'total')
        window = int(request.args.get('window', 7))
        
        results = analytics.window_function_analysis(time_field, value_field, window)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/analytics/forecast', methods=['GET'])
def get_forecast():
    try:
        time_field = request.args.get('time_field', 'date')
        value_field = request.args.get('value_field', 'total')
        days = int(request.args.get('days', 30))
        
        results = analytics.linear_regression_forecast(time_field, value_field, days)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/analytics/outliers', methods=['GET'])
def get_outliers():
    try:
        field = request.args.get('field', 'total')
        threshold = float(request.args.get('threshold', 2.5))
        
        results = analytics.detect_outliers(field, threshold)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/analytics/clusters', methods=['GET'])
def get_clusters():
    try:
        n_clusters = int(request.args.get('clusters', 3))
        features_str = request.args.get('features', 'total,quantity,unit_price')
        features = features_str.split(',')
        
        results = analytics.kmeans_clustering(n_clusters, features)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/analytics/bins', methods=['GET'])
def get_adaptive_bins():
    try:
        field = request.args.get('field', 'total')
        max_bins = int(request.args.get('max_bins', 20))
        
        results = analytics.adaptive_binning(field, max_bins)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/segments', methods=['GET'])
def get_segments():
    """Endpoint for segmentation that is compatible with existing frontend."""
    try:
        n_clusters = int(request.args.get('clusters', 3))
        features = ['total', 'quantity', 'unit_price']
        
        # Use k-means clustering from analytics engine
        results = analytics.kmeans_clustering(n_clusters, features)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)