#!/usr/bin/env python3
"""
Separate Public vs Private Parcels

Splits parcel data into two layers:
- public_lands.geojson - Federal, State, County, Municipal owned
- parcels.geojson - Private ownership

Usage:
    python separate_public_private.py --input parcels.geojson

Output:
    parcels_private.geojson - Private parcels
    parcels_public.geojson - Public/government parcels
"""

import json
import argparse
import re
from pathlib import Path


# Patterns to identify public ownership
PUBLIC_PATTERNS = {
    'federal': [
        r'\bUNITED STATES\b',
        r'\bUSA\b',
        r'\bU\.?S\.?A\.?\b',
        r'\bUSFS\b',
        r'\bUSDA\b',
        r'\bBLM\b',
        r'\bBUREAU OF LAND\b',
        r'\bFOREST SERVICE\b',
        r'\bNATIONAL PARK\b',
        r'\bFISH AND WILDLIFE\b',
        r'\bARMY CORPS\b',
        r'\bFEDERAL\b',
    ],
    'state': [
        r'\bSTATE OF MONTANA\b',
        r'\bSTATE OF MONT\b',
        r'\bMONTANA DEPT\b',
        r'\bMONTANA STATE\b',
        r'\bMT DEPT\b',
        r'\bMONTANA FISH\b',
        r'\bMONTANA WILDLIFE\b',
        r'\bDNRC\b',
        r'\bSTATE LAND\b',
        r'\bSTATE SCHOOL\b',
    ],
    'county': [
        r'\bGALLATIN COUNTY\b',
        r'\bCOUNTY OF GALLATIN\b',
        r'\bBROADWATER COUNTY\b',
        r'\bCOUNTY OF\b',
    ],
    'municipal': [
        r'\bTOWN OF THREE FORKS\b',
        r'\bCITY OF\b',
        r'\bTHREE FORKS\b.*\bTOWN\b',
        r'\bMUNICIPAL\b',
    ],
    'railroad': [
        r'\bBNSF\b',
        r'\bRAILWAY\b',
        r'\bRAILROAD\b',
        r'\bMONTANA RAIL\b',
    ],
}


def load_geojson(filepath):
    """Load GeoJSON file."""
    with open(filepath, 'r') as f:
        return json.load(f)


def save_geojson(data, filepath):
    """Save GeoJSON file."""
    with open(filepath, 'w') as f:
        json.dump(data, f)
    count = len(data.get('features', []))
    print(f"  Saved {count} features to {filepath}")


def classify_ownership(owner_name):
    """
    Classify ownership type based on owner name.
    Returns: 'federal', 'state', 'county', 'municipal', 'railroad', or 'private'
    """
    if not owner_name:
        return 'private'

    owner_upper = owner_name.upper().strip()

    for category, patterns in PUBLIC_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, owner_upper):
                return category

    return 'private'


def separate_parcels(input_data):
    """
    Separate parcels into public and private.
    """
    features = input_data.get('features', [])
    print(f"Input: {len(features)} parcels")

    public_features = []
    private_features = []

    # Track counts by category
    counts = {
        'federal': 0,
        'state': 0,
        'county': 0,
        'municipal': 0,
        'railroad': 0,
        'private': 0,
    }

    for f in features:
        props = f.get('properties', {})
        owner = props.get('ownername') or props.get('OWNERNAME') or ''

        ownership_type = classify_ownership(owner)
        counts[ownership_type] += 1

        # Add ownership type to properties
        f['properties']['_ownership_type'] = ownership_type

        if ownership_type == 'private':
            private_features.append(f)
        else:
            # Add to public layer
            f['properties']['_public_category'] = ownership_type
            public_features.append(f)

    print("\nOwnership breakdown:")
    for cat, count in counts.items():
        if count > 0:
            print(f"  {cat}: {count}")

    return (
        {'type': 'FeatureCollection', 'features': private_features},
        {'type': 'FeatureCollection', 'features': public_features}
    )


def main():
    parser = argparse.ArgumentParser(description='Separate public vs private parcels')
    parser.add_argument('--input', '-i', required=True, help='Input GeoJSON file')
    parser.add_argument('--output-dir', '-o', help='Output directory (default: same as input)')
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"ERROR: Input file not found: {input_path}")
        return 1

    output_dir = Path(args.output_dir) if args.output_dir else input_path.parent

    print("=" * 50)
    print("  Separate Public vs Private Parcels")
    print("=" * 50)
    print(f"Input: {input_path}")
    print()

    # Load data
    data = load_geojson(input_path)

    # Separate parcels
    private_data, public_data = separate_parcels(data)

    # Save results
    print("\nSaving files:")
    save_geojson(private_data, output_dir / 'parcels_private.geojson')
    save_geojson(public_data, output_dir / 'parcels_public.geojson')

    print()
    print("=" * 50)
    print("  Complete!")
    print("=" * 50)

    return 0


if __name__ == '__main__':
    exit(main())
