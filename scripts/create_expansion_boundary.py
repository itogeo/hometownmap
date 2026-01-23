"""
Create Expansion Boundary for Three Forks

Creates a buffered boundary around the city limits to show the expansion/planning area.
This is used for clipping datasets to show context beyond just the city limits.
"""

import geopandas as gpd
import logging
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).parent))

from utils.geo_utils import export_geojson, WGS84
from etl.extract import load_dataset, BASE_DATA_PATH

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_expansion_boundary(
    city: str = "three-forks",
    county: str = "gallatin",
    buffer_miles: float = 5.0,
    output: bool = True
):
    """
    Create an expansion boundary around a city.

    Args:
        city: City name
        county: County name
        buffer_miles: Buffer distance in miles (default: 5 miles)
        output: Whether to save output

    Returns:
        Buffered GeoDataFrame
    """
    logger.info(f"{'='*60}")
    logger.info(f"Creating expansion boundary for {city.title()}")
    logger.info(f"Buffer distance: {buffer_miles} miles")
    logger.info(f"{'='*60}")

    # Load city boundary
    logger.info("Loading city boundary...")
    cities_gdf = load_dataset('cities', county)

    city_boundary = cities_gdf[
        cities_gdf['CITY'].str.lower() == city.lower().replace('-', ' ')
    ]

    if len(city_boundary) == 0:
        raise ValueError(f"City not found: {city}")

    logger.info(f"Found city boundary for {city}")

    # Reproject to UTM for accurate buffering
    # UTM Zone 12N for Montana
    UTM_12N = "EPSG:32612"

    city_utm = city_boundary.to_crs(UTM_12N)

    # Convert miles to meters (1 mile = 1609.34 meters)
    buffer_meters = buffer_miles * 1609.34

    logger.info(f"Buffering by {buffer_meters:.0f} meters...")

    # Create buffer
    expansion_boundary = city_utm.copy()
    expansion_boundary['geometry'] = city_utm.buffer(buffer_meters)

    # Reproject back to WGS84
    expansion_boundary = expansion_boundary.to_crs(WGS84)

    # Calculate areas
    city_area = city_boundary.to_crs(UTM_12N).area.sum() / 4046.86  # to acres
    expansion_area = expansion_boundary.area.sum() / 4046.86

    logger.info(f"City boundary: {city_area:.1f} acres")
    logger.info(f"Expansion boundary: {expansion_area:.1f} acres")
    logger.info(f"Expansion ratio: {expansion_area / city_area:.1f}x city size")

    # Add metadata
    expansion_boundary['type'] = 'expansion_boundary'
    expansion_boundary['buffer_miles'] = buffer_miles
    expansion_boundary['city'] = city

    # Save output
    if output:
        output_dir = BASE_DATA_PATH / "cities" / city / "boundaries"
        output_dir.mkdir(exist_ok=True, parents=True)

        output_path = output_dir / f"expansion_{int(buffer_miles)}mi.geojson"
        export_geojson(expansion_boundary, str(output_path))

        logger.info(f"✓ Expansion boundary saved to: {output_path}")

    return expansion_boundary


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Create expansion boundary for a city"
    )
    parser.add_argument(
        "--city",
        default="three-forks",
        help="City name"
    )
    parser.add_argument(
        "--county",
        default="gallatin",
        help="County name"
    )
    parser.add_argument(
        "--buffer-miles",
        type=float,
        default=5.0,
        help="Buffer distance in miles (default: 5)"
    )

    args = parser.parse_args()

    try:
        gdf = create_expansion_boundary(
            city=args.city,
            county=args.county,
            buffer_miles=args.buffer_miles,
            output=True
        )

        logger.info(f"\n✅ Expansion boundary created successfully!")

    except Exception as e:
        logger.error(f"\n❌ Failed: {e}")
        sys.exit(1)
