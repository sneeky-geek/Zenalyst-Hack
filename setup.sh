#!/bin/bash

# Setup script for ETL Pipeline
echo "🚀 Setting up ETL Pipeline environment..."

# Activate virtual environment (assuming it's in venv folder)
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment..."
    source venv/bin/activate
else
    echo "⚠️  Virtual environment not found. Please create one with:"
    echo "python -m venv venv"
    echo "source venv/bin/activate"
    exit 1
fi

# Install requirements
echo "📥 Installing Python packages..."
pip install -r requirements.txt

# Install system dependencies for Camelot (if needed)
echo "🔧 Note: Camelot may require additional system dependencies:"
echo "- For macOS: brew install ghostscript"
echo "- For Ubuntu: sudo apt-get install ghostscript python3-tk"

echo "✅ Setup complete! You can now run the ETL pipeline with:"
echo "python etl_pipeline.py"