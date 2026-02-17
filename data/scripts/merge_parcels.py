#!/usr/bin/env python3
"""
Merge Adjacent Parcels by Owner

Combines adjacent parcels with the same owner (ownername + tax address)
into single polygon features for cleaner map display.

Usage:
    python merge_parcels.py --input parcels.geojson --output parcels_merged.geojson

Requirements:
    pip install shapely

Algorithm:
1. Group parcels by owner key (ownername + citystatez)
2. For each group with multiple parcels:
   - Check which parcels are adjacent (touch or overlap)
   - Merge adjacent parcels into single polygons
   - Keep non-adjacent parcels separate
3. Aggregate property values (sum acres, sum value)
"""

import json
import argparse
from collections import defaultdict
from pathlib import Path

try:
    from shapely.geometry import shape, mapping
    from shapely.ops import unary_union
    from shapely.validation import make_valid
    SHAPELY_AVAILABLE = True
except ImportError:
    SHAPELY_AVAILABLE = False
    print("WARNING: Shapely not installed. Install with: pip install shapely")


def load_geojson(filepath):
    """Load GeoJSON file."""
    with open(filepath, 'r') as f:
        return json.load(f)


def save_geojson(data, filepath):
    """Save GeoJSON file."""
    with open(filepath, 'w') as f:
        json.dump(data, f)
    print(f"Saved {len(data.get('features', []))} features to {filepath}")


def get_owner_key(properties):
    """
    Generate a unique key for grouping parcels by owner.
    Uses ownername + tax address (citystatez).
    """
    owner = (properties.get('ownername') or properties.get('OWNERNAME') or '').strip().upper()
    address = (properties.get('citystatez') or properties.get('CITYSTATEZ') or '').strip().upper()

    if not owner:
        return None

    return f"{owner}|{address}"


def find_adjacent_groups(geometries):
    """
    Given a list of geometries, find groups of adjacent (touching) geometries.
    Returns list of lists, where each inner list contains indices of adjacent geometries.
    """
    n = len(geometries)
    if n <= 1:
        return [[i] for i in range(n)]

    # Build adjacency
    adjacent = defaultdict(set)
    for i in range(n):
        for j in range(i + 1, n):
            try:
                # Check if geometries touch or intersect
                if geometries[i].touches(geometries[j]) or geometries[i].intersects(geometries[j]):
                    adjacent[i].add(j)
                    adjacent[j].add(i)
            except Exception:
                continue

    # Find connected components using BFS
    visited = set()
    groups = []

    for start in range(n):
        if start in visited:
            continue

        # BFS to find all connected parcels
        group = []
        queue = [start]

        while queue:
            node = queue.pop(0)
            if node in visited:
                continue
            visited.add(node)
            group.append(node)

            for neighbor in adjacent[node]:
                if neighbor not in visited:
                    queue.append(neighbor)

        groups.append(group)

    return groups


def merge_features(features):
    """
    Merge a list of features into a single feature.
    Combines geometries and aggregates numeric properties.
    """
    if len(features) == 1:
        return features[0]

    # Convert to Shapely geometries
    geometries = []
    for f in features:
        try:
            geom = shape(f['geometry'])
            if not geom.is_valid:
                geom = make_valid(geom)
            geometries.append(geom)
        except Exception as e:
            print(f"  Warning: Invalid geometry skipped: {e}")
            continue

    if not geometries:
        return features[0]

    # Merge geometries
    try:
        merged_geom = unary_union(geometries)
    except Exception as e:
        print(f"  Warning: Merge failed, using first geometry: {e}")
        merged_geom = geometries[0]

    # Aggregate properties
    base_props = dict(features[0]['properties'])

    # Sum numeric fields
    numeric_fields = ['gisacres', 'GISACRES', 'totalvalue', 'TOTALVALUE', 'landvalue', 'LANDVALUE', 'improvvalue', 'IMPROVVALUE']
    for field in numeric_fields:
        total = 0
        for f in features:
            val = f['properties'].get(field)
            if val is not None:
                try:
                    total += float(val)
                except (ValueError, TypeError):
                    pass
        if total > 0:
            base_props[field] = total

    # Add merge metadata
    base_props['_merged_count'] = len(features)
    base_props['_merged_parcels'] = [f['properties'].get('parcelid') or f['properties'].get('PARCELID') for f in features]

    return {
        'type': 'Feature',
        'geometry': mapping(merged_geom),
        'properties': base_props
    }


def merge_parcels(input_data):
    """
    Main function to merge adjacent parcels by owner.
    """
    features = input_data.get('features', [])
    print(f"Input: {len(features)} parcels")

    # Group by owner
    owner_groups = defaultdict(list)
    no_owner = []

    for f in features:
        key = get_owner_key(f.get('properties', {}))
        if key:
            owner_groups[key].append(f)
        else:
            no_owner.append(f)

    print(f"Found {len(owner_groups)} unique owners")
    print(f"Found {len(no_owner)} parcels without owner info")

    # Process each owner group
    merged_features = []
    merge_count = 0

    for owner_key, owner_features in owner_groups.items():
        if len(owner_features) == 1:
            # Single parcel, no merge needed
            merged_features.append(owner_features[0])
            continue

        # Convert to Shapely geometries
        geometries = []
        for f in owner_features:
            try:
                geom = shape(f['geometry'])
                if not geom.is_valid:
                    geom = make_valid(geom)
                geometries.append(geom)
            except Exception:
                geometries.append(None)

        # Find adjacent groups
        valid_indices = [i for i, g in enumerate(geometries) if g is not None]
        valid_geoms = [geometries[i] for i in valid_indices]

        if len(valid_geoms) <= 1:
            merged_features.extend(owner_features)
            continue

        adjacent_groups = find_adjacent_groups(valid_geoms)

        # Merge each adjacent group
        for group_indices in adjacent_groups:
            # Map back to original indices
            original_indices = [valid_indices[i] for i in group_indices]
            group_features = [owner_features[i] for i in original_indices]

            if len(group_features) > 1:
                merged = merge_features(group_features)
                merged_features.append(merged)
                merge_count += len(group_features) - 1
                owner_name = owner_key.split('|')[0][:30]
                print(f"  Merged {len(group_features)} parcels for: {owner_name}")
            else:
                merged_features.append(group_features[0])

    # Add parcels without owner
    merged_features.extend(no_owner)

    print(f"\nOutput: {len(merged_features)} parcels")
    print(f"Merged: {merge_count} parcels into existing ones")

    return {
        'type': 'FeatureCollection',
        'features': merged_features
    }


def main():
    parser = argparse.ArgumentParser(description='Merge adjacent parcels by owner')
    parser.add_argument('--input', '-i', required=True, help='Input GeoJSON file')
    parser.add_argument('--output', '-o', help='Output GeoJSON file (default: input_merged.geojson)')
    args = parser.parse_args()

    if not SHAPELY_AVAILABLE:
        print("ERROR: Shapely library required. Install with:")
        print("  pip install shapely")
        return 1

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"ERROR: Input file not found: {input_path}")
        return 1

    output_path = args.output or input_path.with_stem(input_path.stem + '_merged')

    print("=" * 50)
    print("  Parcel Merge: Adjacent Same-Owner Parcels")
    print("=" * 50)
    print(f"Input:  {input_path}")
    print(f"Output: {output_path}")
    print()

    # Load data
    data = load_geojson(input_path)

    # Merge parcels
    merged_data = merge_parcels(data)

    # Save result
    save_geojson(merged_data, output_path)

    print()
    print("=" * 50)
    print("  Complete!")
    print("=" * 50)

    return 0


if __name__ == '__main__':
    exit(main())
