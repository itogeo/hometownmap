#!/usr/bin/env python3
"""
Download FEMA National Flood Hazard Layer (NFHL) data for a specific area.

This script downloads flood zone polygons from FEMA's public ArcGIS REST service
and clips them to the Three Forks area.

FEMA NFHL Service: https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer

Layers:
  - Layer 28: S_FLD_HAZ_AR (Flood Hazard Areas - the main flood zone polygons)
  - Layer 14: S_BFE (Base Flood Elevations)
  - Layer 24: S_XS (Cross Sections)

Usage:
    python download_fema_nfhl.py

Output:
    datasets/cities/three-forks/processed/flood_zones.geojson
"""

import json
import os
import requests
from pathlib import Path

# Configuration
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
OUTPUT_DIR = PROJECT_ROOT / "datasets" / "cities" / "three-forks" / "processed"

# FEMA NFHL ArcGIS REST Service
# Correct URL with /arcgis/ in path
FEMA_BASE_URL = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer"
FLOOD_HAZARD_LAYER = 28  # S_FLD_HAZ_AR - Flood Hazard Areas

# Gallatin County, Montana bounding box
# Covers the entire county for comprehensive flood data
GALLATIN_COUNTY_BBOX = {
    "xmin": -111.95,  # West (past Three Forks)
    "ymin": 45.0,     # South (below Big Sky)
    "xmax": -110.0,   # East (to county line)
    "ymax": 46.25,    # North (past Manhattan)
    "spatialReference": {"wkid": 4326}
}

# Use county-wide bbox
THREE_FORKS_BBOX = GALLATIN_COUNTY_BBOX

def download_fema_flood_zones():
    """Download flood zone polygons from FEMA NFHL service with pagination."""

    print("🌊 Downloading FEMA Flood Hazard Areas...")
    print(f"   Bounding box: {THREE_FORKS_BBOX['xmin']}, {THREE_FORKS_BBOX['ymin']} to {THREE_FORKS_BBOX['xmax']}, {THREE_FORKS_BBOX['ymax']}")

    # Build query URL
    query_url = f"{FEMA_BASE_URL}/{FLOOD_HAZARD_LAYER}/query"

    all_features = []
    offset = 0
    batch_size = 2000  # FEMA's max record limit

    try:
        while True:
            # Query parameters with pagination
            params = {
                "where": "1=1",  # Get all features
                "geometry": json.dumps(THREE_FORKS_BBOX),
                "geometryType": "esriGeometryEnvelope",
                "spatialRel": "esriSpatialRelIntersects",
                "outFields": "FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE,DEPTH,VELOCITY,FLD_AR_ID,SOURCE_CIT",
                "returnGeometry": "true",
                "outSR": "4326",
                "f": "geojson",
                "resultOffset": offset,
                "resultRecordCount": batch_size
            }

            print(f"   Querying FEMA service (offset {offset})...")
            response = requests.get(query_url, params=params, timeout=60)
            response.raise_for_status()

            data = response.json()

            if "features" not in data:
                print(f"   ⚠️ Unexpected response: {data.get('error', 'Unknown error')}")
                break

            batch_count = len(data["features"])
            all_features.extend(data["features"])
            print(f"   ✅ Downloaded {batch_count} polygons (total: {len(all_features)})")

            # Check if there are more records
            if not data.get("exceededTransferLimit", False) and batch_count < batch_size:
                break

            offset += batch_size

        if len(all_features) == 0:
            print("   ⚠️ No flood zones found in this area")
            return None

        # Filter out polygons that are too large (likely regional polygons not clipped to our area)
        # For county-wide data, allow larger polygons but filter extreme outliers
        MAX_POLYGON_SIZE = 0.5  # degrees (~30 miles) - reasonable for county-wide data

        def get_polygon_size(coords):
            """Get approximate size of polygon from coordinates"""
            minx, maxx, miny, maxy = 180, -180, 90, -90
            def process(c):
                nonlocal minx, maxx, miny, maxy
                if isinstance(c[0], (int, float)):
                    minx, maxx = min(minx, c[0]), max(maxx, c[0])
                    miny, maxy = min(miny, c[1]), max(maxy, c[1])
                else:
                    for item in c:
                        process(item)
            process(coords)
            return max(maxx - minx, maxy - miny)

        filtered_features = []
        removed_count = 0
        for feat in all_features:
            size = get_polygon_size(feat['geometry']['coordinates'])
            if size <= MAX_POLYGON_SIZE:
                filtered_features.append(feat)
            else:
                removed_count += 1
                zone = feat['properties'].get('FLD_ZONE', '?')
                print(f"   ⚠️ Removed oversized {zone} polygon ({size:.3f} degrees)")

        if removed_count > 0:
            print(f"   📏 Filtered out {removed_count} oversized polygons")

        all_features = filtered_features

        # Build final GeoJSON
        final_data = {
            "type": "FeatureCollection",
            "features": all_features,
            "name": "FEMA Flood Hazard Areas",
            "source": "FEMA National Flood Hazard Layer (NFHL)",
            "download_date": __import__("datetime").datetime.now().isoformat(),
            "bounding_box": {
                "west": THREE_FORKS_BBOX["xmin"],
                "east": THREE_FORKS_BBOX["xmax"],
                "south": THREE_FORKS_BBOX["ymin"],
                "north": THREE_FORKS_BBOX["ymax"]
            }
        }

        # Ensure output directory exists
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

        # Save to file
        output_path = OUTPUT_DIR / "flood_zones.geojson"
        with open(output_path, "w") as f:
            json.dump(final_data, f)

        print(f"   💾 Saved to: {output_path}")

        # Print summary of flood zones found
        zones = {}
        for feature in all_features:
            zone = feature["properties"].get("FLD_ZONE", "Unknown")
            zones[zone] = zones.get(zone, 0) + 1

        print("\n   Flood zones found:")
        for zone, count in sorted(zones.items()):
            zone_desc = get_zone_description(zone)
            print(f"     - {zone}: {count} polygons ({zone_desc})")

        return final_data

    except requests.exceptions.RequestException as e:
        print(f"   ❌ Error downloading data: {e}")
        return None

def get_zone_description(zone_code):
    """Get human-readable description for flood zone codes."""
    descriptions = {
        "A": "100-year flood, no BFE determined",
        "AE": "100-year flood, base flood elevations determined",
        "AH": "100-year flood, shallow flooding (1-3 ft)",
        "AO": "100-year flood, sheet flow (1-3 ft)",
        "AR": "Special flood hazard area, temporarily reverted",
        "A99": "100-year flood, federal flood protection under construction",
        "V": "Coastal 100-year flood with velocity",
        "VE": "Coastal 100-year flood with velocity and BFE",
        "X": "Area of minimal flood hazard",
        "D": "Undetermined flood hazard",
        "AREA NOT INCLUDED": "Area not mapped",
        "OPEN WATER": "River, lake, or other open water",
    }
    return descriptions.get(zone_code, "Other flood zone")

if __name__ == "__main__":
    print("=" * 60)
    print("FEMA NFHL Flood Zone Downloader")
    print("Three Forks, Montana")
    print("=" * 60)
    print()

    result = download_fema_flood_zones()

    if result:
        print()
        print("✅ Download complete!")
        print("   The flood_zones layer is now available in the Environmental mode.")
    else:
        print()
        print("❌ Download failed. Check your internet connection and try again.")
