# 🚀 Zenalyst Business Intelligence System

A comprehensive ETL pipeline and AI-powered business analytics system for processing Excel and PDF documents, storing data in MongoDB, and providing intelligent business insights with Google Gemini API integration.

## ✨ Features

- 📊 **ETL Pipeline**: Extract data from Excel/PDF files and normalize to MongoDB
- 🤖 **AI-Powered Analytics**: Google Gemini, OpenAI, and Anthropic integration
- 📈 **6 Business Intelligence Processes**: 3-way matching, procurement verification, inventory analysis
- 📝 **Comprehensive Logging**: Detailed analysis reports with AI recommendations
- 💰 **Cost-Effective**: Gemini API integration provides 50-80% cost savings over competitors

## ⚡ Quick Start

### 1. Setup Environment
```bash
# Clone and setup
git clone <repository-url>
cd zenalyst.ai

# Install dependencies
pip install -r requirements.txt

# For PDF processing (macOS)
brew install ghostscript
```

### 2. Configure Database & AI
```bash
# Set MongoDB connection
export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/"

# Set AI API key (choose one - Gemini recommended for cost savings)
export GEMINI_API_KEY="your-gemini-api-key"        # 50-80% cheaper
export OPENAI_API_KEY="your-openai-api-key"        # Alternative
export ANTHROPIC_API_KEY="your-anthropic-api-key"  # Alternative
```

### 3. Run Complete Analysis
```bash
# Process data and get AI-powered insights
python run_complete_analysis.py
```

## 🏗️ Architecture

### Core Components

| File | Purpose |
|------|---------|
| `etl_pipeline.py` | Excel/PDF data extraction and MongoDB loading |
| `business_analytics.py` | 6 business intelligence processes |
| `llm_analytics.py` | AI integration (Gemini, OpenAI, Anthropic) |
| `analysis_logger.py` | Comprehensive reporting and logging |
| `run_complete_analysis.py` | Complete pipeline orchestrator |

### Data Flow
```
Excel/PDF Files → ETL Pipeline → MongoDB → Business Analytics → AI Analysis → Reports
```

## 🧠 AI-Powered Analytics

### Supported AI Providers
- 🔥 **Google Gemini** (Recommended - 50-80% cost savings)
- 🤖 **OpenAI GPT-4o-mini**
- 🧠 **Anthropic Claude**

### AI Analysis Types
Each business process gets enhanced with AI insights:

1. **3-Way Match Analysis** + AI pattern recognition
2. **Procurement Verification** + AI vendor insights
3. **Inventory Cost Analysis** + AI optimization strategies
4. **Inventory Ageing** + AI root cause analysis
5. **Inventory Valuation** + AI profit maximization
6. **Profitability Analysis** + AI strategic recommendations

## 📊 Business Intelligence Processes

### 📋 Process 1: 3-Way Match Analysis
- Matches Purchase Orders ↔ GRN Receipts ↔ Purchase Invoices
- Identifies discrepancies requiring investigation
- AI provides pattern analysis and process improvement recommendations

### 📦 Process 2: Procurement Verification
- Compares ordered vs received vs invoiced quantities
- Identifies excess/short procurement patterns
- AI suggests vendor optimization strategies

### 💰 Process 3: Inventory Cost Analysis
- Calculates carrying costs vs gross margins
- Identifies unprofitable products
- AI recommends pricing and discontinuation strategies

### 📅 Process 4: Inventory Ageing Analysis
- Tracks product movement and identifies dead stock
- Categorizes inventory by movement speed
- AI provides clearance and optimization recommendations

### 💵 Process 5: Inventory Valuation Analysis
- FIFO-based cost calculations vs selling prices
- Identifies profit potential
- AI suggests valuation optimization strategies

### 📈 Process 6: Profitability Analysis
- Vendor performance and category analysis
- SKU-level margin calculations
- AI provides strategic business recommendations

## 💡 Sample AI Output

