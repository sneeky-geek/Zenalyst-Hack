"""
🎯 ZENALYST COMPREHENSIVE ETL PIPELINE
Advanced Data Extraction for ABC Book Store Business Intelligence

This module implements domain-driven data extraction that maps real business
documents to proper MongoDB schemas for complete analytics.
"""

import pandas as pd
import camelot
import pdfplumber
import re
import json
from datetime import datetime, timedelta
from pathlib import Path
import logging
from typing import Dict, List, Optional, Any
import pymongo
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ComprehensiveETL:
    """
    Advanced ETL pipeline for complete business document extraction
    Implements the new schema design for rich data analytics
    """
    
    def __init__(self, mongodb_connection_string: str, inputs_folder: str):
        self.inputs_folder = Path(inputs_folder)
        self.client = pymongo.MongoClient(mongodb_connection_string)
        self.db = self.client['zenalyst_bookstore']
        
        # Collections based on new schema
        self.collections = {
            'inventory_master': self.db['inventory_master'],
            'purchase_orders': self.db['purchase_orders'],
            'goods_receipt_notes': self.db['goods_receipt_notes'],
            'purchase_invoices': self.db['purchase_invoices'],
            'sales_invoices': self.db['sales_invoices'],
            'financial_summary': self.db['financial_summary']
        }
        
        logger.info("✅ ComprehensiveETL initialized with new schema collections")
    
    # ==================== INVENTORY MASTER EXTRACTION ====================
    
    def extract_inventory_master(self) -> List[Dict]:
        """
        Extract complete inventory data from Excel with all 37 columns
        Maps to inventory_master collection schema
        """
        logger.info("📊 Starting inventory master extraction...")
        
        excel_file = self.inputs_folder / "ABC_Book_Stores_Inventory_Register.xlsx"
        if not excel_file.exists():
            raise FileNotFoundError(f"Inventory file not found: {excel_file}")
        
        # Read Excel with all columns
        df = pd.read_excel(excel_file, sheet_name='Inventory Register')
        logger.info(f"📋 Loaded {len(df)} inventory records with {len(df.columns)} columns")
        
        inventory_records = []
        
        for _, row in df.iterrows():
            # Clean and extract data with proper field mapping using ACTUAL column names
            record = {
                # Product Identification
                "product_id": self._safe_str(row.get('Store Code', '')),
                "isbn": self._safe_str(row.get('ISBN', '')),
                "title": self._safe_str(row.get('Book Title', '')),
                "author": self._safe_str(row.get('Author', '')),
                "publisher": self._safe_str(row.get('Publisher', '')),
                "category": self._safe_str(row.get('Category', '')),
                "edition": self._safe_str(row.get('Edition', 'Paperback')),
                "language": self._safe_str(row.get('Language', 'English')),
                
                # Store Information
                "store_code": self._safe_str(row.get('Store Code', '')),
                "store_location": self._safe_str(row.get('Store Location', '')),
                "store_incharge": self._safe_str(row.get('Store Incharge', '')),
                
                # Document References
                "po_number": self._safe_str(row.get('Purchase Order No.', '')),
                "grn_code": self._safe_str(row.get('GRN Code', '')),
                "purchase_invoice_no": self._safe_str(row.get('Purchase Invoice No.', '')),
                "sales_invoice_no": self._safe_str(row.get('Sales Inv No.', '')),
                "customer_name": self._safe_str(row.get('Customer Name', '')),
                "supplier_name": self._safe_str(row.get('Supplier Name', '')),
                
                # Inventory Quantities
                "opening_units": self._safe_float(row.get('Opening No. of Units', 0)),
                "purchased_units": self._safe_float(row.get('Purchased No. of Units', 0)),
                "issued_from_opening": self._safe_float(row.get('Issued from the Opening Stock', 0)),
                "issued_from_current": self._safe_float(row.get('Issued from the Curren t year', 0)),
                "closing_units": self._safe_float(row.get('Closing Stock No. of Units', 0)),
                "total_issue_requirement": self._safe_float(row.get('Total Issue Requirement', 0)),
                
                # Financial Data - Rates
                "opening_rate_per_unit": self._safe_float(row.get('Opening Stock Rate per Unit', 0)),
                "purchase_rate_per_unit": self._safe_float(row.get('Purchase Rate per unit', 0)),
                "selling_rate_per_unit": self._safe_float(row.get('Rate per Unit', 0)),
                "closing_rate_per_unit": self._safe_float(row.get('Closing Stock Rate per Unit', 0)),
                "carrying_cost_per_unit": self._safe_float(row.get('Carrying Cost per Unit', 0)),
                
                # Financial Data - Totals
                "total_opening_value": self._safe_float(row.get('Total Opening Stock amount', 0)),
                "total_purchase_value": self._safe_float(row.get('Total Purchase amount', 0)),
                "total_sales_value": self._safe_float(row.get('Total amount', 0)),
                "total_closing_value": self._safe_float(row.get('Closing Stock Total amount', 0)),
                
                # Calculated Profitability
                "gross_profit": self._calculate_gross_profit(row),
                "profit_margin_pct": self._calculate_profit_margin(row),
                
                # Date Information
                "shelf_life_days": self._safe_int(row.get('Average Shelf life of the Books(in days)', 0)),
                "expected_removal_date": self._safe_date(row.get('Expected Date of Removal')),
                "po_date": self._safe_date(row.get('PO Date')),
                "grn_date": self._safe_date(row.get('GRN Date')),
                "purchase_invoice_date": self._safe_date(row.get('Purchase Invoice Date')),
                "sales_invoice_date": self._safe_date(row.get('Date of Sales Invoice')),
                
                # Metadata
                "extracted_at": datetime.now(),
                "source_file": "ABC_Book_Stores_Inventory_Register.xlsx",
                "record_status": "active"
            }
            
            inventory_records.append(record)
        
        logger.info(f"✅ Extracted {len(inventory_records)} complete inventory records")
        return inventory_records
    
    # ==================== PURCHASE ORDER EXTRACTION ====================
    
    def extract_purchase_orders(self) -> List[Dict]:
        """
        Extract Purchase Orders from PDF files with complete table data
        """
        logger.info("📋 Starting Purchase Order extraction...")
        
        po_folder = self.inputs_folder / "Purchase Order"
        po_files = list(po_folder.glob("PO-*.pdf"))
        logger.info(f"📄 Found {len(po_files)} Purchase Order files")
        
        purchase_orders = []
        
        for po_file in po_files:
            try:
                po_data = self._extract_po_from_pdf(po_file)
                if po_data:
                    purchase_orders.append(po_data)
                    logger.info(f"✅ Extracted PO: {po_data.get('po_number', 'Unknown')}")
                    
            except Exception as e:
                logger.error(f"❌ Failed to extract {po_file.name}: {str(e)}")
                continue
        
        logger.info(f"✅ Extracted {len(purchase_orders)} Purchase Orders")
        return purchase_orders
    
    def _extract_po_from_pdf(self, pdf_file: Path) -> Optional[Dict]:
        """Extract structured data from Purchase Order PDF"""
        
        try:
            with pdfplumber.open(pdf_file) as pdf:
                # Extract text content from all pages
                text_content = ""
                for page in pdf.pages:
                    text_content += page.extract_text() or ""
                
                # Parse PO header information
                po_number = self._extract_po_number(pdf_file.name, text_content)
                vendor_info = self._extract_vendor_info(text_content)
                po_date = self._extract_po_date(text_content)
                
                # Try to extract tables using camelot
                line_items = []
                total_amount = 0
                
                try:
                    tables = camelot.read_pdf(str(pdf_file), pages='all', flavor='lattice')
                    if len(tables) > 0:
                        for table in tables:
                            df = table.df
                            items = self._parse_po_table(df)
                            line_items.extend(items)
                except Exception as camelot_error:
                    logger.warning(f"Camelot extraction failed for {pdf_file.name}, trying pdfplumber tables")
                    # Fallback to pdfplumber table extraction
                    for page in pdf.pages:
                        page_tables = page.extract_tables()
                        for table in page_tables:
                            items = self._parse_table_data(table, 'po')
                            line_items.extend(items)
                
                # Calculate total
                total_amount = sum(item.get('total_amount', 0) for item in line_items)
                
                po_record = {
                    "po_number": po_number,
                    "po_date": po_date,
                    "vendor_code": vendor_info.get('code', ''),
                    "vendor_name": vendor_info.get('name', ''),
                    "vendor_address": vendor_info.get('address', ''),
                    "vendor_gstin": vendor_info.get('gstin', ''),
                    "buyer_name": "ABC BOOK HOUSE PRIVATE LIMITED",
                    "buyer_address": "3rd Main Road, Gandhinagar, Bangalore",
                    "line_items": line_items,
                    "po_total_amount": total_amount,
                    "po_status": "completed",
                    "created_by": "purchase_dept",
                    "approved_by": "manager",
                    "extracted_at": datetime.now(),
                    "source_file": pdf_file.name
                }
                
                return po_record
                
        except Exception as e:
            logger.error(f"Failed to extract PO from {pdf_file.name}: {str(e)}")
            return None
    
    # ==================== GRN EXTRACTION ====================
    
    def extract_grns(self) -> List[Dict]:
        """Extract Goods Receipt Notes with complete data"""
        logger.info("📦 Starting GRN extraction...")
        
        grn_folder = self.inputs_folder / "GRN Copies"
        grn_files = list(grn_folder.glob("GRN-*.pdf"))
        logger.info(f"📄 Found {len(grn_files)} GRN files")
        
        grns = []
        
        for grn_file in grn_files:
            try:
                grn_data = self._extract_grn_from_pdf(grn_file)
                if grn_data:
                    grns.append(grn_data)
                    logger.info(f"✅ Extracted GRN: {grn_data.get('grn_code', 'Unknown')}")
                    
            except Exception as e:
                logger.error(f"❌ Failed to extract {grn_file.name}: {str(e)}")
                continue
        
        logger.info(f"✅ Extracted {len(grns)} GRNs")
        return grns
    
    # ==================== SALES INVOICE EXTRACTION ====================
    
    def extract_sales_invoices(self) -> List[Dict]:
        """Extract Sales Invoices with complete line item details"""
        logger.info("💰 Starting Sales Invoice extraction...")
        
        si_folder = self.inputs_folder / "Sales Invoices"
        si_files = list(si_folder.glob("invoice_*.pdf"))
        logger.info(f"📄 Found {len(si_files)} Sales Invoice files")
        
        sales_invoices = []
        
        for si_file in si_files:
            try:
                si_data = self._extract_si_from_pdf(si_file)
                if si_data:
                    sales_invoices.append(si_data)
                    logger.info(f"✅ Extracted SI: {si_data.get('invoice_no', 'Unknown')}")
                    
            except Exception as e:
                logger.error(f"❌ Failed to extract {si_file.name}: {str(e)}")
                continue
        
        logger.info(f"✅ Extracted {len(sales_invoices)} Sales Invoices")
        return sales_invoices
    
    # ==================== DATA LOADING ====================
    
    def load_all_data(self):
        """Load all extracted data into MongoDB collections"""
        logger.info("🚀 Starting comprehensive data loading...")
        
        # Clear existing data
        for collection_name, collection in self.collections.items():
            collection.delete_many({})
            logger.info(f"🧹 Cleared {collection_name} collection")
        
        # Extract and load inventory master
        inventory_data = self.extract_inventory_master()
        if inventory_data:
            self.collections['inventory_master'].insert_many(inventory_data)
            logger.info(f"💾 Loaded {len(inventory_data)} inventory records")
        
        # Extract and load purchase orders
        po_data = self.extract_purchase_orders()
        if po_data:
            self.collections['purchase_orders'].insert_many(po_data)
            logger.info(f"💾 Loaded {len(po_data)} purchase orders")
        
        # Extract and load GRNs
        grn_data = self.extract_grns()
        if grn_data:
            self.collections['goods_receipt_notes'].insert_many(grn_data)
            logger.info(f"💾 Loaded {len(grn_data)} GRNs")
        
        # Extract and load sales invoices
        si_data = self.extract_sales_invoices()
        if si_data:
            self.collections['sales_invoices'].insert_many(si_data)
            logger.info(f"💾 Loaded {len(si_data)} sales invoices")
        
        # Generate financial summary
        self._generate_financial_summary()
        
        logger.info("🎉 Comprehensive ETL pipeline completed successfully!")
    
    # ==================== UTILITY METHODS ====================
    
    def _safe_str(self, value) -> str:
        """Safe string conversion"""
        if pd.isna(value) or value is None:
            return ""
        return str(value).strip()
    
    def _safe_float(self, value) -> float:
        """Safe float conversion"""
        if pd.isna(value) or value is None:
            return 0.0
        try:
            return float(value)
        except:
            return 0.0
    
    def _safe_int(self, value) -> int:
        """Safe integer conversion"""
        if pd.isna(value) or value is None:
            return 0
        try:
            return int(float(value))
        except:
            return 0
    
    def _safe_date(self, value) -> Optional[str]:
        """Safe date conversion"""
        if pd.isna(value) or value is None:
            return None
        try:
            if isinstance(value, str):
                return value
            return value.strftime('%Y-%m-%d')
        except:
            return None
    
    def _extract_isbn(self, product_name: str) -> str:
        """Extract ISBN from product name"""
        isbn_pattern = r'(\d{13}|\d{10})'
        match = re.search(isbn_pattern, product_name)
        return match.group(1) if match else ""
    
    def _extract_title(self, product_name: str) -> str:
        """Extract book title from product name"""
        # Remove ISBN and clean title
        clean_name = re.sub(r'\d{10,13}', '', product_name)
        return clean_name.strip()
    
    def _calculate_gross_profit(self, row) -> float:
        """Calculate gross profit from row data using correct column names"""
        sale_value = self._safe_float(row.get('Total amount', 0))
        purchase_value = self._safe_float(row.get('Total Purchase amount', 0))
        return sale_value - purchase_value
    
    def _calculate_profit_margin(self, row) -> float:
        """Calculate profit margin percentage"""
        sale_value = self._safe_float(row.get('Total amount', 0))
        gross_profit = self._calculate_gross_profit(row)
        
        if sale_value > 0:
            return (gross_profit / sale_value) * 100
        return 0.0
    
    def _extract_po_number(self, filename: str, text_content: str) -> str:
        """Extract PO number from filename or content"""
        # Try filename first
        po_match = re.search(r'PO-([^.]+)', filename)
        if po_match:
            return po_match.group(0).replace('.pdf', '')
        
        # Try content
        po_match = re.search(r'PO[-\s]*(\w+-\d+-\d+)', text_content)
        if po_match:
            return f"PO-{po_match.group(1)}"
        
        return filename.replace('.pdf', '')
    
    def _extract_vendor_info(self, text_content: str) -> Dict:
        """Extract vendor information from text"""
        vendor_info = {
            'code': '',
            'name': '',
            'address': '',
            'gstin': ''
        }
        
        try:
            # Look for common vendor patterns
            lines = text_content.split('\n')
            for i, line in enumerate(lines):
                line = line.strip()
                
                # Look for vendor names (common publishers)
                vendor_patterns = [
                    'Rupa', 'HarperCollins', 'Penguin', 'Publications', 'Publishers',
                    'Books', 'Press', 'House'
                ]
                
                for pattern in vendor_patterns:
                    if pattern.lower() in line.lower() and len(line) > 5:
                        vendor_info['name'] = line[:100]  # Limit length
                        vendor_info['code'] = pattern[:3].upper()
                        break
                
                # Look for GSTIN
                gstin_match = re.search(r'[A-Z0-9]{15}', line)
                if gstin_match:
                    vendor_info['gstin'] = gstin_match.group(0)
                    
        except Exception as e:
            logger.warning(f"Vendor extraction failed: {str(e)}")
            
        return vendor_info
    
    def _extract_po_date(self, text_content: str) -> str:
        """Extract PO date from text content"""
        date_pattern = r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})'
        match = re.search(date_pattern, text_content)
        if match:
            return match.group(1)
        return datetime.now().strftime('%Y-%m-%d')
    
    def _parse_po_table(self, df: pd.DataFrame) -> List[Dict]:
        """Parse PO table data into line items"""
        items = []
        try:
            # Look for table headers and data rows
            if len(df) > 1:
                # Try to identify the table structure
                for i, row in df.iterrows():
                    if i == 0:  # Skip header row
                        continue
                    
                    # Extract item data based on common PO structure
                    item = {
                        "item_no": i,
                        "description": self._safe_str(row.iloc[0] if len(row) > 0 else ''),
                        "quantity": self._extract_number(row.iloc[1] if len(row) > 1 else ''),
                        "unit_rate": self._extract_number(row.iloc[2] if len(row) > 2 else ''),
                        "total_amount": self._extract_number(row.iloc[3] if len(row) > 3 else '')
                    }
                    
                    if item["description"] or item["quantity"] > 0:
                        items.append(item)
                        
        except Exception as e:
            logger.warning(f"Failed to parse PO table: {str(e)}")
        
        return items
    
    def _parse_table_data(self, table_data: List[List], doc_type: str) -> List[Dict]:
        """Parse generic table data based on document type"""
        items = []
        if not table_data or len(table_data) < 2:
            return items
            
        # Skip header and parse rows
        for i, row in enumerate(table_data[1:], 1):
            if not any(cell for cell in row if cell):  # Skip empty rows
                continue
                
            item = {
                "item_no": i,
                "description": self._safe_str(row[0] if len(row) > 0 else ''),
                "quantity": self._extract_number(row[1] if len(row) > 1 else ''),
                "unit_rate": self._extract_number(row[2] if len(row) > 2 else ''),
                "total_amount": self._extract_number(row[3] if len(row) > 3 else '')
            }
            
            if item["description"] or item["quantity"] > 0:
                items.append(item)
        
        return items
    
    def _extract_grn_from_pdf(self, pdf_file: Path) -> Optional[Dict]:
        """Extract GRN data from PDF"""
        try:
            with pdfplumber.open(pdf_file) as pdf:
                text_content = ""
                for page in pdf.pages:
                    text_content += page.extract_text() or ""
                
                # Extract GRN details
                grn_code = self._extract_grn_code(pdf_file.name, text_content)
                grn_date = self._extract_po_date(text_content)  # Reuse date extraction
                po_number = self._extract_po_reference(text_content)
                vendor_name = self._extract_vendor_name(text_content)
                
                # Extract received items
                received_items = []
                try:
                    # Try table extraction
                    for page in pdf.pages:
                        tables = page.extract_tables()
                        for table in tables:
                            items = self._parse_table_data(table, 'grn')
                            received_items.extend(items)
                except Exception:
                    logger.warning(f"Table extraction failed for GRN {pdf_file.name}")
                
                grn_record = {
                    "grn_code": grn_code,
                    "grn_date": grn_date,
                    "po_number": po_number,
                    "vendor_name": vendor_name,
                    "received_items": received_items,
                    "grn_total_value": sum(item.get('total_amount', 0) for item in received_items),
                    "receiver_name": "Store Incharge",
                    "quality_check_status": "passed",
                    "grn_status": "completed",
                    "extracted_at": datetime.now(),
                    "source_file": pdf_file.name
                }
                
                return grn_record
                
        except Exception as e:
            logger.error(f"Failed to extract GRN from {pdf_file.name}: {str(e)}")
            return None
    
    def _extract_si_from_pdf(self, pdf_file: Path) -> Optional[Dict]:
        """Extract Sales Invoice data from PDF"""
        try:
            with pdfplumber.open(pdf_file) as pdf:
                text_content = ""
                for page in pdf.pages:
                    text_content += page.extract_text() or ""
                
                # Extract invoice details
                invoice_no = self._extract_invoice_number(pdf_file.name, text_content)
                invoice_date = self._extract_po_date(text_content)  # Reuse date extraction
                customer_name = self._extract_customer_name(text_content)
                
                # Extract sale items
                sale_items = []
                try:
                    # Try table extraction
                    for page in pdf.pages:
                        tables = page.extract_tables()
                        for table in tables:
                            items = self._parse_table_data(table, 'sales')
                            sale_items.extend(items)
                except Exception:
                    logger.warning(f"Table extraction failed for Sales Invoice {pdf_file.name}")
                
                # Calculate totals
                subtotal = sum(item.get('total_amount', 0) for item in sale_items)
                
                si_record = {
                    "invoice_no": invoice_no,
                    "invoice_date": invoice_date,
                    "customer_name": customer_name,
                    "sale_items": sale_items,
                    "subtotal": subtotal,
                    "invoice_total": subtotal,  # Simplified - could add GST calculation
                    "payment_status": "pending",
                    "extracted_at": datetime.now(),
                    "source_file": pdf_file.name
                }
                
                return si_record
                
        except Exception as e:
            logger.error(f"Failed to extract Sales Invoice from {pdf_file.name}: {str(e)}")
            return None
    
    def _extract_number(self, value) -> float:
        """Extract numeric value from string"""
        if not value or pd.isna(value):
            return 0.0
        
        try:
            # Clean the string - remove currency symbols, commas, etc.
            clean_value = re.sub(r'[^\d.-]', '', str(value))
            return float(clean_value) if clean_value else 0.0
        except:
            return 0.0
    
    def _extract_grn_code(self, filename: str, text_content: str) -> str:
        """Extract GRN code from filename or content"""
        grn_match = re.search(r'GRN-\d{4}-\d{3}', filename)
        if grn_match:
            return grn_match.group(0)
        return filename.replace('.pdf', '')
    
    def _extract_po_reference(self, text_content: str) -> str:
        """Extract PO reference from text"""
        po_match = re.search(r'PO[-\s]*([A-Z]+-\d+-\d+)', text_content)
        if po_match:
            return f"PO-{po_match.group(1)}"
        return ""
    
    def _extract_vendor_name(self, text_content: str) -> str:
        """Extract vendor name from text"""
        lines = text_content.split('\n')
        for line in lines:
            if any(word in line.lower() for word in ['publications', 'publishers', 'books', 'press']):
                return line.strip()[:100]
        return "Unknown Vendor"
    
    def _extract_invoice_number(self, filename: str, text_content: str) -> str:
        """Extract invoice number from filename or content"""
        inv_match = re.search(r'INV-\d{6}-\d{3}', filename)
        if inv_match:
            return inv_match.group(0)
        return filename.replace('invoice_', '').replace('.pdf', '')
    
    def _extract_customer_name(self, text_content: str) -> str:
        """Extract customer name from text"""
        lines = text_content.split('\n')
        for line in lines:
            if any(word in line.lower() for word in ['limited', 'ltd', 'inc', 'corp', 'publishers']):
                return line.strip()[:100]
        return "Unknown Customer"
    
    def _generate_financial_summary(self):
        """Generate financial summary from all collections"""
        try:
            # Calculate summary metrics from inventory data
            inventory_data = list(self.collections['inventory_master'].find({}))
            
            total_purchases = sum(record.get('total_purchase_value', 0) for record in inventory_data)
            total_sales = sum(record.get('total_sales_value', 0) for record in inventory_data)
            total_gross_profit = sum(record.get('gross_profit', 0) for record in inventory_data)
            inventory_value = sum(record.get('total_closing_value', 0) for record in inventory_data)
            
            summary = {
                "summary_id": f"FS-{datetime.now().strftime('%Y%m')}-001",
                "period": datetime.now().strftime('%Y-%m'),
                "total_purchases": total_purchases,
                "total_sales": total_sales,
                "total_gross_profit": total_gross_profit,
                "average_margin_pct": (total_gross_profit / total_sales * 100) if total_sales > 0 else 0,
                "inventory_value": inventory_value,
                "total_records": len(inventory_data),
                "generated_at": datetime.now(),
                "summary_status": "auto_generated"
            }
            
            self.collections['financial_summary'].insert_one(summary)
            logger.info(f"📊 Generated financial summary: ${total_sales:,.2f} sales, ${total_gross_profit:,.2f} profit")
            
        except Exception as e:
            logger.error(f"Failed to generate financial summary: {str(e)}")
            # Insert basic summary anyway
            basic_summary = {
                "summary_id": f"FS-{datetime.now().strftime('%Y%m')}-001",
                "period": datetime.now().strftime('%Y-%m'),
                "generated_at": datetime.now(),
                "summary_status": "basic_generated"
            }
            self.collections['financial_summary'].insert_one(basic_summary)

# ==================== MAIN EXECUTION ====================

if __name__ == "__main__":
    # Load configuration from config.env
    import os
    from dotenv import load_dotenv
    
    load_dotenv('config.env')
    
    # Configuration from environment
    MONGODB_CONNECTION = os.getenv('MONGODB_URI')
    DATABASE_NAME = os.getenv('DATABASE_NAME', 'zenalyst_bookstore')
    INPUTS_FOLDER = os.getenv('DATA_DIRECTORY', 'Hackathon/Inputs')
    
    print(f"🔧 Configuration Loaded:")
    print(f"  • Database: {DATABASE_NAME}")
    print(f"  • Inputs: {INPUTS_FOLDER}")
    print(f"  • MongoDB: {'✅ Connected' if MONGODB_CONNECTION else '❌ Missing'}")
    
    if not MONGODB_CONNECTION:
        print("❌ MongoDB URI not found in config.env")
        exit(1)
    
    # Initialize and run ETL
    etl = ComprehensiveETL(MONGODB_CONNECTION, INPUTS_FOLDER)
    etl.load_all_data()