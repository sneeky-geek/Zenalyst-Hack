"""
ETL Pipeline for Processing Excel and PDF Files to MongoDB
=========================================================

This module provides a comprehensive ETL pipeline that:
1. Reads Excel (.xlsx, .xls) and PDF files from directories
2. Extracts structured data from Excel sheets
3. Extracts tables from PDFs using Camelot (fallback to text extraction)
4. Normalizes data schema to standard format
5. Loads data into MongoDB

Author: Generated for Finance Data Processing
"""

import os
import glob
import logging
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime
import re
from pathlib import Path

# Load environment variables from config.env file
def load_config():
    """Load configuration from config.env file"""
    config_file = "config.env"
    if os.path.exists(config_file):
        with open(config_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

# Load configuration at module level
load_config()

# MongoDB imports
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, BulkWriteError

# PDF processing imports
import camelot
import pdfplumber

# Date parsing
from dateutil import parser as date_parser

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('etl_pipeline.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class ETLPipeline:
    """Main ETL Pipeline class for processing files and loading to MongoDB"""
    
    def __init__(self, mongo_uri: str = None, 
                 db_name: str = "finance_db", collection_name: str = "transactions"):
        """
        Initialize ETL Pipeline
        
        Args:
            mongo_uri: MongoDB connection string (if None, will look for MONGODB_URI env var)
            db_name: Database name
            collection_name: Collection name for storing transactions
        """
        # Use provided URI, environment variable, or default
        if mongo_uri:
            self.mongo_uri = mongo_uri
        else:
            self.mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        
        self.db_name = db_name
        self.collection_name = collection_name
        self.client = None
        self.db = None
        self.collection = None
        
        # Column mapping for normalization
        self.column_mapping = {
            'invoice_number': 'Invoice_No',
            'invoice_no': 'Invoice_No',
            'invoice number': 'Invoice_No',
            'bill_no': 'Invoice_No',
            'bill no': 'Invoice_No',
            'bill number': 'Invoice_No',
            'inv_no': 'Invoice_No',
            'invoice_id': 'Invoice_No',
            'transaction_id': 'Invoice_No',
            
            'date': 'Date',
            'invoice_date': 'Date',
            'bill_date': 'Date',
            'transaction_date': 'Date',
            'created_date': 'Date',
            
            'vendor': 'Vendor',
            'supplier': 'Vendor',
            'vendor_name': 'Vendor',
            'supplier_name': 'Vendor',
            'company': 'Vendor',
            'customer': 'Vendor',
            'client': 'Vendor',
            
            'amount': 'Amount',
            'net_amount': 'Amount',
            'subtotal': 'Amount',
            'sub_total': 'Amount',
            'base_amount': 'Amount',
            
            'tax': 'Tax',
            'tax_amount': 'Tax',
            'vat': 'Tax',
            'gst': 'Tax',
            'sales_tax': 'Tax',
            
            'total': 'Total',
            'total_amount': 'Total',
            'grand_total': 'Total',
            'final_amount': 'Total',
            
            'status': 'Status',
            'payment_status': 'Status',
            'invoice_status': 'Status'
        }
    
    def connect_to_mongodb(self) -> bool:
        """
        Connect to MongoDB
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            self.client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=5000)
            # Test connection
            self.client.server_info()
            self.db = self.client[self.db_name]
            self.collection = self.db[self.collection_name]
            logger.info(f"✅ Connected to MongoDB: {self.db_name}.{self.collection_name}")
            return True
        except ConnectionFailure as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            return False
    
    def find_files(self, data_dir: str) -> Dict[str, List[str]]:
        """
        Find all Excel and PDF files in directory and subdirectories
        
        Args:
            data_dir: Root directory to search
            
        Returns:
            Dict with 'excel' and 'pdf' keys containing file paths
        """
        files = {'excel': [], 'pdf': []}
        
        # Excel file patterns
        excel_patterns = ['**/*.xlsx', '**/*.xls']
        for pattern in excel_patterns:
            files['excel'].extend(glob.glob(os.path.join(data_dir, pattern), recursive=True))
        
        # PDF file patterns
        pdf_pattern = '**/*.pdf'
        files['pdf'].extend(glob.glob(os.path.join(data_dir, pdf_pattern), recursive=True))
        
        logger.info(f"📁 Found {len(files['excel'])} Excel files and {len(files['pdf'])} PDF files")
        return files
    
    def extract_excel_data(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Extract data from Excel file (all sheets)
        
        Args:
            file_path: Path to Excel file
            
        Returns:
            List of records (dicts) from all sheets
        """
        records = []
        filename = os.path.basename(file_path)
        
        try:
            # Read all sheets
            excel_file = pd.ExcelFile(file_path)
            logger.info(f"📊 Processing Excel file: {filename} ({len(excel_file.sheet_names)} sheets)")
            
            for sheet_name in excel_file.sheet_names:
                try:
                    df = pd.read_excel(file_path, sheet_name=sheet_name)
                    
                    # Skip empty sheets
                    if df.empty:
                        logger.warning(f"⚠️  Empty sheet: {sheet_name} in {filename}")
                        continue
                    
                    # Convert DataFrame to records
                    sheet_records = df.to_dict('records')
                    
                    # Add metadata to each record
                    for record in sheet_records:
                        record['source_file'] = filename
                        record['sheet_name'] = sheet_name
                        record['file_type'] = 'excel'
                        records.append(record)
                    
                    logger.info(f"✅ Extracted {len(sheet_records)} records from sheet: {sheet_name}")
                    
                except Exception as e:
                    logger.error(f"❌ Error processing sheet {sheet_name} in {filename}: {e}")
                    continue
        
        except Exception as e:
            logger.error(f"❌ Error processing Excel file {filename}: {e}")
            return []
        
        return records
    
    def extract_pdf_data(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Extract data from PDF file using Camelot (tables) with pdfplumber fallback
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            List of records (dicts) from PDF
        """
        records = []
        filename = os.path.basename(file_path)
        
        try:
            logger.info(f"📄 Processing PDF file: {filename}")
            
            # First, try Camelot for table extraction
            try:
                tables = camelot.read_pdf(file_path, pages='all', flavor='lattice')
                
                if len(tables) > 0:
                    logger.info(f"📋 Found {len(tables)} tables using Camelot")
                    
                    for i, table in enumerate(tables):
                        df = table.df
                        
                        # Skip empty tables
                        if df.empty:
                            continue
                        
                        # Use first row as headers if they look like headers
                        if len(df) > 1:
                            # Check if first row contains non-numeric data (likely headers)
                            first_row_text = any(isinstance(val, str) and not val.replace('.', '').replace(',', '').isdigit() 
                                               for val in df.iloc[0] if pd.notna(val))
                            if first_row_text:
                                df.columns = df.iloc[0]
                                df = df.drop(df.index[0])
                        
                        # Convert to records
                        table_records = df.to_dict('records')
                        
                        # Add metadata
                        for record in table_records:
                            record['source_file'] = filename
                            record['table_number'] = i + 1
                            record['file_type'] = 'pdf'
                            record['extraction_method'] = 'camelot'
                            records.append(record)
                    
                    logger.info(f"✅ Extracted {len(records)} records from tables")
                    return records
                
            except Exception as e:
                logger.warning(f"⚠️  Camelot failed for {filename}: {e}")
            
            # Fallback to pdfplumber for text extraction
            try:
                with pdfplumber.open(file_path) as pdf:
                    full_text = ""
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            full_text += page_text + "\n"
                    
                    if full_text.strip():
                        record = {
                            'raw_text': full_text.strip(),
                            'source_file': filename,
                            'file_type': 'pdf',
                            'extraction_method': 'pdfplumber',
                            'page_count': len(pdf.pages)
                        }
                        records.append(record)
                        logger.info(f"✅ Extracted text content ({len(full_text)} characters)")
                    else:
                        logger.warning(f"⚠️  No text content found in {filename}")
                        
            except Exception as e:
                logger.error(f"❌ pdfplumber also failed for {filename}: {e}")
        
        except Exception as e:
            logger.error(f"❌ Error processing PDF file {filename}: {e}")
        
        return records
    
    def normalize_column_name(self, col_name: str) -> str:
        """
        Normalize column name using mapping
        
        Args:
            col_name: Original column name
            
        Returns:
            Standardized column name
        """
        if pd.isna(col_name):
            return 'unknown_column'
        
        # Convert to string and normalize
        col_name = str(col_name).lower().strip()
        col_name = re.sub(r'[^\w\s]', '', col_name)  # Remove special characters
        col_name = re.sub(r'\s+', '_', col_name)  # Replace spaces with underscores
        
        return self.column_mapping.get(col_name, col_name)
    
    def parse_date(self, date_value: Any) -> Optional[datetime]:
        """
        Parse various date formats to datetime
        
        Args:
            date_value: Date value in various formats
            
        Returns:
            Parsed datetime or None
        """
        if pd.isna(date_value) or date_value == '':
            return None
        
        try:
            # If it's already a datetime
            if isinstance(date_value, datetime):
                return date_value
            
            # Convert to string
            date_str = str(date_value).strip()
            
            # Try parsing with dateutil
            return date_parser.parse(date_str)
            
        except Exception:
            logger.warning(f"⚠️  Could not parse date: {date_value}")
            return None
    
    def parse_numeric(self, value: Any) -> Optional[float]:
        """
        Parse numeric values (amounts, tax, totals)
        
        Args:
            value: Numeric value in various formats
            
        Returns:
            Parsed float or None
        """
        if pd.isna(value) or value == '':
            return None
        
        try:
            # If it's already numeric
            if isinstance(value, (int, float)):
                return float(value)
            
            # Convert to string and clean
            value_str = str(value).strip()
            
            # Remove currency symbols and commas
            value_str = re.sub(r'[^\d.-]', '', value_str)
            
            if value_str:
                return float(value_str)
            
        except Exception:
            logger.warning(f"⚠️  Could not parse numeric value: {value}")
        
        return None
    
    def normalize_data(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Normalize data schema and types
        
        Args:
            records: List of raw records
            
        Returns:
            List of normalized records
        """
        normalized_records = []
        
        for record in records:
            normalized_record = {}
            
            # First, normalize column names and map values
            temp_record = {}
            for key, value in record.items():
                normalized_key = self.normalize_column_name(key)
                temp_record[normalized_key] = value
            
            # Standard schema fields
            normalized_record['Invoice_No'] = temp_record.get('Invoice_No', '')
            normalized_record['Date'] = self.parse_date(temp_record.get('Date'))
            normalized_record['Vendor'] = temp_record.get('Vendor', '')
            normalized_record['Amount'] = self.parse_numeric(temp_record.get('Amount'))
            normalized_record['Tax'] = self.parse_numeric(temp_record.get('Tax'))
            normalized_record['Total'] = self.parse_numeric(temp_record.get('Total'))
            normalized_record['Status'] = temp_record.get('Status', '')
            
            # Preserve source file and other metadata
            normalized_record['source_file'] = temp_record.get('source_file', '')
            normalized_record['file_type'] = temp_record.get('file_type', '')
            normalized_record['extraction_method'] = temp_record.get('extraction_method', '')
            
            # Add timestamp
            normalized_record['processed_at'] = datetime.now()
            
            # Keep any additional fields that don't map to standard schema
            for key, value in temp_record.items():
                if key not in ['Invoice_No', 'Date', 'Vendor', 'Amount', 'Tax', 'Total', 'Status', 
                              'source_file', 'file_type', 'extraction_method']:
                    normalized_record[f'additional_{key}'] = value
            
            normalized_records.append(normalized_record)
        
        logger.info(f"✅ Normalized {len(normalized_records)} records")
        return normalized_records
    
    def load_to_mongodb(self, records: List[Dict[str, Any]], batch_size: int = 1000) -> bool:
        """
        Load records to MongoDB in batches
        
        Args:
            records: List of normalized records
            batch_size: Number of records per batch
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not records:
            logger.warning("⚠️  No records to load")
            return True
        
        try:
            total_records = len(records)
            inserted_count = 0
            
            # Process in batches
            for i in range(0, total_records, batch_size):
                batch = records[i:i + batch_size]
                
                try:
                    result = self.collection.insert_many(batch, ordered=False)
                    inserted_count += len(result.inserted_ids)
                    logger.info(f"📤 Inserted batch {i//batch_size + 1}: {len(result.inserted_ids)} records")
                    
                except BulkWriteError as e:
                    # Log errors but continue with other batches
                    logger.warning(f"⚠️  Bulk write error in batch {i//batch_size + 1}: {e}")
                    inserted_count += len(e.details.get('writeErrors', []))
            
            logger.info(f"✅ Successfully loaded {inserted_count}/{total_records} records to MongoDB")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error loading to MongoDB: {e}")
            return False
    
    def run_pipeline(self, data_dir: str = "data/raw") -> bool:
        """
        Run the complete ETL pipeline
        
        Args:
            data_dir: Directory containing files to process
            
        Returns:
            bool: True if pipeline completed successfully
        """
        logger.info("🚀 Starting ETL Pipeline")
        
        # Check if data directory exists
        if not os.path.exists(data_dir):
            logger.error(f"❌ Data directory does not exist: {data_dir}")
            return False
        
        # Connect to MongoDB
        if not self.connect_to_mongodb():
            return False
        
        try:
            # Find all files
            files = self.find_files(data_dir)
            
            if not files['excel'] and not files['pdf']:
                logger.warning("⚠️  No Excel or PDF files found")
                return True
            
            all_records = []
            
            # Process Excel files
            for excel_file in files['excel']:
                logger.info(f"🔄 Processing: {os.path.basename(excel_file)}")
                excel_records = self.extract_excel_data(excel_file)
                all_records.extend(excel_records)
            
            # Process PDF files
            for pdf_file in files['pdf']:
                logger.info(f"🔄 Processing: {os.path.basename(pdf_file)}")
                pdf_records = self.extract_pdf_data(pdf_file)
                all_records.extend(pdf_records)
            
            logger.info(f"📊 Total records extracted: {len(all_records)}")
            
            # Normalize data
            if all_records:
                normalized_records = self.normalize_data(all_records)
                
                # Load to MongoDB
                success = self.load_to_mongodb(normalized_records)
                
                if success:
                    logger.info("✅ ETL finished, data stored in MongoDB!")
                    return True
                else:
                    logger.error("❌ ETL failed during MongoDB loading")
                    return False
            else:
                logger.warning("⚠️  No records extracted from files")
                return True
        
        except Exception as e:
            logger.error(f"❌ ETL Pipeline failed: {e}")
            return False
        
        finally:
            # Close MongoDB connection
            if self.client:
                self.client.close()
                logger.info("🔌 MongoDB connection closed")


def main():
    """Main function to run the ETL pipeline"""
    
    # Get configuration from environment variables (loaded from config.env)
    mongo_uri = os.getenv('MONGODB_URI')
    db_name = os.getenv('DATABASE_NAME', 'finance_db')
    collection_name = os.getenv('COLLECTION_NAME', 'transactions')
    data_directory = os.getenv('DATA_DIRECTORY', 'Hackathon/Inputs')
    
    # Initialize pipeline with your MongoDB connection string
    # Option 1: Configuration is loaded from config.env file
    # Option 2: Pass connection string directly (uncomment and modify the line below)
    # pipeline = ETLPipeline(mongo_uri="your_connection_string_here")
    
    pipeline = ETLPipeline(
        mongo_uri=mongo_uri,
        db_name=db_name,
        collection_name=collection_name
    )
    
    # Check if the specific directory exists, otherwise use current directory
    if not os.path.exists(data_directory):
        logger.warning(f"⚠️  {data_directory} not found, using current directory")
        data_directory = "."
    
    success = pipeline.run_pipeline(data_directory)
    
    if success:
        print("✅ ETL finished, data stored in MongoDB!")
    else:
        print("❌ ETL pipeline failed. Check logs for details.")


if __name__ == "__main__":
    main()