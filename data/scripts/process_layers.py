#!/usr/bin/env python3
"""
HometownMap Layer Processing Script

Transforms raw downloaded data into map-ready GeoJSON format.

Usage:
    python process_layers.py --city three-forks
    python process_layers.py --city three-forks --layer parcels
"""

import json
import os
import argparse
from pathlib import Path
from datetime import datetime


def load_geojson(filepath):
    """Load a GeoJSON file."""
    with open(filepath, 'r') as f:
        return json.load(f)


def save_geojson(data, filepath):
    """Save GeoJSON with pretty formatting."""
    with open(filepath, 'w') as f:
        json.dump(data, f)  # Compact for production
    print(f"  -> Saved {len(data.get('features', []))} features to {filepath}")


def validate_geojson(data, layer_name):
    """Basic validation of GeoJSON structure."""
    if not isinstance(data, dict):
        print(f"  WARNING: {layer_name} is not a valid GeoJSON object")
        return False

    if data.get('type') != 'FeatureCollection':
        print(f"  WARNING: {layer_name} is not a FeatureCollection")
        return False

    features = data.get('features', [])
    if not features:
        print(f"  WARNING: {layer_name} has no features")
        return False

    # Check for geometry
    valid = 0
    for f in features:
        if f.get('geometry') and f['geometry'].get('coordinates'):
            valid += 1

    if valid < len(features):
        print(f"  WARNING: {layer_name} has {len(features) - valid} features without geometry")

    return True


def process_parcels(data):
    """Process parcel data - standardize field names."""
    features = data.get('features', [])

    for f in features:
        props = f.get('properties', {})

        # Ensure consistent field names (lowercase)
        standardized = {}
        for key, value in props.items():
            standardized[key.lower()] = value

        f['properties'] = standardized

    return data


def process_standard(data):
    """Standard processing for most layers."""
    # Just validate and pass through
    return data


def clip_to_bbox(data, bbox):
    """
    Clip features to bounding box.
    bbox: [min_lon, min_lat, max_lon, max_lat]
    """
    min_lon, min_lat, max_lon, max_lat = bbox

    def point_in_bbox(coords):
        if not coords:
            return False
        lon, lat = coords[0], coords[1]
        return min_lon <= lon <= max_lon and min_lat <= lat <= max_lat

    def feature_in_bbox(feature):
        geom = feature.get('geometry', {})
        geom_type = geom.get('type', '')
        coords = geom.get('coordinates', [])

        if geom_type == 'Point':
            return point_in_bbox(coords)
        elif geom_type in ('LineString', 'MultiPoint'):
            return any(point_in_bbox(c) for c in coords)
        elif geom_type == 'Polygon':
            return any(point_in_bbox(c) for ring in coords for c in ring)
        elif geom_type == 'MultiPolygon':
            return any(
                point_in_bbox(c)
                for poly in coords
                for ring in poly
                for c in ring
            )
        elif geom_type == 'MultiLineString':
            return any(point_in_bbox(c) for line in coords for c in line)

        return True  # Keep if unknown geometry type

    original_count = len(data.get('features', []))
    data['features'] = [f for f in data.get('features', []) if feature_in_bbox(f)]
    clipped_count = len(data['features'])

    if clipped_count < original_count:
        print(f"  Clipped: {original_count} -> {clipped_count} features")

    return data


def main():
    parser = argparse.ArgumentParser(description='Process HometownMap layers')
    parser.add_argument('--city', default='three-forks', help='City name')
    parser.add_argument('--layer', default='all', help='Layer to process (or "all")')
    args = parser.parse_args()

    # Paths
    script_dir = Path(__file__).parent
    raw_dir = script_dir.parent / 'raw' / args.city
    processed_dir = script_dir.parent / 'processed' / args.city

    print("=" * 50)
    print(f"  HometownMap Layer Processing")
    print(f"  City: {args.city}")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    print()

    # Check raw directory
    if not raw_dir.exists():
        print(f"ERROR: Raw data directory not found: {raw_dir}")
        print("\nRun download scripts first:")
        print(f"  ./download_all.sh {args.city}")
        return 1

    # Create processed directory
    processed_dir.mkdir(parents=True, exist_ok=True)

    # City bounding box (for clipping)
    bbox = [-111.7, 45.8, -111.4, 46.0]  # Three Forks

    # Process each layer
    layers_processed = 0
    for raw_file in raw_dir.glob('*.geojson'):
        layer_name = raw_file.stem

        if args.layer != 'all' and layer_name != args.layer:
            continue

        print(f"Processing: {layer_name}")

        try:
            data = load_geojson(raw_file)

            if not validate_geojson(data, layer_name):
                continue

            # Apply layer-specific processing
            if layer_name == 'parcels':
                data = process_parcels(data)
            else:
                data = process_standard(data)

            # Clip to city bounds
            data = clip_to_bbox(data, bbox)

            # Save processed file
            output_file = processed_dir / f"{layer_name}.geojson"
            save_geojson(data, output_file)
            layers_processed += 1

        except Exception as e:
            print(f"  ERROR: {e}")

    print()
    print("=" * 50)
    print(f"  Processing Complete")
    print(f"  Layers processed: {layers_processed}")
    print(f"  Output: {processed_dir}")
    print("=" * 50)
    print()
    print("Next: Deploy to web app")
    print(f"  ./deploy_layers.sh {args.city}")

    return 0


if __name__ == '__main__':
    exit(main())
