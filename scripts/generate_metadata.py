"""
Generate Readable Metadata for All Datasets

Creates CSV and JSON metadata files that show dataset structure, samples, and statistics
in plain language - no QGIS needed!
"""

import geopandas as gpd
import pandas as pd
import json
import logging
from pathlib import Path
import sys
from datetime import datetime

sys.path.append(str(Path(__file__).parent))

from etl.extract import BASE_DATA_PATH

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def export_attributes_to_csv(geojson_path: Path, output_dir: Path):
    """
    Export all attribute columns (excluding geometry) to CSV.

    Args:
        geojson_path: Path to GeoJSON file
        output_dir: Directory to save CSV file
    """
    # Load dataset
    gdf = gpd.read_file(geojson_path)

    # Drop geometry column
    df = pd.DataFrame(gdf.drop(columns=['geometry']))

    # Export to CSV
    csv_path = output_dir / f"{geojson_path.stem}_attributes.csv"
    df.to_csv(csv_path, index=False)

    logger.info(f"  ✓ CSV export: {csv_path.name} ({len(df)} rows, {len(df.columns)} columns)")

    return csv_path


def generate_dataset_metadata(geojson_path: Path):
    """
    Generate metadata for a single dataset.

    Args:
        geojson_path: Path to GeoJSON file

    Returns:
        Dictionary of metadata
    """
    logger.info(f"Processing {geojson_path.name}...")

    # Load dataset
    gdf = gpd.read_file(geojson_path)

    # Get geometry types
    geom_types = gdf.geometry.geom_type.value_counts().to_dict()

    # Calculate bounds
    bounds = gdf.total_bounds.tolist()

    # Get column info
    columns_info = {}
    for col in gdf.columns:
        if col == 'geometry':
            continue

        # Get data type
        dtype = str(gdf[col].dtype)

        # Count filled values
        filled = gdf[col].notna().sum()
        total = len(gdf)
        fill_rate = (filled / total * 100) if total > 0 else 0

        # Get sample values (up to 5 unique)
        samples = []
        if filled > 0:
            unique_samples = gdf[col].dropna().drop_duplicates().head(5).tolist()
            samples = [str(v)[:50] for v in unique_samples]  # Limit length

        columns_info[col] = {
            "data_type": dtype,
            "filled": filled,
            "total": total,
            "fill_rate": round(fill_rate, 1),
            "samples": samples
        }

    # Build metadata
    metadata = {
        "dataset_name": geojson_path.stem,
        "file_path": str(geojson_path.relative_to(BASE_DATA_PATH.parent.parent)),
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "total_features": len(gdf),
            "geometry_types": geom_types,
            "coordinate_system": str(gdf.crs),
            "bounds": {
                "min_lon": round(bounds[0], 6),
                "min_lat": round(bounds[1], 6),
                "max_lon": round(bounds[2], 6),
                "max_lat": round(bounds[3], 6)
            }
        },
        "columns": columns_info,
        "sample_features": []
    }

    # Add sample features (first 3)
    for idx, row in gdf.head(3).iterrows():
        feature_sample = {}
        for col in gdf.columns:
            if col == 'geometry':
                feature_sample[col] = f"{row[col].geom_type} ({len(row[col].coords) if hasattr(row[col], 'coords') else 'N/A'} points)"
            else:
                val = row[col]
                if val is not None and val == val:  # Check for non-null and non-NaN
                    feature_sample[col] = str(val)[:100]  # Limit length
                else:
                    feature_sample[col] = None
        metadata["sample_features"].append(feature_sample)

    return metadata


