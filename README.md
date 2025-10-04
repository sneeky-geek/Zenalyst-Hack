# ETL Pipeline for Excel and PDF Processing

A comprehensive Python ETL pipeline that processes Excel (.xlsx, .xls) and PDF files, extracts structured data, normalizes the schema, and loads everything into MongoDB.

## Features

### 📊 **Excel Processing**
- Reads all sheets from Excel files (.xlsx, .xls)
- Converts each sheet to structured records
- Preserves sheet names and source file information

### 📄 **PDF Processing**
- **Primary**: Uses Camelot to extract tables from PDFs
- **Fallback**: Uses pdfplumber for text extraction when tables aren't found
- Handles invoices, purchase orders, and other tabular documents

### 🔄 **Data Normalization**
- Standardizes column names to: `["Invoice_No", "Date", "Vendor", "Amount", "Tax", "Total", "Status", "source_file"]`
- Maps common variations (e.g., "Invoice Number" → "Invoice_No")
- Converts dates to proper datetime format
- Parses numeric values for amounts, tax, and totals
- Preserves original data in additional fields

### 🗄️ **MongoDB Integration**
- Loads data into `finance_db.transactions` collection
- Batch processing for efficiency
- Comprehensive error handling and logging

## Quick Start

### 1. Setup Environment
```bash
# Make setup script executable and run it
chmod +x setup.sh
./setup.sh
```

Or manually:
```bash
# Install dependencies
pip install -r requirements.txt

# Install system dependencies (macOS)
brew install ghostscript

# Install system dependencies (Ubuntu)
sudo apt-get install ghostscript python3-tk
```

### 2. Configure MongoDB Connection
Set up your MongoDB connection string:

**Option 1: Interactive Setup (Recommended)**
```bash
python configure_mongodb.py
```

**Option 2: Edit config.env file directly**
```bash
# Edit config.env and replace with your connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
```

**Option 3: Environment Variable**
```bash
export MONGODB_URI="your_connection_string_here"
```

### 3. Test MongoDB Connection
```bash
python configure_mongodb.py test
```

### 4. Run the Pipeline
```bash
python etl_pipeline.py
```

## Usage

### Basic Usage
```python
from etl_pipeline import ETLPipeline

# Initialize pipeline
pipeline = ETLPipeline()

# Run on specific directory
pipeline.run_pipeline("path/to/your/data")
```

### Custom Configuration
```python
# Option 1: Use your connection string directly
pipeline = ETLPipeline(
    mongo_uri="mongodb+srv://username:password@cluster.mongodb.net/",
    db_name="my_finance_db",
    collection_name="my_transactions"
)

# Option 2: Configuration loaded from config.env file
pipeline = ETLPipeline()  # Uses MONGODB_URI from config.env

# Run pipeline
success = pipeline.run_pipeline("Hackathon/Inputs")
if success:
    print("✅ ETL finished, data stored in MongoDB!")
```

### Individual Functions
```python
# Extract from specific Excel file
excel_records = pipeline.extract_excel_data("file.xlsx")

# Extract from specific PDF file
pdf_records = pipeline.extract_pdf_data("invoice.pdf")

# Normalize data
normalized = pipeline.normalize_data(records)

# Load to MongoDB
pipeline.connect_to_mongodb()
pipeline.load_to_mongodb(normalized)
```

## Data Schema

The pipeline normalizes all data to this standard schema:

| Field | Type | Description |
|-------|------|-------------|
| `Invoice_No` | String | Invoice/Bill/Transaction number |
| `Date` | DateTime | Invoice/Transaction date |
| `Vendor` | String | Vendor/Supplier/Customer name |
| `Amount` | Float | Base amount (before tax) |
| `Tax` | Float | Tax amount |
| `Total` | Float | Total amount (including tax) |
| `Status` | String | Payment/Invoice status |
| `source_file` | String | Original filename |
| `file_type` | String | 'excel' or 'pdf' |
| `extraction_method` | String | 'pandas', 'camelot', or 'pdfplumber' |
| `processed_at` | DateTime | When record was processed |

Additional fields from source files are preserved as `additional_{field_name}`.

## Column Mapping

The pipeline automatically maps these variations:

**Invoice Number**: `invoice_number`, `bill_no`, `inv_no`, `invoice_id`, `transaction_id`
**Date**: `invoice_date`, `bill_date`, `transaction_date`, `created_date`
**Vendor**: `supplier`, `vendor_name`, `supplier_name`, `company`, `customer`, `client`
**Amount**: `net_amount`, `subtotal`, `sub_total`, `base_amount`
**Tax**: `tax_amount`, `vat`, `gst`, `sales_tax`
**Total**: `total_amount`, `grand_total`, `final_amount`
**Status**: `payment_status`, `invoice_status`

## File Structure

```
.
├── etl_pipeline.py          # Main ETL pipeline
├── requirements.txt         # Python dependencies
├── setup.sh                # Setup script
├── README.md               # This file
└── etl_pipeline.log        # Generated log file
```

## Logging

The pipeline generates detailed logs in `etl_pipeline.log` and console output:

- ✅ Success operations
- ⚠️ Warnings (non-critical issues)
- ❌ Errors (critical issues)
- 📊 Progress information

## Error Handling

The pipeline includes comprehensive error handling:

- **File Access**: Continues processing other files if one fails
- **Sheet Processing**: Skips problematic sheets, processes others
- **PDF Extraction**: Falls back to text extraction if table extraction fails
- **Data Parsing**: Logs warnings for unparseable values, continues processing
- **MongoDB**: Handles connection issues and bulk write errors gracefully

## Dependencies

### Python Packages
- `pandas>=2.0.0` - Excel processing and data manipulation
- `pymongo>=4.0.0` - MongoDB connection and operations
- `camelot-py[cv]>=0.10.1` - PDF table extraction
- `pdfplumber>=0.7.0` - PDF text extraction fallback
- `openpyxl>=3.1.0` - Excel file support (.xlsx)
- `xlrd>=2.0.0` - Excel file support (.xls)
- `python-dateutil>=2.8.0` - Date parsing
- `numpy>=1.24.0` - Numerical operations

### System Dependencies
- **Ghostscript** (for Camelot PDF processing)
  - macOS: `brew install ghostscript`
  - Ubuntu: `sudo apt-get install ghostscript`

## Performance Tips

1. **Large Datasets**: The pipeline processes files in batches (1000 records default)
2. **Memory Usage**: Files are processed one at a time to manage memory
3. **MongoDB**: Uses bulk inserts for efficiency
4. **Parallel Processing**: Consider running multiple instances on different directories

## Troubleshooting

### Common Issues

**"Import camelot could not be resolved"**
- Install system dependencies: `brew install ghostscript` (macOS)
- Ensure camelot-py is installed: `pip install camelot-py[cv]`

**MongoDB Connection Failed**
- Ensure MongoDB is running: `brew services start mongodb-community`
- Check connection string in pipeline initialization

**PDF Processing Fails**
- Check if PDF is password protected
- Ensure PDF contains readable text/tables
- Review logs for specific error messages

**Excel Files Not Processing**
- Verify file permissions
- Check if files are password protected
- Ensure files aren't corrupted

## Contributing

Feel free to extend the pipeline with additional features:
- Support for more file formats
- Additional data validation rules
- Custom normalization logic
- Different database backends

## License

This ETL pipeline is provided as-is for educational and business use.