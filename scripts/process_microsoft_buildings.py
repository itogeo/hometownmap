"""
Process Microsoft Building Footprints for Three Forks

Microsoft provides high-quality building footprints extracted from satellite imagery.
This script processes them for use in HometownMap.

Source: https://github.com/microsoft/USBuildingFootprints
"""

import geopandas as gpd
import logging
from pathlib import Path
import sys

# Add utils to path
sys.path.append(str(Path(__file__).parent))

from utils.geo_utils import (
    validate_geometries,
    simplify_geometries,
    clean_column_names,
    clip_to_boundary,
    add_area_length_fields,
    export_geojson,
    WGS84
)
from etl.extract import load_dataset, BASE_DATA_PATH

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def process_microsoft_buildings(
    input_path: str,
    city: str = "three-forks",
    county: str = "gallatin",
    output: bool = True
):
    """
    Process Microsoft Building Footprints for a city.

    Args:
        input_path: Path to Microsoft building footprints file (GeoJSON, Shapefile, or GeoParquet)
        city: City name to clip to
        county: County name
        output: Whether to save output

    Returns:
        Processed GeoDataFrame
    """
    logger.info(f"{'='*60}")
    logger.info("PROCESSING MICROSOFT BUILDING FOOTPRINTS")
    logger.info(f"{'='*60}")

    # Step 1: Load Microsoft building data
    logger.info(f"Loading building footprints from {input_path}")

    input_file = Path(input_path)
    if not input_file.exists():
        raise FileNotFoundError(f"Building footprints file not found: {input_path}")

    # Load based on file type
    if input_path.endswith('.geojson'):
        buildings_gdf = gpd.read_file(input_path)
    elif input_path.endswith('.shp'):
        buildings_gdf = gpd.read_file(input_path)
    elif input_path.endswith('.parquet') or input_path.endswith('.geoparquet'):
        buildings_gdf = gpd.read_parquet(input_path)
    else:
        raise ValueError(f"Unsupported file format: {input_path}")

    logger.info(f"Loaded {len(buildings_gdf)} building footprints")
    logger.info(f"CRS: {buildings_gdf.crs}")

    # Step 2: Load city boundary
    logger.info(f"Loading boundary for {city}")
    cities_gdf = load_dataset('cities', county)

    city_boundary = cities_gdf[
        cities_gdf['CITY'].str.lower() == city.lower().replace('-', ' ')
    ]

    if len(city_boundary) == 0:
        logger.error(f"City '{city}' not found")
        raise ValueError(f"City not found: {city}")

    logger.info(f"Found city boundary for {city}")

    # Step 3: Reproject to WGS84 if needed
    if buildings_gdf.crs != WGS84:
        logger.info(f"Reprojecting from {buildings_gdf.crs} to {WGS84}")
        buildings_gdf = buildings_gdf.to_crs(WGS84)

    if city_boundary.crs != WGS84:
        city_boundary = city_boundary.to_crs(WGS84)

    # Step 4: Clip to city boundary
    logger.info("Clipping buildings to city boundary...")
    buildings_clipped = clip_to_boundary(buildings_gdf, city_boundary)

    if len(buildings_clipped) == 0:
        logger.warning("No buildings found within city boundary!")
        return buildings_clipped

    logger.info(f"Retained {len(buildings_clipped)} buildings within {city}")

    # Step 5: Clean and validate
    buildings_clipped = clean_column_names(buildings_clipped)
    buildings_clipped = validate_geometries(buildings_clipped, fix=True)

    # Step 6: Add area fields
    buildings_clipped = add_area_length_fields(buildings_clipped)

    # Step 7: Simplify for web display
    logger.info("Simplifying building geometries...")
    buildings_clipped = simplify_geometries(
        buildings_clipped,
        tolerance=0.00001,  # Very small tolerance for buildings
        preserve_topology=True
    )

    # Step 8: Add metadata
    buildings_clipped['dataset'] = 'buildings'
    buildings_clipped['source'] = 'Microsoft Building Footprints'

    # Step 9: Calculate building statistics
    avg_area = buildings_clipped['area_sqm'].mean()
    total_area = buildings_clipped['area_sqm'].sum()

    logger.info(f"{'='*60}")
    logger.info(f"Building Statistics for {city.title()}")
    logger.info(f"{'='*60}")
    logger.info(f"Total buildings: {len(buildings_clipped):,}")
    logger.info(f"Average building size: {avg_area:.1f} sq m ({avg_area * 10.764:.1f} sq ft)")
    logger.info(f"Total built area: {total_area:,.0f} sq m ({total_area * 10.764:,.0f} sq ft)")
    logger.info(f"{'='*60}")

    # Step 10: Save output
    if output:
        output_dir = BASE_DATA_PATH / "cities" / city / "processed"
        output_dir.mkdir(exist_ok=True, parents=True)

        output_path = output_dir / "buildings.geojson"
        export_geojson(buildings_clipped, str(output_path))

        logger.info(f"✓ Buildings saved to: {output_path}")

    return buildings_clipped


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Process Microsoft Building Footprints for a city"
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Path to Microsoft building footprints file"
    )
    parser.add_argument(
        "--city",
        default="three-forks",
        help="City name (default: three-forks)"
    )
    parser.add_argument(
        "--county",
        default="gallatin",
        help="County name (default: gallatin)"
    )

    args = parser.parse_args()

    try:
        gdf = process_microsoft_buildings(
            input_path=args.input,
            city=args.city,
            county=args.county,
            output=True
        )

        logger.info("\n✅ Building footprints processed successfully!")
        logger.info(f"\nNext steps:")
        logger.info("1. Refresh the web map to see buildings")
        logger.info("2. Toggle 'Building Footprints' layer in the map interface")

    except Exception as e:
        logger.error(f"\n❌ Failed to process buildings: {e}")
        sys.exit(1)
