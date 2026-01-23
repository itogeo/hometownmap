#!/bin/bash
#
# Full Data Processing Pipeline for Three Forks
# Runs everything in sequence with progress updates
#

set -e  # Exit on any error

CITY="three-forks"
COUNTY="gallatin"

echo "=============================================================="
echo "🚀 THREE FORKS DATA PIPELINE"
echo "=============================================================="
echo ""

# Step 1: Create expansion boundary
echo "📍 Step 1: Creating 5-mile expansion boundary..."
python3 create_expansion_boundary.py --buffer-miles 5 --city $CITY --county $COUNTY
echo "✅ Step 1 complete!"
echo ""

# Step 2: Extract Gallatin County parcels
echo "📦 Step 2: Extracting Gallatin County parcels (2-3 minutes)..."
python3 extract_gallatin_parcels.py
echo "✅ Step 2 complete!"
echo ""

# Step 3: Clip parcels to expansion area
echo "✂️  Step 3: Clipping parcels to Three Forks expansion area..."
python3 clip_parcels_to_city.py --city $CITY --county $COUNTY
echo "✅ Step 3 complete!"
echo ""

# Step 4: Process supporting layers
echo "🗺️  Step 4: Processing supporting layers..."

echo "  Processing cities..."
python3 etl/transform.py --city $CITY --dataset cities --output

echo "  Processing school districts..."
python3 etl/transform.py --city $CITY --dataset schooldistricts --output

echo "  Processing waterways..."
python3 etl/transform.py --city $CITY --dataset waterways --output

echo "✅ Step 4 complete!"
echo ""

# Step 5: Generate metadata
echo "📋 Step 5: Generating metadata for all datasets..."
python3 generate_metadata.py --city $CITY
echo "✅ Step 5 complete!"
echo ""

# Summary
echo "=============================================================="
echo "✅ PIPELINE COMPLETE!"
echo "=============================================================="
echo ""
echo "📊 Datasets processed:"
ls -lh ../datasets/cities/$CITY/processed/*.geojson
echo ""
echo "📝 Metadata generated:"
ls ../datasets/cities/$CITY/processed/metadata/
echo ""
echo "🌐 Next: Open http://localhost:3001 to see the map!"
echo "=============================================================="
