#!/bin/bash
# Download all data layers for a city
# Usage: ./download_all.sh [city]

set -e

CITY=${1:-three-forks}
SCRIPT_DIR="$(dirname "$0")"

echo "=============================================="
echo "  HometownMap Data Download"
echo "  City: $CITY"
echo "  $(date)"
echo "=============================================="
echo ""

# 1. Download Montana Cadastral parcels
echo ">>> Step 1: Montana Cadastral (Parcels)"
"$SCRIPT_DIR/download_parcels.sh" "$CITY"
echo ""

# 2. Download Gallatin County layers
echo ">>> Step 2: Gallatin County Layers"
"$SCRIPT_DIR/download_gallatin.sh" "$CITY"
echo ""

# 3. Summary
echo "=============================================="
echo "  Download Complete!"
echo "=============================================="
echo ""
echo "Raw data saved to: $SCRIPT_DIR/../raw/$CITY/"
echo ""
echo "Next steps:"
echo "  1. Review downloaded files"
echo "  2. Run processing: python process_layers.py --city $CITY"
echo "  3. Deploy: ./deploy_layers.sh $CITY"
