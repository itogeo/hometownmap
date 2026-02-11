#!/bin/bash
# Prepare data for Cloudflare Pages deployment
# This script copies GeoJSON data files to the public directory for static serving

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
WEB_DIR="$ROOT_DIR/apps/web"
PUBLIC_DATA_DIR="$WEB_DIR/public/data"

echo "Preparing data for static deployment..."

# Create directories
mkdir -p "$PUBLIC_DATA_DIR/config"
mkdir -p "$PUBLIC_DATA_DIR/layers/three-forks"

# Copy city config
echo "Copying city configuration..."
cp "$ROOT_DIR/config/cities/three-forks.json" "$PUBLIC_DATA_DIR/config/"

# Copy processed GeoJSON files (skip files larger than 5MB for performance)
echo "Copying GeoJSON layers..."
cd "$ROOT_DIR/datasets/cities/three-forks/processed"
for f in *.geojson; do
    # Get file size in bytes
    size=$(stat -f%z "$f" 2>/dev/null || stat --format=%s "$f" 2>/dev/null)
    # Only copy files under 5MB (5000000 bytes)
    if [ "$size" -lt 5000000 ]; then
        cp "$f" "$PUBLIC_DATA_DIR/layers/three-forks/"
        echo "  Copied $f ($(($size / 1024))KB)"
    else
        echo "  Skipped $f ($(($size / 1024 / 1024))MB - too large)"
    fi
done

echo "Data preparation complete!"
echo "Files copied to: $PUBLIC_DATA_DIR"
