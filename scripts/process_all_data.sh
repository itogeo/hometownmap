#!/bin/bash

# Process All GIS Data for Three Forks
# This script extracts, analyzes, and processes all Gallatin County data

set -e  # Exit on error

echo "🗺️  HometownMap - Complete Data Processing"
echo "=========================================="
echo ""

# Change to scripts directory
cd "$(dirname "$0")"

# Step 1: Unzip all data
echo "📦 Step 1: Unzipping all raw data..."
python3 unzip_all_data.py
echo ""

# Step 2: Create inventory
echo "📊 Step 2: Creating data inventory..."
python3 data_inventory.py
echo ""

# Step 3: Run ETL pipeline
echo "🔄 Step 3: Running ETL pipeline for Three Forks..."
echo "   This will process all 12 datasets and clip to Three Forks boundary"
echo ""
python3 etl/pipeline.py --city three-forks
echo ""

echo "=========================================="
echo "✅ DATA PROCESSING COMPLETE!"
echo "=========================================="
echo ""
echo "Processed data is now in:"
echo "  datasets/cities/three-forks/processed/"
echo ""
echo "Next steps:"
echo "  1. Restart the dev server (if running)"
echo "  2. Refresh your browser"
echo "  3. Real data will now appear on the map!"
echo ""
