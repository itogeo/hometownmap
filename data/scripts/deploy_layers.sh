#!/bin/bash
# Deploy processed layers to web app
# Usage: ./deploy_layers.sh [city]

set -e

CITY=${1:-three-forks}
SCRIPT_DIR="$(dirname "$0")"
REPO_ROOT="$SCRIPT_DIR/../.."

# Source and destination
SOURCE_DIR="$SCRIPT_DIR/../processed/${CITY}"
DEST_DIR="$REPO_ROOT/apps/web/public/data/layers/${CITY}"

echo "=== Deploy Layers to Web App ==="
echo "City: $CITY"
echo "Source: $SOURCE_DIR"
echo "Destination: $DEST_DIR"
echo ""

# Check source exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "ERROR: Source directory not found: $SOURCE_DIR"
    echo ""
    echo "Did you run the processing step?"
    echo "  python process_layers.py --city $CITY"
    exit 1
fi

# Create destination if needed
mkdir -p "$DEST_DIR"

# Copy files
echo "Copying files..."
for file in "$SOURCE_DIR"/*.geojson; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        cp "$file" "$DEST_DIR/$filename"
        echo "  -> $filename"
    fi
done

echo ""
echo "=== Deploy Complete ==="
echo ""
echo "Files deployed to: $DEST_DIR"
ls -la "$DEST_DIR"
echo ""
echo "Next: Test locally with 'npm run dev' or deploy to production"
