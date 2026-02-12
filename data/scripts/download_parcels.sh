#!/bin/bash
# Download parcel data from Montana Cadastral
# Usage: ./download_parcels.sh [city] [county]
#   city: three-forks (default)
#   county: GALLATIN (default)

set -e

CITY=${1:-three-forks}
COUNTY=${2:-GALLATIN}

# Bounding box for Three Forks area
BBOX="-111.7,45.8,-111.4,46.0"
BBOX_ENCODED="-111.7%2C45.8%2C-111.4%2C46.0"

# Output directory
OUTPUT_DIR="$(dirname "$0")/../raw/${CITY}"
mkdir -p "$OUTPUT_DIR"

echo "=== Montana Cadastral Parcel Download ==="
echo "City: $CITY"
echo "County: $COUNTY"
echo "Output: $OUTPUT_DIR"
echo ""

# Montana Cadastral API
BASE="https://gis.mt.gov/arcgis/rest/services/MSL/Cadastral/MapServer/0"

# Download parcels
# Note: Large datasets may need pagination (resultOffset, resultRecordCount)
URL="${BASE}/query?where=countyname%3D%27${COUNTY}%27&geometry=${BBOX_ENCODED}&geometryType=esriGeometryEnvelope&outFields=*&f=geojson"

echo "Downloading parcels for ${COUNTY} county..."
echo "URL: $URL"
echo ""

OUTPUT="$OUTPUT_DIR/parcels.geojson"

if curl -s "$URL" -o "$OUTPUT"; then
    count=$(grep -o '"type":"Feature"' "$OUTPUT" 2>/dev/null | wc -l | tr -d ' ')
    echo "  -> $count parcels saved to $OUTPUT"

    # Show sample of fields
    echo ""
    echo "Sample fields:"
    head -c 2000 "$OUTPUT" | grep -o '"[A-Za-z_]*":' | sort -u | head -20
else
    echo "  -> FAILED"
    exit 1
fi

echo ""
echo "=== Download Complete ==="
