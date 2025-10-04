## Enhanced Analytics Dashboard Setup

### Prerequisites

1. Python 3.8+
2. MongoDB 4.4+
3. Node.js 20.19+ or 22.12+
4. Required Python packages in requirements.txt
5. Required NPM packages in Client/package.json

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/Zenalyst-Hack.git
cd Zenalyst-Hack
```

2. **Set up the Python environment**
```bash
# Create a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

3. **Configure MongoDB**
```bash
# Run MongoDB configuration script
python configure_mongodb.py
```

4. **Install frontend dependencies**
```bash
cd Client
npm install
cd ..
```

### Running the Enhanced Dashboard

#### Option 1: Using the Start Script (Recommended)

**On Windows:**
```bash
# Run the start script
start_dashboard.bat
```

**On Unix/Linux/Mac:**
```bash
# Make the script executable
chmod +x start_dashboard.sh

# Run the start script
./start_dashboard.sh
```

#### Option 2: Manual Start

1. **Start the ETL Pipeline (if needed)**
```bash
# Process sample data
python etl_pipeline.py
```

2. **Start the Analytics API Server**
```bash
# In a terminal window
python analytics_api_server.py
```

3. **Start the Upload API Server**
```bash
# In another terminal window
python upload_api_server.py
```

4. **Start the Regular API Server**
```bash
# In another terminal window
python api_server.py
```

5. **Start the Frontend**
```bash
# In another terminal window
cd Client
npm run dev
```

### Using the Enhanced Dashboard

1. **Open your browser** and navigate to `http://localhost:5173`
2. **Upload files and folders**:
   - Use the "Select Files" button to upload individual financial documents
   - Use the "Select Folder" button to upload entire folders containing financial documents
   - The dashboard will preserve the folder structure for better organization
3. **Process the uploads** by clicking the "Process Documents" button
4. **View document insights** that are automatically generated from the uploaded files
5. **Explore the enhanced analytics features:**
   - View KPI summaries with trend analysis
   - Examine time series charts with automated trend detection
   - Identify outliers in the transaction data
   - Explore data segments and clusters
   - Review transactions with anomaly highlighting

### Key Enhanced Features

#### Advanced Analytics

- **Trend Detection**: Automatically identifies and visualizes trends in your financial data
- **Outlier Detection**: Highlights unusual transactions using machine learning algorithms
- **Data Segmentation**: Groups similar transactions and vendors for better insights
- **Performance Optimization**: Uses caching and efficient algorithms for fast dashboard performance

#### Enhanced Visualizations

- **EnhancedTimeSeriesChart**: Shows trends over time with forecasting
- **OutlierDetectionCard**: Visualizes outliers in your transaction data
- **SegmentationAnalysisCard**: Displays cluster analysis of your financial data
- **EnhancedKpiSummary**: Shows key metrics with comparative analysis
- **EnhancedTransactionTable**: Displays transactions with anomaly highlighting

## Troubleshooting the Enhanced Dashboard

### Common Issues

**Analytics API Not Responding**
- Verify the analytics server is running on port 5001
- Check for Python errors in the terminal running the analytics server

**Missing Scikit-learn Dependencies**
- Run `pip install scikit-learn pandas numpy` to install required packages

**No Data in Enhanced Visualizations**
- Ensure you have uploaded and processed files
- Check MongoDB connection and data availability

**Performance Issues**
- Adjust batch sizes in analytics/core.py
- Consider adding indexes to MongoDB collections

**Folder Upload Not Working**
- Ensure you're using a modern browser that supports the webkitdirectory attribute
- Chrome, Edge, and Firefox support folder uploads
- Safari may have limited support for folder selection
- If folder upload fails, try uploading individual files or smaller subfolders