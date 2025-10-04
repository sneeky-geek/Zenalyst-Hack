# Zenalyst Financial Analytics Dashboard

A comprehensive solution for financial data extraction, transformation, loading, and visualization with advanced analytics capabilities. This project combines a robust Python ETL pipeline with a modern React dashboard featuring machine learning-powered insights for real-time financial data monitoring.

### 📊 **Live Dashboard**
- Real-time financial metrics display
- Interactive charts for trend analysis
- Transaction table with search and filtering
- Responsive design for all device sizes

### 🔄 **Enhanced Data Visualization Components**
- Machine learning powered trend analysis with forecasting
- Anomaly detection with highlighted unusual transactions
- Automatic data segmentation with cluster visualization
- Enhanced KPI tracking with comparative analysis
- Optimized transaction table with anomaly highlighting

## Features

### 🧠 **Enhanced Analytics Dashboard**
- AI-powered trend detection and forecasting
- Anomaly detection for unusual transactions
- Automatic data segmentation and clustering
- Interactive visualizations with drill-down capabilities
- Performance-optimized with data caching

### 📤 **Direct File & Folder Upload with Insights**
- Upload individual files or entire folders directly through the UI
- Preserve folder structure for better organization
- Automatic processing of uploaded files
- Instant insights generation from your documents
- Visual feedback on processing status

### 📊 **ETL Pipeline**
- Processes Excel files (.xlsx, .xls) including inventory registers
- Extracts data from various PDF formats (invoices, purchase orders, GRN copies)
- Normalizes data schema across different document types
- Loads structured data into MongoDB

### 📈 **Interactive Dashboard**
- Real-time financial metrics display
- Interactive charts for trend analysis
- Transaction table with search and filtering
- Responsive design for all device sizes

### 🔍 **Document Insights**
- Key findings from uploaded documents
- Unusual transaction detection
- Top vendor analysis
- Document type breakdown
- Financial trends visualization

A comprehensive solution for financial data extraction, transformation, loading, and visualization. This project combines a robust Python ETL pipeline with a modern React dashboard for real-time financial data monitoring.

## Features

### 📊 **ETL Pipeline**
- Processes Excel files (.xlsx, .xls) including inventory registers
- Extracts data from various PDF formats (invoices, purchase orders, GRN copies)
- Normalizes data schema across different document types
- Loads structured data into MongoDB

### � **Live Dashboard**
- Real-time financial metrics display
- Interactive charts for trend analysis
- Transaction table with search and filtering
- Responsive design for all device sizes

### 🔄 **Data Visualization Components**
- Monthly transaction trends
- Status distribution charts
- Vendor contribution analysis
- Detailed transaction records
- Parses numeric values for amounts, tax, and totals
- Preserves original data in additional fields

### 🗄️ **MongoDB Integration**
- Loads data into `finance_db.transactions` collection
- Batch processing for efficiency
- Comprehensive error handling and logging

### 📱 **REST API**
- Provides JSON endpoints for dashboard consumption
- Includes data filtering, pagination and search
- Performance-optimized MongoDB queries
- Summary statistics and aggregated data endpoints

## Quick Start

### 1. Setup Environment
```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
cd Client
npm install
cd ..
```

### 2. Configure MongoDB
```bash
# Run MongoDB configuration script
python configure_mongodb.py
```

### 3. Run ETL Pipeline
```bash
# Process sample data from Hackathon/Inputs
python etl_pipeline.py
```

### 4. Start API Server
```bash
# Start the main API server
python api_server.py
```

### 5. Start the API Server and Frontend (Simplified Approach)
```bash
# On Windows
start_enhanced_dashboard.bat

# On Unix/Linux/Mac
chmod +x start_enhanced_dashboard.sh
./start_enhanced_dashboard.sh
```

### 6. Alternate: Start Each Component Separately
```bash
# Start the API server in one terminal
python upload_api_server.py

# Start the React development server in another terminal
cd Client
npm run dev
```

## Documentation

- For detailed instructions on setting up and using the enhanced analytics dashboard, see [ENHANCED_SETUP.md](ENHANCED_SETUP.md)
- For an overview of the dashboard enhancements and features, see [ENHANCEMENTS.md](ENHANCEMENTS.md)
- For API documentation, see the comments in `analytics_api_server.py` and `api_server.py`

## Using the File & Folder Upload Feature

1. Navigate to the dashboard in your browser
2. At the top of the page, you'll see the file upload section
3. To upload individual files:
   - Click "Select Files" and choose Excel, CSV, or PDF documents
4. To upload an entire folder:
   - Click "Select Folder" and choose a folder containing financial documents
   - All supported files (.xlsx, .xls, .csv, .pdf) within the folder will be processed
   - The original folder structure will be preserved for better organization
5. Click "Process Documents" to upload and analyze the files
6. View generated insights in the "Document Insights" section
7. The dashboard will automatically refresh with new data

## Architecture

### ETL Pipeline Components
- **Extractors**: PDF parser, Excel processor, CSV handler
- **Transformers**: Data normalizers, schema mappers
- **Loaders**: MongoDB connector, batch processor

### API Endpoints
- `/api/upload` - Upload files for processing
- `/api/process` - Process uploaded files
- `/api/metrics` - Get dashboard metrics
- `/api/transactions` - Get transaction data
- `/api/vendors` - Get vendor statistics

### Frontend Components
- **FileUploader**: Handles file uploads and processing
- **DocumentInsights**: Generates insights from uploaded files
- **Dashboard**: Main visualization component
- **Charts**: Monthly, Status, Vendor analysis
- **TransactionTable**: Detailed transaction view
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

## Requirements

- Python 3.8+
- Node.js 20.19+ or 22.12+
- MongoDB 4.4+
- Required Python packages in requirements.txt
- Required NPM packages in Client/package.json

## Troubleshooting

### Common Issues

**Node.js Version Error**
- Upgrade Node.js to version 20.19+ or 22.12+ to run Vite

**MongoDB Connection Failed**
- Ensure MongoDB is running locally or use MongoDB Atlas
- Check connection string in configure_mongodb.py

**File Upload Fails**
- Check if the upload directory exists and is writable
- Verify the file types are supported (.xlsx, .xls, .csv, .pdf)
- Check file size (limit is 16MB)

**API Server Not Responding**
- Verify both API servers are running (main and upload)
- Check for port conflicts

## Contributing

Feel free to extend the application with additional features:
- Support for more file formats
- Additional insight generation
- Custom visualization components
- Mobile app integration

## License

This project is licensed under the MIT License - see the LICENSE file for details.