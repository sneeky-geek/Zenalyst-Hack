"""
🚀 ZENALYST AI BACKEND API
FastAPI server integrating ETL pipeline and AI analytics

This provides REST API endpoints for:
- File upload and processing
- Real-time business analytics
- Gemini AI insights generation
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import os
import tempfile
import shutil
from typing import List
from pathlib import Path
import logging

# Import our existing modules
from enhanced_gemini_intelligence import GeminiBusinessIntelligence

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Zenalyst AI Business Intelligence API",
    description="Real-time business analytics with Gemini AI integration",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
ai_system = None

@app.on_event("startup")
async def startup_event():
    """Initialize AI system on startup"""
    global ai_system
    
    logger.info("🚀 Initializing Zenalyst AI Backend...")
    
    try:
        # Initialize AI system
        ai_system = GeminiBusinessIntelligence()
        logger.info("✅ Gemini AI system initialized")
        
    except Exception as e:
        logger.error(f"❌ Startup error: {str(e)}")
        # Continue without AI system for now

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "🤖 Zenalyst AI Backend is running!",
        "status": "healthy",
        "version": "1.0.0",
        "endpoints": {
            "upload": "/api/upload-and-analyze",
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "ai_system": "initialized" if ai_system else "not_initialized",
        "etl_system": "initialized" if etl_system else "not_initialized",
        "timestamp": "2025-10-04"
    }

@app.post("/api/upload-and-analyze")
async def upload_and_analyze(files: List[UploadFile] = File(...)):
    """
    Upload business documents and perform complete analysis
    
    Accepts: PDF files (PO, GRN, Purchase Invoices), Excel files (Inventory)
    Returns: Complete business intelligence analysis with AI insights
    """
    
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
    
    logger.info(f"📁 Received {len(files)} files for processing")
    
    # Create temporary directory for file processing
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        try:
            # Save uploaded files
            saved_files = []
            for file in files:
                if not file.filename:
                    continue
                    
                # Determine file category
                file_category = categorize_file(file.filename)
                
                # Create appropriate subdirectory
                category_dir = temp_path / file_category
                category_dir.mkdir(exist_ok=True)
                
                # Save file
                file_path = category_dir / file.filename
                with open(file_path, "wb") as buffer:
                    content = await file.read()
                    buffer.write(content)
                
                saved_files.append({
                    "filename": file.filename,
                    "category": file_category,
                    "path": str(file_path),
                    "size": len(content)
                })
                
                logger.info(f"💾 Saved {file.filename} as {file_category}")
            
            if not saved_files:
                raise HTTPException(status_code=400, detail="No valid files to process")
            
            # Initialize file processor
            file_processor = SimpleFileProcessor(etl_system)
            
            # Process files through ETL pipeline
            logger.info("⚙️ Starting file processing...")
            try:
                records_inserted = 0
                
                for file_info in saved_files:
                    file_path = Path(file_info['path'])
                    category = file_info['category']
                    
                    logger.info(f"📄 Processing {category} file: {file_path.name}")
                    
                    if category == 'Inventory' and file_path.suffix.lower() in ['.xlsx', '.xls']:
                        # Process inventory file
                        inventory_data = file_processor.process_inventory_file(file_path)
                        if inventory_data:
                            etl_system.collections['inventory_master'].delete_many({})  # Clear existing
                            etl_system.collections['inventory_master'].insert_many(inventory_data)
                            records_inserted += len(inventory_data)
                            logger.info(f"✅ Processed inventory: {len(inventory_data)} records")
                    
                    elif category in ['Purchase Order', 'GRN Copies', 'Purchase Invoice'] and file_path.suffix.lower() == '.pdf':
                        # Process PDF documents
                        doc_data = file_processor.process_pdf_document(file_path, category)
                        if doc_data:
                            if category == 'Purchase Order':
                                etl_system.collections['purchase_orders'].insert_many(doc_data)
                            elif category == 'GRN Copies':
                                etl_system.collections['goods_receipt_notes'].insert_many(doc_data)
                            elif category == 'Purchase Invoice':
                                etl_system.collections['purchase_invoices'].insert_many(doc_data)
                            
                            records_inserted += len(doc_data)
                            logger.info(f"✅ Processed {category}: {len(doc_data)} records")
                
                # Generate financial summary if we have inventory data
                if records_inserted > 0:
                    try:
                        etl_system.generate_financial_summary()
                        logger.info("📊 Generated financial summary")
                    except Exception as e:
                        logger.warning(f"Financial summary generation failed: {e}")
                
                etl_results = {
                    'success': True,
                    'documents_processed': len(saved_files),
                    'records_inserted': records_inserted,
                    'processing_time': 0
                }
                
            except Exception as e:
                logger.error(f"File processing error: {str(e)}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"File processing failed: {str(e)}"
                )
            
            # Run AI analysis
            logger.info("🤖 Starting AI analysis...")
            ai_results = await ai_system.run_complete_ai_analysis()
            
            # Combine results
            response_data = {
                "success": True,
                "message": "Analysis completed successfully",
                "files_processed": saved_files,
                "etl_results": {
                    "documents_processed": etl_results.get('documents_processed', 0),
                    "records_inserted": etl_results.get('records_inserted', 0),
                    "processing_time": etl_results.get('processing_time', 0)
                },
                "business_data": ai_results.get("business_data", {}),
                "ai_insights": ai_results.get("ai_insights", {}),
                "process_results": ai_results.get("process_results", {}),
                "timestamp": "2025-10-04"
            }
            
            logger.info("✅ Analysis completed successfully")
            return JSONResponse(content=response_data)
            
        except Exception as e:
            logger.error(f"❌ Processing error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

def categorize_file(filename: str) -> str:
    """Categorize uploaded file based on filename"""
    filename_lower = filename.lower()
    
    if 'inventory' in filename_lower or filename_lower.endswith(('.xlsx', '.xls')):
        return 'Inventory'
    elif 'po' in filename_lower or 'purchase_order' in filename_lower or 'purchase-order' in filename_lower:
        return 'Purchase Order'
    elif 'grn' in filename_lower or 'goods_receipt' in filename_lower:
        return 'GRN Copies'
    elif 'invoice' in filename_lower or 'pi-' in filename_lower:
        return 'Purchase Invoice'
    else:
        return 'Other'

@app.get("/api/test-analysis")
async def test_analysis():
    """Test endpoint using existing data"""
    try:
        logger.info("🧪 Running test analysis with existing data...")
        
        # Run AI analysis with existing database data
        ai_results = await ai_system.run_complete_ai_analysis()
        
        return JSONResponse(content={
            "success": True,
            "message": "Test analysis completed",
            "business_data": ai_results.get("business_data", {}),
            "ai_insights": ai_results.get("ai_insights", {}),
            "process_results": ai_results.get("process_results", {})
        })
        
    except Exception as e:
        logger.error(f"❌ Test analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Test analysis failed: {str(e)}")

@app.get("/api/sample-data")
async def get_sample_data():
    """Get sample analysis data for testing frontend"""
    return {
        "success": True,
        "message": "Sample data for testing",
        "business_data": {
            "financial_summary": {
                "total_revenue": 1699884.0,
                "total_profit": 209681.0,
                "overall_margin": 12.33,
                "inventory_value": 1352098.0
            },
            "operational_metrics": {
                "three_way_match_accuracy": 100.0,
                "excess_inventory_value": 536794.20,
                "dead_stock_items": 0,
                "negative_margin_products": 16
            },
            "top_vendors": [
                {"vendor": "Stationery World Pvt Ltd", "avg_margin_pct": 65.8, "total_sales_value": 45000},
                {"vendor": "Hachette Book Group India", "avg_margin_pct": 44.4, "total_sales_value": 120000},
                {"vendor": "Office Mart Supplies", "avg_margin_pct": 13.7, "total_sales_value": 85000}
            ],
            "top_products": [
                {"product": "Half Girlfriend by Chetan Bhagat", "margin_pct": 69.8, "sales_value": 25000},
                {"product": "Designer Diary Set", "margin_pct": 65.8, "sales_value": 18000},
                {"product": "Art Supplies Bundle", "margin_pct": 70.2, "sales_value": 32000}
            ]
        },
        "ai_insights": {
            "provider": "Gemini AI",
            "analysis": "**EXECUTIVE SUMMARY**\\nABC Book Store shows strong performance with ₹1,699,884 revenue and healthy profit margins. Key opportunities exist in inventory optimization and vendor relationship management.\\n\\n**IMMEDIATE ACTIONS**\\n1. Address excess inventory of ₹536,794\\n2. Review pricing for 16 negative margin products\\n3. Optimize vendor mix focusing on high-margin suppliers",
            "timestamp": "2025-10-04"
        },
        "process_results": {
            "three_way_match": {"match_accuracy_pct": 100.0},
            "procurement_analysis": {"total_excess_value": 536794.20},
            "cost_analysis": {"obsolete_products": []},
            "aging_analysis": {"dead_stock_value": 0},
            "fifo_analysis": {"valuation_variance": 1679432.0},
            "profitability_analysis": {"total_profit": 209681.0}
        }
    }

if __name__ == "__main__":
    import uvicorn
    
    logger.info("🚀 Starting Zenalyst AI Backend Server...")
    uvicorn.run(
        "backend_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )