#!/usr/bin/env python3
"""
Convert Building Permit CSV to GeoJSON with approximate geocoding.

This script reads permit data from the Montana EBIZ portal and converts it
to GeoJSON format with approximate coordinates based on street addresses.

Usage:
    python convert_permits_to_geojson.py
"""

import csv
import json
import re
from pathlib import Path
from datetime import datetime

# Configuration
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
INPUT_FILE = PROJECT_ROOT / "datasets" / "cities" / "three-forks" / "raw" / "building_permits.csv"
OUTPUT_FILE = PROJECT_ROOT / "datasets" / "cities" / "three-forks" / "processed" / "building_permits.geojson"

# Three Forks city center
CITY_CENTER = [-111.5514, 45.8925]

# Known street coordinates in Three Forks (approximate centroids)
# Format: street_name_lower -> [lon, lat]
STREET_COORDS = {
    "main": [-111.5514, 45.8920],
    "s main": [-111.5514, 45.8905],
    "s. main": [-111.5514, 45.8905],
    "south main": [-111.5514, 45.8905],
    "n main": [-111.5514, 45.8935],
    "ash": [-111.5530, 45.8932],
    "elm": [-111.5530, 45.8925],
    "cedar": [-111.5530, 45.8918],
    "birch": [-111.5530, 45.8912],
    "neal": [-111.5485, 45.8920],
    "e neal": [-111.5485, 45.8920],
    "1st ave": [-111.5530, 45.8930],
    "2nd ave": [-111.5545, 45.8930],
    "railway": [-111.5490, 45.8928],
    "colter": [-111.5470, 45.8945],
    "bench": [-111.5400, 45.8880],
    "frontage": [-111.5600, 45.8850],
    "ponderosa": [-111.5300, 45.8950],
    "madison river": [-111.5350, 45.8900],
    "madison": [-111.5350, 45.8900],
    "clarkston": [-111.5200, 45.8950],
    "price": [-111.5450, 45.8860],
    "juniper": [-111.5100, 45.8900],
    "trident": [-111.5300, 45.8700],
    "montana": [-111.5520, 45.8910],
    "stockyard": [-111.5480, 45.8880],
    "wheatland": [-111.5600, 45.8800],
    # Airport area
    "airport": [-111.5650, 45.8750],
    "three forks airport": [-111.5650, 45.8750],
    "3 forks airport": [-111.5650, 45.8750],
    "taxi lane": [-111.5650, 45.8755],
    "pogreba": [-111.5650, 45.8760],
    # Highway locations
    "hwy 287": [-111.5100, 45.8800],
    "highway 287": [-111.5100, 45.8800],
    "287": [-111.5100, 45.8800],
    "highway 2": [-111.5700, 45.8850],
    "montana highway 2": [-111.5700, 45.8850],
    # Rural areas
    "horseshoe": [-111.4800, 45.9000],
    "cottonwood": [-111.4800, 45.9000],
    "rolling prairie": [-111.5200, 45.9050],
}

def extract_street_from_address(address: str) -> str:
    """Extract the street name from an address string."""
    if not address:
        return ""

    # Remove city/state/zip
    address = re.sub(r'\s+THREE\s+FORKS.*$', '', address, flags=re.IGNORECASE)

    # Remove leading numbers and common suffixes
    address = re.sub(r'^\d+\s*', '', address)
    address = re.sub(r'\s+(ST|STREET|RD|ROAD|AVE|AVENUE|DR|DRIVE|LN|LANE|WAY|BLVD|CT|COURT)\s*$', '', address, flags=re.IGNORECASE)

    return address.strip().lower()

def geocode_address(address: str) -> tuple:
    """
    Attempt to geocode an address to coordinates.
    Returns (lon, lat) or None if unable to geocode.
    """
    if not address or address.strip() == "":
        return None

    address_lower = address.lower()

    # Check for known street patterns
    for street, coords in STREET_COORDS.items():
        if street in address_lower:
            # Add slight random offset based on street number if present
            match = re.search(r'^(\d+)', address)
            if match:
                num = int(match.group(1))
                # Offset slightly based on street number
                offset_lon = (num % 100) * 0.00005
                offset_lat = ((num // 100) % 10) * 0.00005
                return [coords[0] + offset_lon, coords[1] + offset_lat]
            return coords

    # Check for airport mentions
    if "airport" in address_lower or "hanger" in address_lower or "hangar" in address_lower:
        return STREET_COORDS["airport"]

    # Check for highway mentions
    if "287" in address_lower:
        return STREET_COORDS["hwy 287"]
    if "highway 2" in address_lower or "hwy 2" in address_lower:
        return STREET_COORDS["highway 2"]

    return None

def parse_date(date_str: str) -> str:
    """Parse date string to ISO format."""
    if not date_str:
        return None
    try:
        # Format: MM/DD/YYYY
        dt = datetime.strptime(date_str.strip(), "%m/%d/%Y")
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        return date_str

def convert_permits_to_geojson():
    """Convert the permit CSV to GeoJSON."""

    print("📋 Converting Building Permits to GeoJSON...")

    if not INPUT_FILE.exists():
        print(f"   ❌ Input file not found: {INPUT_FILE}")
        return None

    features = []
    skipped = 0
    geocoded = 0
    city_center_count = 0

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            permit_number = row.get('Permit Number', '').strip()
            permit_type = row.get('Permit Type', '').strip()
            status = row.get('Status', '').strip()
            issued_date = row.get('Issued Date', '').strip()
            owner_name = row.get('Owner Name', '').strip()
            project_name = row.get('Project Name', '').strip()
            location = row.get('Project Location', '').strip()

            # Try to geocode
            coords = geocode_address(location)

            if coords is None:
                # Use city center for ungeocoded addresses
                coords = CITY_CENTER.copy()
                # Add small offset to prevent stacking
                coords[0] += (len(features) % 20) * 0.0003 - 0.003
                coords[1] += (len(features) // 20) * 0.0003 - 0.002
                city_center_count += 1
            else:
                geocoded += 1

            # Clean up project name (remove county prefix)
            if project_name.startswith("Cty:("):
                project_name = project_name.split(")", 1)[-1].strip()

            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": coords
                },
                "properties": {
                    "id": permit_number,
                    "permit_number": permit_number,
                    "permit_type": permit_type,
                    "status": status,
                    "issued_date": parse_date(issued_date),
                    "owner_name": owner_name,
                    "project_name": project_name if project_name else None,
                    "address": location,
                    "geocoded": coords != CITY_CENTER
                }
            }

            features.append(feature)

    # Sort by date (most recent first)
    features.sort(key=lambda f: f["properties"]["issued_date"] or "", reverse=True)

    # Build GeoJSON
    geojson = {
        "type": "FeatureCollection",
        "name": "Three Forks Building Permits",
        "source": "Montana EBIZ Portal",
        "download_date": datetime.now().isoformat(),
        "features": features
    }

    # Save to file
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(geojson, f, indent=2)

    print(f"   ✅ Converted {len(features)} permits")
    print(f"   📍 Geocoded: {geocoded}, Approximate location: {city_center_count}")
    print(f"   💾 Saved to: {OUTPUT_FILE}")

    # Print status summary
    statuses = {}
    for f in features:
        s = f["properties"]["status"]
        statuses[s] = statuses.get(s, 0) + 1

    print("\n   Permit statuses:")
    for status, count in sorted(statuses.items(), key=lambda x: -x[1]):
        print(f"     - {status}: {count}")

    # Print year summary
    years = {}
    for f in features:
        date = f["properties"]["issued_date"]
        if date:
            year = date[:4]
            years[year] = years.get(year, 0) + 1

    print("\n   Permits by year:")
    for year, count in sorted(years.items(), reverse=True):
        print(f"     - {year}: {count}")

    return geojson

if __name__ == "__main__":
    print("=" * 60)
    print("Building Permit CSV to GeoJSON Converter")
    print("Three Forks, Montana")
    print("=" * 60)
    print()

    result = convert_permits_to_geojson()

    if result:
        print()
        print("✅ Conversion complete!")
    else:
        print()
        print("❌ Conversion failed.")