```
🤖 GEMINI-POWERED INSIGHTS:
Confidence Score: 85.2%

💡 Key AI Insights:
  1. Fiction category shows 3x higher dead stock than industry average
  2. Vendor payment terms correlate with inventory turnover inefficiencies
  3. Seasonal patterns indicate Q1-Q2 strategic buying opportunities worth ₹12L

🎯 AI Strategic Recommendations:
  1. Implement dynamic pricing for fiction titles aged 120+ days
  2. Negotiate extended payment terms with top 3 vendors
  3. Establish automated seasonal reorder triggers
```

## 📦 Installation

### Dependencies
```bash
# Core dependencies
pip install pandas pymongo camelot-py pdfplumber openpyxl

# AI dependencies (optional but recommended)
pip install google-generativeai aiohttp openai anthropic

# System dependencies (macOS)
brew install ghostscript

# System dependencies (Ubuntu)
sudo apt-get install ghostscript python3-tk
```

### Environment Variables
```bash
# Database (required)
export MONGODB_URI="your-mongodb-connection-string"

# AI API (choose one - Gemini recommended)
export GEMINI_API_KEY="your-gemini-api-key"      # Most cost-effective
export OPENAI_API_KEY="your-openai-api-key"      # Alternative
export ANTHROPIC_API_KEY="your-anthropic-key"    # Alternative
```

## 🚀 Usage

### Complete Pipeline
```python
# Run everything - ETL + AI-powered analytics
python run_complete_analysis.py
```

### Individual Components
```python
from etl_pipeline import ETLPipeline
from business_analytics import BusinessAnalytics

# ETL only
pipeline = ETLPipeline()
pipeline.run_pipeline("path/to/data")

# Analytics only
analytics = BusinessAnalytics(mongo_uri="your-uri")
results = analytics.run_comprehensive_analysis()
```

## 📈 Cost Comparison

| Provider | Input Cost | Output Cost | 786 Records Est. |
|----------|------------|-------------|------------------|
| 🔥 **Gemini 1.5 Flash** | $0.075/1M | $0.30/1M | **$0.03-0.05** |
| 🤖 OpenAI GPT-4o-mini | $0.15/1M | $0.60/1M | $0.08-0.12 |
| 🧠 Anthropic Claude | $0.25/1M | $1.25/1M | $0.15-0.25 |

**Gemini provides 50-80% cost savings with same quality insights!**

## 📁 Project Structure

```
zenalyst.ai/
├── 📊 etl_pipeline.py              # Data extraction & loading
├── 🧠 business_analytics.py        # Business intelligence
├── 🤖 llm_analytics.py            # AI integration
├── 📝 analysis_logger.py          # Reporting system
├── 🚀 run_complete_analysis.py    # Pipeline orchestrator
├── 📋 requirements.txt            # Dependencies
├── ⚙️ config.env                  # Configuration
├── 📚 Hackathon/                  # Input data
└── 📊 Client/                     # Frontend (optional)
```

## 🔧 Configuration

### MongoDB Setup
Your data is stored in MongoDB with this schema:
- **Collection**: `finance_db.transactions`
- **Schema**: Normalized with fields like `Invoice_No`, `Date`, `Vendor`, `Amount`, `Total`
- **Additional Fields**: Original data preserved with `additional_` prefix

### AI Configuration
The system automatically selects the best available AI provider:
1. **Gemini** (if `GEMINI_API_KEY` set) - Most cost-effective
2. **OpenAI** (if `OPENAI_API_KEY` set) - High quality
3. **Anthropic** (if `ANTHROPIC_API_KEY` set) - Premium option
4. **Rule-based** (fallback) - No AI key required

## 🎯 Expected Results

For a typical dataset (like your 786 records):
- **ETL Processing**: ~2-5 minutes
- **Business Analytics**: ~1-2 minutes  
- **AI Analysis**: ~30 seconds (with Gemini)
- **Total Cost**: ~$0.03-0.05 (with Gemini)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- 📧 Email: support@zenalyst.ai
- 📖 Documentation: [docs.zenalyst.ai](https://docs.zenalyst.ai)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

**🚀 Transform your business data into actionable AI-powered insights with Zenalyst!**