def generate_all_metadata(city: str = "three-forks"):
    """
    Generate metadata for all processed datasets in a city.

    Args:
        city: City name
    """
    logger.info(f"{'='*70}")
    logger.info(f"GENERATING METADATA FOR {city.upper()}")
    logger.info(f"{'='*70}")

    processed_dir = BASE_DATA_PATH / "cities" / city / "processed"

    if not processed_dir.exists():
        logger.error(f"Processed directory not found: {processed_dir}")
        return

    # Find all GeoJSON files
    geojson_files = list(processed_dir.glob("*.geojson"))

    if not geojson_files:
        logger.error("No GeoJSON files found!")
        return

    logger.info(f"Found {len(geojson_files)} datasets")

    # Create metadata directory
    metadata_dir = processed_dir / "metadata"
    metadata_dir.mkdir(exist_ok=True)

    all_metadata = {}
    all_columns_info = []

    for geojson_path in sorted(geojson_files):
        try:
            # Export attributes to CSV (no geometry)
            csv_path = export_attributes_to_csv(geojson_path, metadata_dir)

            # Generate metadata
            metadata = generate_dataset_metadata(geojson_path)

            # Save individual metadata file (JSON)
            metadata_path = metadata_dir / f"{geojson_path.stem}_metadata.json"
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)

            logger.info(f"  ✓ Metadata: {metadata_path.name}")

            all_metadata[geojson_path.stem] = metadata

            # Collect column info for summary CSV
            for col_name, col_info in metadata['columns'].items():
                all_columns_info.append({
                    'dataset': geojson_path.stem,
                    'column': col_name,
                    'data_type': col_info['data_type'],
                    'fill_rate': col_info['fill_rate'],
                    'filled': col_info['filled'],
                    'total': col_info['total'],
                    'sample_values': '; '.join(str(s) for s in col_info['samples'][:3])
                })

        except Exception as e:
            logger.error(f"✗ {geojson_path.name}: {e}")

    # Create combined metadata file (JSON)
    combined_path = metadata_dir / "all_datasets.json"
    combined = {
        "city": city,
        "generated_at": datetime.now().isoformat(),
        "total_datasets": len(all_metadata),
        "datasets": all_metadata
    }

    with open(combined_path, 'w') as f:
        json.dump(combined, f, indent=2)

    logger.info(f"\n✓ Combined metadata (JSON): {combined_path}")

    # Create columns summary CSV
    if all_columns_info:
        columns_csv_path = metadata_dir / "all_columns.csv"
        columns_df = pd.DataFrame(all_columns_info)
        columns_df.to_csv(columns_csv_path, index=False)
        logger.info(f"✓ Columns summary (CSV): {columns_csv_path}")

    # Create a pretty summary
    summary_path = metadata_dir / "SUMMARY.txt"
    with open(summary_path, 'w') as f:
        f.write(f"{'='*70}\n")
        f.write(f"THREE FORKS DATA SUMMARY\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"{'='*70}\n\n")

        for dataset_name, metadata in sorted(all_metadata.items()):
            f.write(f"{dataset_name.upper()}\n")
            f.write(f"{'-'*70}\n")
            f.write(f"Features: {metadata['summary']['total_features']:,}\n")
            f.write(f"Geometry: {', '.join(f'{k}={v}' for k, v in metadata['summary']['geometry_types'].items())}\n")
            f.write(f"File: {metadata['file_path']}\n")

            # Show key columns
            f.write(f"\nKey Fields:\n")
            for col, info in list(metadata['columns'].items())[:10]:
                f.write(f"  • {col:20s} {info['fill_rate']:>5.1f}% filled  ({info['data_type']})\n")

            f.write(f"\n")

    logger.info(f"✓ Summary: {summary_path}")

    logger.info(f"\n{'='*70}")
    logger.info(f"✅ METADATA GENERATION COMPLETE")
    logger.info(f"{'='*70}")
    logger.info(f"Datasets: {len(all_metadata)}")
    logger.info(f"Location: {metadata_dir}")
    logger.info(f"\nView files:")
    logger.info(f"  • all_columns.csv - All columns from all datasets (CSV)")
    logger.info(f"  • *_attributes.csv - Attribute data for each dataset (no geometry)")
    logger.info(f"  • all_datasets.json - Complete metadata for all datasets (JSON)")
    logger.info(f"  • SUMMARY.txt - Quick overview in plain text")
    logger.info(f"  • *_metadata.json - Individual dataset metadata (JSON)")
    logger.info(f"{'='*70}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Generate metadata for processed datasets"
    )
    parser.add_argument(
        "--city",
        default="three-forks",
        help="City name"
    )

    args = parser.parse_args()

    try:
        generate_all_metadata(city=args.city)

    except Exception as e:
        logger.error(f"\n❌ Metadata generation failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
