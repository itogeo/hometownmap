"""
Clip Parcels to City Boundary

This is Step 2 of the data pipeline - clips Gallatin parcels to Three Forks.
"""

import geopandas as gpd
import logging
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).parent))

from utils.geo_utils import (
    validate_geometries,
    simplify_geometries,
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


def clip_parcels_to_city(
    city: str = "three-forks",
    county: str = "gallatin",
    use_expansion: bool = True,
    output: bool = True
):
    """
    Clip Gallatin County parcels to a city boundary (or expansion area).

    Args:
        city: City name
        county: County name
        use_expansion: If True, use 5-mile expansion buffer instead of city limits
        output: Whether to save output

    Returns:
        Clipped parcels GeoDataFrame
    """
    boundary_type = "EXPANSION AREA" if use_expansion else "CITY LIMITS"
    logger.info(f"{'='*70}")
    logger.info(f"CLIPPING PARCELS TO {city.upper()} {boundary_type}")
    logger.info(f"{'='*70}")

    # Step 1: Load Gallatin County parcels
    logger.info("Step 1: Loading Gallatin County parcels...")
    parcels_path = BASE_DATA_PATH / county / "processed" / "parcels_cadastral.geojson"

    if not parcels_path.exists():
        logger.error(f"Parcels not found: {parcels_path}")
        logger.info("Did you run extract_gallatin_parcels.py first?")
        raise FileNotFoundError("Run extract_gallatin_parcels.py first")

    parcels_gdf = gpd.read_file(parcels_path)
    logger.info(f"✓ Loaded {len(parcels_gdf):,} parcels from Gallatin County")

    # Step 2: Load boundary (expansion or city)
    if use_expansion:
        logger.info(f"Step 2: Loading {city} expansion boundary (5-mile buffer)...")
        expansion_path = BASE_DATA_PATH / "cities" / city / "boundaries" / "expansion_5mi.geojson"

        if not expansion_path.exists():
            logger.error(f"Expansion boundary not found: {expansion_path}")
            logger.info("Creating expansion boundary now...")
            from create_expansion_boundary import create_expansion_boundary
            create_expansion_boundary(city, county, buffer_miles=5.0, output=True)

        boundary = gpd.read_file(expansion_path)
        logger.info(f"✓ Loaded expansion boundary (5 miles around city)")
    else:
        logger.info(f"Step 2: Loading {city} city boundary...")
        cities_gdf = load_dataset('cities', county)

        boundary = cities_gdf[
            cities_gdf['CITY'].str.lower() == city.lower().replace('-', ' ')
        ]

        if len(boundary) == 0:
            logger.error(f"City '{city}' not found")
            logger.info(f"Available cities: {', '.join(cities_gdf['CITY'].tolist())}")
            raise ValueError(f"City not found: {city}")

        logger.info(f"✓ Found {city} boundary")

    # Ensure same CRS
    if boundary.crs != WGS84:
        boundary = boundary.to_crs(WGS84)

    # Step 3: Clip parcels to boundary
    logger.info(f"Step 3: Clipping parcels to {boundary_type.lower()}...")
    logger.info(f"  Before clipping: {len(parcels_gdf):,} parcels")

    clipped = clip_to_boundary(parcels_gdf, boundary)

    logger.info(f"  After clipping: {len(clipped):,} parcels")

    if len(clipped) == 0:
        logger.error("No parcels found within city boundary!")
        raise ValueError("Clipping resulted in 0 parcels")

    # Step 4: Validate geometries
    logger.info("Step 4: Validating geometries...")
    clipped = validate_geometries(clipped, fix=True)

    # Step 5: Add area fields
    logger.info("Step 5: Calculating parcel areas...")
    clipped = add_area_length_fields(clipped)

    # Step 6: Simplify for web
    logger.info("Step 6: Simplifying geometries for web display...")
    clipped = simplify_geometries(clipped, tolerance=0.0001)

    # Step 7: Add metadata
    clipped['dataset'] = 'parcels'
    clipped['source'] = 'Montana Cadastral'
    clipped['city'] = city

    # Step 8: Quality check
    logger.info("Step 7: Data quality check...")
    owner_filled = clipped['ownername'].notna().sum()
    address_filled = clipped['addresslin'].notna().sum()

    logger.info(f"  ✓ {len(clipped):,} parcels in {city}")
    logger.info(f"  ✓ {owner_filled:,} with owner names ({owner_filled/len(clipped)*100:.1f}%)")
    logger.info(f"  ✓ {address_filled:,} with addresses ({address_filled/len(clipped)*100:.1f}%)")

    # Show sample
    logger.info("\nSample parcels:")
    for idx, row in clipped.head(3).iterrows():
        logger.info(f"  • {row['ownername'] if row['ownername'] else 'Unknown'}")
        logger.info(f"    {row['addresslin'] if row['addresslin'] else 'No address'}")
        logger.info(f"    {row['gisacres']:.2f} acres")

    # Step 9: Save output
    if output:
        output_dir = BASE_DATA_PATH / "cities" / city / "processed"
        output_dir.mkdir(exist_ok=True, parents=True)

        # Backup existing parcels.geojson if it exists
        output_path = output_dir / "parcels.geojson"
        if output_path.exists():
            backup_path = output_dir / "parcels_old.geojson"
            import shutil
            shutil.copy(output_path, backup_path)
            logger.info(f"  Backed up old parcels to: {backup_path.name}")

        logger.info(f"Step 8: Saving to {output_path}...")
        export_geojson(clipped, str(output_path))

        logger.info(f"\n{'='*70}")
        logger.info("✅ PARCELS CLIPPED TO CITY SUCCESSFULLY")
        logger.info(f"{'='*70}")
        logger.info(f"City: {city.title()}")
        logger.info(f"Parcels: {len(clipped):,}")
        logger.info(f"Owner data: {owner_filled/len(clipped)*100:.1f}% complete")
        logger.info(f"Output: {output_path}")
        logger.info(f"\nNext: Refresh the map at http://localhost:3001")
        logger.info(f"{'='*70}")

    return clipped


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Clip parcels to city boundary or expansion area"
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
        "--use-expansion",
        action="store_true",
        default=True,
        help="Use 5-mile expansion buffer (default: True)"
    )
    parser.add_argument(
        "--city-limits-only",
        action="store_true",
        help="Use city limits only (no buffer)"
    )

    args = parser.parse_args()

    # If city-limits-only flag is set, don't use expansion
    use_expansion = not args.city_limits_only

    try:
        gdf = clip_parcels_to_city(
            city=args.city,
            county=args.county,
            use_expansion=use_expansion,
            output=True
        )

    except Exception as e:
        logger.error(f"\n❌ Clipping failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
