"""
Backend Startup Script
=====================

This script runs all the required backend components for the ETL + Dashboard.
"""

import os
import subprocess
import sys
import logging
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_mongodb():
    """Check if MongoDB connection is available"""
    try:
        logger.info("Checking MongoDB connection...")
        subprocess.run([sys.executable, "configure_mongodb.py", "test"], check=True)
        return True
    except subprocess.CalledProcessError:
        logger.error("MongoDB connection failed. Please check if MongoDB is running and properly configured.")
        return False

def run_data_validation():
    """Run data validation and cleanup"""
    try:
        logger.info("Running data validation and cleanup...")
        subprocess.run([sys.executable, "validate_data.py"], check=True)
        logger.info("Data validation completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Data validation failed: {e}")
        return False

def create_indexes():
    """Create MongoDB indexes"""
    try:
        logger.info("Creating MongoDB indexes...")
        subprocess.run([sys.executable, "create_indexes.py"], check=True)
        logger.info("Index creation completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Index creation failed: {e}")
        return False

def start_api_server():
    """Start the API server"""
    logger.info("Starting API server...")
    
    # In Windows, we'll use a slightly different approach
    if sys.platform == 'win32':
        # Start using python directly
        return subprocess.Popen([sys.executable, "api_server.py"])
    else:
        # On Unix systems, we could use gunicorn
        return subprocess.Popen(["gunicorn", "-b", "0.0.0.0:5000", "api_server:app"])

def main():
    """Main function to start all backend components"""
    logger.info("Starting ETL + Dashboard backend components...")
    
    # Step 1: Check MongoDB connection
    if not check_mongodb():
        return
        
    # Step 2: Run data validation
    run_data_validation()
    
    # Step 3: Create indexes
    create_indexes()
    
    # Step 4: Start API server
    api_process = start_api_server()
    
    logger.info("All backend components started successfully!")
    logger.info("API server is running on http://localhost:5000")
    logger.info("Press Ctrl+C to stop all components")
    
    # Keep the script running until user interrupts
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Stopping all components...")
        if api_process:
            api_process.terminate()
        logger.info("All components stopped")

if __name__ == "__main__":
    main()