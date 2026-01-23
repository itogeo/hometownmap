"""
Join Montana Cadastral Data with Parcels

Enriches parcel data with owner names, addresses, and property details
from the Montana Cadastral database.
"""

import geopandas as gpd
import logging
from pathlib import Path
import sys
import zipfile

sys.path.append(str(Path(__file__).parent))

from utils.geo_utils import export_geojson
from etl.extract import BASE_DATA_PATH

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def join_cadastral_data(
    parcels_path: str,
    cadastral_zip: str,
    city: str = "three-forks",
    output: bool = True
):
    """
    Join Montana Cadastral data with city parcels.

    Args:
        parcels_path: Path to processed parcels GeoJSON
        cadastral_zip: Path to MontanaCadastral_SHP.zip
        city: City name
        output: Whether to save output

    Returns:
        Enriched parcels GeoDataFrame
    """
    logger.info(f"{'='*60}")
    logger.info("JOINING MONTANA CADASTRAL DATA WITH PARCELS")
    logger.info(f"{'='*60}")

    # Load existing parcels
    logger.info(f"Loading parcels from {parcels_path}")
    parcels_gdf = gpd.read_file(parcels_path)
    logger.info(f"Loaded {len(parcels_gdf)} parcels")
    logger.info(f"Parcel columns: {', '.join(parcels_gdf.columns[:10])}...")

    # Extract and load cadastral data
    logger.info(f"Extracting cadastral data from {cadastral_zip}")
    cadastral_zip_path = Path(cadastral_zip)

    if not cadastral_zip_path.exists():
        raise FileNotFoundError(f"Cadastral ZIP not found: {cadastral_zip}")

    # Extract to temp directory
    temp_dir = cadastral_zip_path.parent / ".cadastral_temp"
    temp_dir.mkdir(exist_ok=True)

    with zipfile.ZipFile(cadastral_zip_path, 'r') as zip_ref:
        logger.info("Extracting ZIP (this may take a moment)...")
        zip_ref.extractall(temp_dir)

    # Find the shapefile
    shapefiles = list(temp_dir.glob("**/*.shp"))
    if not shapefiles:
        raise FileNotFoundError("No shapefile found in cadastral ZIP")

    cadastral_shp = shapefiles[0]
    logger.info(f"Found shapefile: {cadastral_shp.name}")

    # Load cadastral data
    logger.info("Loading cadastral data (large file, may take time)...")
    cadastral_gdf = gpd.read_file(cadastral_shp)
    logger.info(f"Loaded {len(cadastral_gdf)} cadastral records")
    logger.info(f"Cadastral columns: {', '.join(cadastral_gdf.columns[:10])}...")

    # Filter to Gallatin County if possible
    if 'COUNTY' in cadastral_gdf.columns:
        cadastral_gdf = cadastral_gdf[
            cadastral_gdf['COUNTY'].str.lower().str.contains('gallatin', na=False)
        ]
        logger.info(f"Filtered to {len(cadastral_gdf)} Gallatin County records")

    # Check for geocode/GEOCODE field
    geocode_field = None
    for col in cadastral_gdf.columns:
        if col.lower() == 'geocode':
            geocode_field = col
            break

    if not geocode_field:
        logger.error("GEOCODE field not found in cadastral data!")
        logger.info(f"Available fields: {', '.join(cadastral_gdf.columns)}")
        raise ValueError("Cannot find GEOCODE field for joining")

    logger.info(f"Using '{geocode_field}' field for joining")

    # Perform the join
    logger.info("Joining parcels with cadastral data...")

    # Keep only relevant cadastral fields (to avoid huge file)
    cadastral_fields_to_keep = [
        geocode_field,
        'OWNER_NAME', 'OWNER1', 'OWNER2',  # Owner names
        'SITUS_ADDR', 'SITUS_CITY', 'SITUS_ZIP',  # Property address
        'YEAR_BUILT',  # Year built
        'SALE_PRICE', 'SALE_DATE',  # Sale info
        'USE_CODE', 'LAND_USE',  # Property use
        'LEGAL_DESC',  # Legal description
        'TOTAL_VALUE', 'LAND_VALUE', 'BLDG_VALUE',  # Assessed values
    ]

    # Filter to only columns that exist
    available_fields = [f for f in cadastral_fields_to_keep if f in cadastral_gdf.columns]
    logger.info(f"Keeping {len(available_fields)} cadastral fields")

    cadastral_subset = cadastral_gdf[available_fields].copy()

    # Clean up field names for joining
    # Standardize the geocode field name
    cadastral_subset = cadastral_subset.rename(columns={geocode_field: 'GEOCODE'})
    parcels_gdf['geocode_upper'] = parcels_gdf['geocode'].str.upper()

    # Perform left join (keep all parcels)
    enriched_parcels = parcels_gdf.merge(
        cadastral_subset,
        left_on='geocode_upper',
        right_on='GEOCODE',
        how='left'
    )

    # Count matches
    matched = enriched_parcels['GEOCODE'].notna().sum()
    match_rate = (matched / len(enriched_parcels)) * 100

    logger.info(f"✓ Join complete!")
    logger.info(f"Matched parcels: {matched}/{len(enriched_parcels)} ({match_rate:.1f}%)")

    # Clean up temporary column
    enriched_parcels = enriched_parcels.drop(columns=['geocode_upper', 'GEOCODE'])

    # Show sample of enriched data
    if 'OWNER_NAME' in enriched_parcels.columns:
        sample_owners = enriched_parcels['OWNER_NAME'].dropna().head(3).tolist()
        logger.info(f"Sample owners: {', '.join(sample_owners)}")

    # Save output
    if output:
        output_dir = BASE_DATA_PATH / "cities" / city / "processed"
        output_path = output_dir / "parcels_enriched.geojson"

        export_geojson(enriched_parcels, str(output_path))
        logger.info(f"✓ Enriched parcels saved to: {output_path}")

        # Also save as regular parcels.geojson to replace the old one
        backup_path = output_dir / "parcels_original.geojson"
        original_path = output_dir / "parcels.geojson"

        if original_path.exists():
            import shutil
            shutil.copy(original_path, backup_path)
            logger.info(f"Backed up original parcels to: {backup_path}")

        export_geojson(enriched_parcels, str(original_path))
        logger.info(f"✓ Updated parcels.geojson with enriched data")

    # Clean up temp directory
    import shutil
    shutil.rmtree(temp_dir)
    logger.info("Cleaned up temporary files")

    return enriched_parcels


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Join Montana Cadastral data with parcels"
    )
    parser.add_argument(
        "--parcels",
        default="../datasets/cities/three-forks/processed/parcels.geojson",
        help="Path to parcels GeoJSON"
    )
    parser.add_argument(
        "--cadastral",
        default="../datasets/statewide/raw/MontanaCadastral_SHP.zip",
        help="Path to Montana Cadastral ZIP"
    )
    parser.add_argument(
        "--city",
        default="three-forks",
        help="City name"
    )

    args = parser.parse_args()

    try:
        gdf = join_cadastral_data(
            parcels_path=args.parcels,
            cadastral_zip=args.cadastral,
            city=args.city,
            output=True
        )

        logger.info(f"\n✅ Cadastral data joined successfully!")
        logger.info(f"\nRefresh the map to see owner names and property details!")

    except Exception as e:
        logger.error(f"\n❌ Failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
