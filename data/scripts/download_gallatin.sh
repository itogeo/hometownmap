#!/bin/bash
# Download data from Gallatin County ArcGIS REST Services
# Usage: ./download_gallatin.sh [city] [layer]
#   city: three-forks (default)
#   layer: all, hydrants, wells, wastewater, water_supply, subdivisions (default: all)

set -e

CITY=${1:-three-forks}
LAYER=${2:-all}

# Bounding box for Three Forks area
BBOX="-111.7,45.8,-111.4,46.0"
BBOX_ENCODED="-111.7%2C45.8%2C-111.4%2C46.0"

# Output directory
OUTPUT_DIR="$(dirname "$0")/../raw/${CITY}"
mkdir -p "$OUTPUT_DIR"

echo "=== Gallatin County Data Download ==="
echo "City: $CITY"
echo "Layer: $LAYER"
echo "Output: $OUTPUT_DIR"
echo ""

# Base URL
BASE="https://gis.gallatin.mt.gov/arcgis/rest/services"

download_layer() {
    local name=$1
    local url=$2
    local output="$OUTPUT_DIR/${name}.geojson"

    echo "Downloading $name..."
    if curl -s "$url" -o "$output"; then
        count=$(grep -o '"type":"Feature"' "$output" 2>/dev/null | wc -l | tr -d ' ')
        echo "  -> $count features saved to $output"
    else
        echo "  -> FAILED"
        return 1
    fi
}

# ESZ Service layers
if [[ "$LAYER" == "all" || "$LAYER" == "hydrants" ]]; then
    download_layer "hydrants" \
        "${BASE}/ESZ/ESZ/MapServer/3/query?where=FIRE_AREA%3D%27THREE+FORKS%27&outFields=*&f=geojson"
fi

if [[ "$LAYER" == "all" || "$LAYER" == "wells" ]]; then
    download_layer "groundwater_wells" \
        "${BASE}/ESZ/ESZ/MapServer/5/query?geometry=${BBOX_ENCODED}&geometryType=esriGeometryEnvelope&outFields=*&f=geojson"
fi

if [[ "$LAYER" == "all" || "$LAYER" == "wastewater" ]]; then
    download_layer "wastewater" \
        "${BASE}/ESZ/ESZ/MapServer/6/query?geometry=${BBOX_ENCODED}&geometryType=esriGeometryEnvelope&outFields=*&f=geojson"
fi

if [[ "$LAYER" == "all" || "$LAYER" == "water_supply" ]]; then
    download_layer "water_supply" \
        "${BASE}/ESZ/ESZ/MapServer/7/query?geometry=${BBOX_ENCODED}&geometryType=esriGeometryEnvelope&outFields=*&f=geojson"
fi

if [[ "$LAYER" == "all" || "$LAYER" == "firedistricts" ]]; then
    download_layer "firedistricts" \
        "${BASE}/ESZ/ESZ/MapServer/0/query?where=1%3D1&outFields=*&f=geojson"
fi

if [[ "$LAYER" == "all" || "$LAYER" == "schooldistricts" ]]; then
    download_layer "schooldistricts" \
        "${BASE}/ESZ/ESZ/MapServer/1/query?where=1%3D1&outFields=*&f=geojson"
fi

# Subdivision Service layers
if [[ "$LAYER" == "all" || "$LAYER" == "subdivisions" ]]; then
    download_layer "subdivisions" \
        "${BASE}/Subdivision/SubDivision/MapServer/0/query?geometry=${BBOX_ENCODED}&geometryType=esriGeometryEnvelope&outFields=*&f=geojson"
fi

if [[ "$LAYER" == "all" || "$LAYER" == "minor_subdivisions" ]]; then
    download_layer "minor_subdivisions" \
        "${BASE}/Subdivision/SubDivision/MapServer/1/query?geometry=${BBOX_ENCODED}&geometryType=esriGeometryEnvelope&outFields=*&f=geojson"
fi

# Environmental layers
if [[ "$LAYER" == "all" || "$LAYER" == "wui" ]]; then
    download_layer "wui" \
        "${BASE}/Fire/WUI/MapServer/0/query?geometry=${BBOX_ENCODED}&geometryType=esriGeometryEnvelope&outFields=*&f=geojson"
fi

if [[ "$LAYER" == "all" || "$LAYER" == "conservation" ]]; then
    download_layer "conservation" \
        "${BASE}/Land/Conservation/MapServer/0/query?geometry=${BBOX_ENCODED}&geometryType=esriGeometryEnvelope&outFields=*&f=geojson"
fi

echo ""
echo "=== Download Complete ==="
echo "Files saved to: $OUTPUT_DIR"
ls -la "$OUTPUT_DIR"
