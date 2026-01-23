"""
Extract Gallatin County Parcels from Montana Cadastral

This is Step 1 of the data pipeline - extracts parcels with full ownership data.
"""

import geopandas as gpd
import logging
from pathlib import Path
import sys
import zipfile
import tempfile
import shutil

sys.path.append(str(Path(__file__).parent))

from utils.geo_utils import (
    validate_geometries,
    clean_column_names,
    export_geojson,
    WGS84
)
from etl.extract import BASE_DATA_PATH

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def extract_gallatin_parcels(
    cadastral_zip_path: str,
    output: bool = True
):
    """
    Extract Gallatin County parcels from Montana Cadastral dataset.

    Args:
        cadastral_zip_path: Path to MontanaCadastral_SHP.zip
        output: Whether to save output

    Returns:
        GeoDataFrame of Gallatin County parcels
    """
    logger.info(f"{'='*70}")
    logger.info("EXTRACTING GALLATIN COUNTY PARCELS FROM MONTANA CADASTRAL")
    logger.info(f"{'='*70}")

    cadastral_zip = Path(cadastral_zip_path)
    if not cadastral_zip.exists():
        raise FileNotFoundError(f"Cadastral ZIP not found: {cadastral_zip_path}")

    # Step 1: Extract OWNERPARCEL shapefile
    logger.info("Step 1: Extracting OWNERPARCEL shapefile...")
    temp_dir = Path(tempfile.mkdtemp())
    logger.info(f"Temp directory: {temp_dir}")

    try:
        with zipfile.ZipFile(cadastral_zip, 'r') as zip_ref:
            # Extract only OWNERPARCEL files
            for file in zip_ref.namelist():
                if 'OWNERPARCEL' in file:
                    zip_ref.extract(file, temp_dir)

        shp_path = temp_dir / 'Montana_Cadastral' / 'OWNERPARCEL.shp'
        logger.info(f"✓ Extracted to: {shp_path}")

        # Step 2: Load Montana parcels
        logger.info("Step 2: Loading Montana parcels (this may take 1-2 minutes)...")
        montana_parcels = gpd.read_file(shp_path)
        logger.info(f"✓ Loaded {len(montana_parcels):,} parcels from Montana")
        logger.info(f"CRS: {montana_parcels.crs}")

        # Step 3: Filter to Gallatin County
        logger.info("Step 3: Filtering to Gallatin County...")

        # Check county field
        if 'CountyName' not in montana_parcels.columns:
            logger.error("CountyName field not found!")
            logger.info(f"Available columns: {', '.join(montana_parcels.columns)}")
            raise ValueError("Cannot find CountyName field")

        gallatin = montana_parcels[
            montana_parcels['CountyName'].str.lower() == 'gallatin'
        ].copy()

        logger.info(f"✓ Filtered to {len(gallatin):,} Gallatin County parcels")

        if len(gallatin) == 0:
            raise ValueError("No Gallatin County parcels found!")

        # Step 4: Clean and standardize
        logger.info("Step 4: Cleaning column names...")
        gallatin = clean_column_names(gallatin)
        logger.info(f"✓ Columns: {', '.join(gallatin.columns[:10])}...")

        # Step 5: Reproject to WGS84
        if gallatin.crs != WGS84:
            logger.info(f"Step 5: Reprojecting from {gallatin.crs} to {WGS84}...")
            gallatin = gallatin.to_crs(WGS84)
            logger.info("✓ Reprojected to WGS84")
        else:
            logger.info("Step 5: Already in WGS84")

        # Step 6: Validate geometries
        logger.info("Step 6: Validating geometries...")
        gallatin = validate_geometries(gallatin, fix=True)

        # Step 7: Check data quality
        logger.info("Step 7: Data quality check...")
        owner_filled = gallatin['ownername'].notna().sum()
        address_filled = gallatin['addresslin'].notna().sum()
        acres_filled = gallatin['gisacres'].notna().sum()

        logger.info(f"  Owner names: {owner_filled:,}/{len(gallatin):,} ({owner_filled/len(gallatin)*100:.1f}%)")
        logger.info(f"  Addresses: {address_filled:,}/{len(gallatin):,} ({address_filled/len(gallatin)*100:.1f}%)")
        logger.info(f"  Acreage: {acres_filled:,}/{len(gallatin):,} ({acres_filled/len(gallatin)*100:.1f}%)")

        # Show sample data
        logger.info("\nSample parcels:")
        for idx, row in gallatin.head(3).iterrows():
            logger.info(f"  • {row['ownername'] if row['ownername'] else 'Unknown'} - {row['gisacres']:.2f} acres")

        # Step 8: Save output
        if output:
            output_dir = BASE_DATA_PATH / "gallatin" / "processed"
            output_dir.mkdir(exist_ok=True, parents=True)

            output_path = output_dir / "parcels_cadastral.geojson"

            logger.info(f"Step 8: Saving to {output_path}...")
            export_geojson(gallatin, str(output_path))
            logger.info(f"✓ Saved {len(gallatin):,} parcels")

        # Clean up
        logger.info("Cleaning up temporary files...")
        shutil.rmtree(temp_dir)

        logger.info(f"\n{'='*70}")
        logger.info("✅ GALLATIN COUNTY PARCELS EXTRACTED SUCCESSFULLY")
        logger.info(f"{'='*70}")
        logger.info(f"Parcels: {len(gallatin):,}")
        logger.info(f"Output: {output_path if output else 'Not saved'}")
        logger.info(f"Next: Run clip_parcels_to_city.py --city three-forks")
        logger.info(f"{'='*70}")

        return gallatin

    except Exception as e:
        logger.error(f"Failed: {e}")
        # Clean up on error
        if temp_dir.exists():
            shutil.rmtree(temp_dir)
        raise


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Extract Gallatin County parcels from Montana Cadastral"
    )
    parser.add_argument(
        "--cadastral-zip",
        default="../datasets/statewide/raw/MontanaCadastral_SHP.zip",
        help="Path to MontanaCadastral_SHP.zip"
    )

    args = parser.parse_args()

    try:
        gdf = extract_gallatin_parcels(
            cadastral_zip_path=args.cadastral_zip,
            output=True
        )

    except Exception as e:
        logger.error(f"\n❌ Extraction failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
