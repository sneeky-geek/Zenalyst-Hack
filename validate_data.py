"""
Data Validation and Cleanup Script
=================================

This script performs additional data validation and cleanup on the MongoDB collection
to ensure data quality for the dashboard.
"""

import os
import pandas as pd
import numpy as np
from pymongo import MongoClient
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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

def validate_and_clean_data():
    """Validate and clean data in MongoDB for dashboard consistency"""
    config = load_config()
    mongo_uri = config.get('MONGODB_URI', 'mongodb://localhost:27017/')
    db_name = 'finance_db'
    collection_name = 'transactions'
    
    try:
        # Connect to MongoDB
        client = MongoClient(mongo_uri)
        db = client[db_name]
        collection = db[collection_name]
        
        logger.info(f"Connected to MongoDB: {mongo_uri}")
        
        # Get all documents
        docs = list(collection.find({}))
        logger.info(f"Retrieved {len(docs)} documents for validation")
        
        if not docs:
            logger.warning("No documents found in the collection")
            return
            
        # Convert to DataFrame for easier processing
        df = pd.DataFrame(docs)
        
        # 1. Ensure consistent document types
        if 'document_type' not in df.columns:
            logger.info("Adding document_type field based on file paths")
            
            # Extract document type from source_file
            def extract_document_type(source_file):
                if not source_file or not isinstance(source_file, str):
                    return "Unknown"
                    
                source_lower = source_file.lower()
                if "invoice" in source_lower or "inv-" in source_lower:
                    return "Invoice"
                elif "purchase order" in source_lower or "po-" in source_lower:
                    return "Purchase Order"
                elif "grn" in source_lower:
                    return "Goods Receipt"
                else:
                    return "Other"
            
            # Add document_type field
            df['document_type'] = df.get('source_file', '').apply(extract_document_type)
            
            # Update MongoDB
            for idx, row in df.iterrows():
                collection.update_one(
                    {"_id": row['_id']},
                    {"$set": {"document_type": row['document_type']}}
                )
            
            logger.info("Added document_type field to all documents")
            
        # 2. Standardize date formats
        date_formats = []
        for date_str in df.get('Date', []):
            if isinstance(date_str, str):
                try:
                    # Try parsing date and converting to ISO format
                    parsed_date = datetime.strptime(date_str, '%Y-%m-%d')
                    iso_date = parsed_date.strftime('%Y-%m-%d')
                    
                    # Update in MongoDB if format changed
                    if iso_date != date_str:
                        collection.update_many(
                            {"Date": date_str},
                            {"$set": {"Date": iso_date}}
                        )
                        date_formats.append(f"Standardized: {date_str} → {iso_date}")
                except:
                    # If parsing fails, try to intelligently guess the format
                    try:
                        parsed_date = pd.to_datetime(date_str)
                        iso_date = parsed_date.strftime('%Y-%m-%d')
                        
                        # Update in MongoDB
                        collection.update_many(
                            {"Date": date_str},
                            {"$set": {"Date": iso_date}}
                        )
                        date_formats.append(f"Fixed: {date_str} → {iso_date}")
                    except:
                        date_formats.append(f"Failed: {date_str}")
        
        if date_formats:
            logger.info(f"Standardized date formats: {len(date_formats)} dates processed")
            
        # 3. Ensure numeric fields are properly formatted
        numeric_fields = ['Amount', 'Tax', 'Total']
        for field in numeric_fields:
            if field in df.columns:
                # Convert to numeric and handle errors
                for idx, row in df.iterrows():
                    value = row.get(field)
                    if value is not None:
                        try:
                            # Try to convert to float
                            if isinstance(value, str):
                                # Remove any currency symbols and commas
                                clean_value = value.replace('$', '').replace(',', '').strip()
                                numeric_value = float(clean_value)
                                
                                # Update in MongoDB if needed
                                if str(numeric_value) != value:
                                    collection.update_one(
                                        {"_id": row['_id']},
                                        {"$set": {field: str(numeric_value)}}
                                    )
                        except:
                            logger.warning(f"Could not convert {field} value: {value}")
                
                logger.info(f"Processed numeric field: {field}")
        
        # 4. Fill missing status fields
        if 'Status' in df.columns:
            # Fill missing status with "Unknown"
            missing_status = df['Status'].isna() | (df['Status'] == '')
            if missing_status.any():
                missing_ids = df[missing_status]['_id'].tolist()
                collection.update_many(
                    {"_id": {"$in": missing_ids}},
                    {"$set": {"Status": "Unknown"}}
                )
                logger.info(f"Set missing Status to 'Unknown' for {len(missing_ids)} documents")
        
        logger.info("Data validation and cleanup completed successfully")
        
    except Exception as e:
        logger.error(f"Error validating and cleaning data: {e}")
    finally:
        client.close()
        logger.info("MongoDB connection closed")

if __name__ == "__main__":
    validate_and_clean_data()