#!/usr/bin/env python3
"""
Test script for the ETL Pipeline
================================

This script tests the ETL pipeline with the provided Hackathon data
without requiring MongoDB to be running.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from etl_pipeline import ETLPipeline
import logging

# Set up logging for test
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_file_discovery():
    """Test file discovery functionality"""
    print("🔍 Testing file discovery...")
    
    pipeline = ETLPipeline()
    
    # Test with Hackathon data
    data_dir = "Hackathon/Inputs"
    if os.path.exists(data_dir):
        files = pipeline.find_files(data_dir)
        print(f"✅ Found {len(files['excel'])} Excel files and {len(files['pdf'])} PDF files")
        
        # Show some examples
        if files['excel']:
            print(f"📊 Excel files (first 3): {files['excel'][:3]}")
        if files['pdf']:
            print(f"📄 PDF files (first 3): {files['pdf'][:3]}")
    else:
        print(f"⚠️  {data_dir} not found, testing with current directory")
        files = pipeline.find_files(".")
        print(f"✅ Found {len(files['excel'])} Excel files and {len(files['pdf'])} PDF files")

def test_excel_extraction():
    """Test Excel file extraction"""
    print("\n📊 Testing Excel extraction...")
    
    pipeline = ETLPipeline()
    
    # Look for Excel files in Hackathon data
    data_dir = "Hackathon/Inputs"
    if os.path.exists(data_dir):
        files = pipeline.find_files(data_dir)
        
        if files['excel']:
            # Test with first Excel file
            excel_file = files['excel'][0]
            print(f"🔄 Testing extraction from: {os.path.basename(excel_file)}")
            
            try:
                records = pipeline.extract_excel_data(excel_file)
                print(f"✅ Extracted {len(records)} records")
                
                if records:
                    print(f"📋 First record keys: {list(records[0].keys())}")
                    print(f"📋 First record sample: {dict(list(records[0].items())[:3])}")
                
            except Exception as e:
                print(f"❌ Excel extraction failed: {e}")
        else:
            print("⚠️  No Excel files found to test")
    else:
        print(f"⚠️  {data_dir} not found, skipping Excel test")

def test_pdf_extraction():
    """Test PDF file extraction"""
    print("\n📄 Testing PDF extraction...")
    
    pipeline = ETLPipeline()
    
    # Look for PDF files in Hackathon data
    data_dir = "Hackathon/Inputs"
    if os.path.exists(data_dir):
        files = pipeline.find_files(data_dir)
        
        if files['pdf']:
            # Test with first PDF file
            pdf_file = files['pdf'][0]
            print(f"🔄 Testing extraction from: {os.path.basename(pdf_file)}")
            
            try:
                records = pipeline.extract_pdf_data(pdf_file)
                print(f"✅ Extracted {len(records)} records")
                
                if records:
                    print(f"📋 First record keys: {list(records[0].keys())}")
                    if 'raw_text' in records[0]:
                        text_preview = records[0]['raw_text'][:200] + "..." if len(records[0]['raw_text']) > 200 else records[0]['raw_text']
                        print(f"📋 Text preview: {text_preview}")
                    else:
                        print(f"📋 First record sample: {dict(list(records[0].items())[:3])}")
                
            except Exception as e:
                print(f"❌ PDF extraction failed: {e}")
                print("💡 Note: This might be due to missing system dependencies (ghostscript)")
        else:
            print("⚠️  No PDF files found to test")
    else:
        print(f"⚠️  {data_dir} not found, skipping PDF test")

def test_normalization():
    """Test data normalization"""
    print("\n🔄 Testing data normalization...")
    
    pipeline = ETLPipeline()
    
    # Create sample records with various column name formats
    sample_records = [
        {
            'Invoice Number': 'INV-001',
            'Bill Date': '2024-01-15',
            'Vendor Name': 'ABC Corp',
            'Net Amount': '1000.50',
            'Tax Amount': '100.05',
            'Grand Total': '1100.55',
            'Payment Status': 'Paid',
            'source_file': 'test.xlsx'
        },
        {
            'invoice_no': 'INV-002',
            'transaction_date': '2024-01-16',
            'supplier': 'XYZ Ltd',
            'amount': 2000.75,
            'vat': 200.08,
            'total': 2200.83,
            'status': 'Pending',
            'source_file': 'test2.pdf',
            'raw_text': 'Some extracted text...'
        }
    ]
    
    try:
        normalized = pipeline.normalize_data(sample_records)
        print(f"✅ Normalized {len(normalized)} records")
        
        if normalized:
            print(f"📋 Normalized record keys: {list(normalized[0].keys())}")
            print(f"📋 Sample normalized record:")
            for key, value in list(normalized[0].items())[:8]:
                print(f"    {key}: {value}")
        
    except Exception as e:
        print(f"❌ Normalization failed: {e}")

def main():
    """Run all tests"""
    print("🧪 ETL Pipeline Test Suite")
    print("=" * 50)
    
    # Test individual components
    test_file_discovery()
    test_excel_extraction()
    test_pdf_extraction()
    test_normalization()
    
    print("\n" + "=" * 50)
    print("🏁 Test suite completed!")
    print("\n💡 To run the full pipeline with MongoDB:")
    print("   1. Start MongoDB: brew services start mongodb-community")
    print("   2. Run: python etl_pipeline.py")

if __name__ == "__main__":
    main()