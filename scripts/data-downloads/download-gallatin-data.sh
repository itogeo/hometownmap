#!/bin/bash
# Download additional Gallatin County GIS data from ArcGIS REST services
# These layers are queryable but not on the official download page

OUTPUT_DIR="../datasets/cities/three-forks/raw/gallatin-county"
mkdir -p "$OUTPUT_DIR"

BASE_URL="https://gis.gallatin.mt.gov/arcgis/rest/services/MapServices"

# Three Forks bounding box (approximate) for filtering
# Use this geometry envelope to limit results to Three Forks area
# Format: xmin,ymin,xmax,ymax in Web Mercator (EPSG:3857)
# Three Forks is roughly: -111.6 to -111.5 longitude, 45.85 to 45.95 latitude
# In Web Mercator: approximately -12422000,-12412000 X, 5750000-5770000 Y
GEOMETRY_FILTER="&geometryType=esriGeometryEnvelope&geometry=-12425000,5748000,-12405000,5772000&inSR=102100"

echo "=== Downloading Environmental Health (EHS) Data ==="

echo "Downloading: Groundwater Monitor Wells..."
curl -s "$BASE_URL/EHS/MapServer/0/query?where=1=1&outFields=*&f=geojson$GEOMETRY_FILTER" \
  -o "$OUTPUT_DIR/groundwater_monitor_wells.geojson"

echo "Downloading: Wastewater Treatment Systems..."
curl -s "$BASE_URL/EHS/MapServer/1/query?where=1=1&outFields=*&f=geojson$GEOMETRY_FILTER" \
  -o "$OUTPUT_DIR/wastewater_treatment_systems.geojson"

echo "Downloading: Water Supply Systems..."
curl -s "$BASE_URL/EHS/MapServer/2/query?where=1=1&outFields=*&f=geojson$GEOMETRY_FILTER" \
  -o "$OUTPUT_DIR/water_supply_systems.geojson"

echo "Downloading: Septage Land Application Sites..."
curl -s "$BASE_URL/EHS/MapServer/15/query?where=1=1&outFields=*&f=geojson$GEOMETRY_FILTER" \
  -o "$OUTPUT_DIR/septage_land_application.geojson"

echo "Downloading: Landslides..."
curl -s "$BASE_URL/EHS/MapServer/16/query?where=1=1&outFields=*&f=geojson$GEOMETRY_FILTER" \
  -o "$OUTPUT_DIR/landslides.geojson"

echo "Downloading: Soils (NRCS)..."
curl -s "$BASE_URL/EHS/MapServer/19/query?where=1=1&outFields=*&f=geojson$GEOMETRY_FILTER&resultRecordCount=5000" \
  -o "$OUTPUT_DIR/soils_nrcs.geojson"

echo ""
echo "=== Downloading Planning Data ==="

echo "Downloading: Planning Jurisdictions..."
curl -s "$BASE_URL/Planning/MapServer/8/query?where=1=1&outFields=*&f=geojson$GEOMETRY_FILTER" \
  -o "$OUTPUT_DIR/planning_jurisdictions.geojson"

echo "Downloading: Zoning Designations..."
curl -s "$BASE_URL/Planning/MapServer/9/query?where=1=1&outFields=*&f=geojson$GEOMETRY_FILTER" \
  -o "$OUTPUT_DIR/zoning_designations.geojson"

echo "Downloading: Neighborhood Plans..."
curl -s "$BASE_URL/Planning/MapServer/10/query?where=1=1&outFields=*&f=geojson$GEOMETRY_FILTER" \
  -o "$OUTPUT_DIR/neighborhood_plans.geojson"

echo "Downloading: Subdivisions..."
curl -s "$BASE_URL/Planning/MapServer/12/query?where=1=1&outFields=*&f=geojson$GEOMETRY_FILTER" \
  -o "$OUTPUT_DIR/subdivisions.geojson"

echo "Downloading: Minor Subdivisions..."
curl -s "$BASE_URL/Planning/MapServer/13/query?where=1=1&outFields=*&f=geojson$GEOMETRY_FILTER" \
  -o "$OUTPUT_DIR/minor_subdivisions.geojson"

echo "Downloading: Conservation Easements..."
curl -s "$BASE_URL/Planning/MapServer/15/query?where=1=1&outFields=*&f=geojson$GEOMETRY_FILTER" \
  -o "$OUTPUT_DIR/conservation_easements.geojson"

echo "Downloading: Wildland Urban Interface..."
curl -s "$BASE_URL/Planning/MapServer/16/query?where=1=1&outFields=*&f=geojson$GEOMETRY_FILTER" \
  -o "$OUTPUT_DIR/wildland_urban_interface.geojson"

echo ""
echo "=== Downloading Additional Services ==="

echo "Downloading: FEMA Flood Zones..."
curl -s "$BASE_URL/FEMA/MapServer/0/query?where=1=1&outFields=*&f=geojson$GEOMETRY_FILTER" \
  -o "$OUTPUT_DIR/fema_flood_zones.geojson" 2>/dev/null || echo "  (may require different layer ID)"

echo "Downloading: Fire Districts (Schools service)..."
curl -s "$BASE_URL/Schools/MapServer/0/query?where=1=1&outFields=*&f=geojson$GEOMETRY_FILTER" \
  -o "$OUTPUT_DIR/school_districts.geojson" 2>/dev/null || echo "  (may require different layer ID)"

echo ""
echo "=== Download Complete ==="
echo "Files saved to: $OUTPUT_DIR"
echo ""
echo "Note: Some files may be empty if no features exist in the Three Forks area."
echo "Check file sizes with: ls -la $OUTPUT_DIR"
