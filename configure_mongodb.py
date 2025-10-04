#!/usr/bin/env python3
"""
MongoDB Configuration Setup Script
==================================

This script helps you configure your MongoDB connection string for the ETL pipeline.
"""

import os
import sys

def setup_mongodb_config():
    """Interactive setup for MongoDB configuration"""
    
    print("🔧 MongoDB Configuration Setup")
    print("=" * 40)
    
    # Read current config
    config_file = "config.env"
    current_config = {}
    
    if os.path.exists(config_file):
        with open(config_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    current_config[key] = value
    
    print(f"Current MongoDB URI: {current_config.get('MONGODB_URI', 'Not set')}")
    print()
    
    # Get new connection string
    print("Please enter your MongoDB connection string:")
    print("Examples:")
    print("  Local: mongodb://localhost:27017/")
    print("  Atlas: mongodb+srv://username:password@cluster.mongodb.net/")
    print("  Custom: mongodb://username:password@host:port/database")
    print()
    
    new_uri = input("MongoDB URI: ").strip()
    
    if not new_uri:
        print("❌ No URI provided. Keeping current configuration.")
        return
    
    # Validate basic format
    if not new_uri.startswith(('mongodb://', 'mongodb+srv://')):
        print("⚠️  Warning: URI should start with 'mongodb://' or 'mongodb+srv://'")
        confirm = input("Continue anyway? (y/N): ").strip().lower()
        if confirm != 'y':
            print("❌ Configuration cancelled.")
            return
    
    # Update configuration
    current_config['MONGODB_URI'] = new_uri
    
    # Optional: Update other settings
    print("\nOptional configuration (press Enter to keep current values):")
    
    db_name = input(f"Database name [{current_config.get('DATABASE_NAME', 'finance_db')}]: ").strip()
    if db_name:
        current_config['DATABASE_NAME'] = db_name
    
    collection_name = input(f"Collection name [{current_config.get('COLLECTION_NAME', 'transactions')}]: ").strip()
    if collection_name:
        current_config['COLLECTION_NAME'] = collection_name
    
    data_dir = input(f"Data directory [{current_config.get('DATA_DIRECTORY', 'Hackathon/Inputs')}]: ").strip()
    if data_dir:
        current_config['DATA_DIRECTORY'] = data_dir
    
    # Write updated configuration
    try:
        with open(config_file, 'w') as f:
            f.write("# ETL Pipeline Configuration\n")
            f.write("# ========================\n\n")
            f.write("# MongoDB Configuration\n")
            f.write(f"MONGODB_URI={current_config.get('MONGODB_URI', '')}\n\n")
            f.write("# Database and Collection Settings\n")
            f.write(f"DATABASE_NAME={current_config.get('DATABASE_NAME', 'finance_db')}\n")
            f.write(f"COLLECTION_NAME={current_config.get('COLLECTION_NAME', 'transactions')}\n\n")
            f.write("# Data Processing Settings\n")
            f.write(f"BATCH_SIZE={current_config.get('BATCH_SIZE', '1000')}\n\n")
            f.write("# File Processing Settings\n")
            f.write(f"DATA_DIRECTORY={current_config.get('DATA_DIRECTORY', 'Hackathon/Inputs')}\n\n")
            f.write("# Logging Level (DEBUG, INFO, WARNING, ERROR)\n")
            f.write(f"LOG_LEVEL={current_config.get('LOG_LEVEL', 'INFO')}\n")
        
        print(f"\n✅ Configuration saved to {config_file}")
        print("\n🚀 You can now run the ETL pipeline:")
        print("   python etl_pipeline.py")
        
    except Exception as e:
        print(f"❌ Error saving configuration: {e}")

def test_connection():
    """Test MongoDB connection"""
    try:
        # Import here to avoid issues if pymongo is not installed
        from pymongo import MongoClient
        
        # Load config
        config_file = "config.env"
        mongo_uri = None
        
        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('MONGODB_URI='):
                        mongo_uri = line.split('=', 1)[1]
                        break
        
        if not mongo_uri:
            print("❌ No MongoDB URI found in configuration")
            return False
        
        print("🔍 Testing MongoDB connection...")
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        
        # Test connection
        client.server_info()
        print("✅ MongoDB connection successful!")
        
        # Show server info
        server_info = client.server_info()
        print(f"📊 MongoDB version: {server_info.get('version', 'Unknown')}")
        
        client.close()
        return True
        
    except ImportError:
        print("⚠️  pymongo not installed. Run: pip install -r requirements.txt")
        return False
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("\n💡 Common issues:")
        print("   - Check your connection string format")
        print("   - Ensure MongoDB server is running")
        print("   - Verify network connectivity")
        print("   - Check username/password if using authentication")
        return False

def main():
    """Main function"""
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        test_connection()
    else:
        setup_mongodb_config()

if __name__ == "__main__":
    main()