"""
MongoDB Index Setup Script
=========================

This script creates indexes on the MongoDB collection to improve query performance
for the dashboard.
"""

import os
from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT
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

def create_indexes():
    """Create MongoDB indexes for better query performance"""
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
        
        # Create indexes
        logger.info("Creating indexes...")
        
        # Text search index
        collection.create_index([
            ("Invoice_No", TEXT),
            ("Vendor", TEXT),
            ("Status", TEXT),
            ("document_type", TEXT)
        ])
        logger.info("Created text search index")
        
        # Date index for time-series queries
        collection.create_index("Date")
        logger.info("Created date index")
        
        # Vendor index for filtering
        collection.create_index("Vendor")
        logger.info("Created vendor index")
        
        # Status index for filtering
        collection.create_index("Status")
        logger.info("Created status index")
        
        # Document type index for filtering
        collection.create_index("document_type")
        logger.info("Created document_type index")
        
        # Amount index for sorting and filtering
        collection.create_index("Amount")
        logger.info("Created amount index")
        
        logger.info("All indexes created successfully")
        
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")
    finally:
        client.close()
        logger.info("MongoDB connection closed")

if __name__ == "__main__":
    create_indexes()