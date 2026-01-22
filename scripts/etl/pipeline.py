"""
ETL Pipeline Orchestrator

Runs complete Extract → Transform → Load pipeline for cities.
"""

import logging
from pathlib import Path
import click
import sys
from datetime import datetime

sys.path.append(str(Path(__file__).parent.parent))

from etl.extract import extract_all_county_datasets, load_dataset
from etl.transform import transform_all_for_city

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def run_full_pipeline(city: str, county: str = "gallatin"):
    """
    Run complete ETL pipeline for a city.

    Args:
        city: City name (e.g., 'three-forks')
        county: County name (default: 'gallatin')
    """
    start_time = datetime.now()

    logger.info(f"""
    {'='*70}
    🚀 HOMETOWNMAP ETL PIPELINE
    {'='*70}
    City: {city.upper()}
    County: {county.upper()}
    Started: {start_time.strftime('%Y-%m-%d %H:%M:%S')}
    {'='*70}
    """)

    try:
        # STAGE 1: Extract
        logger.info("\n📦 STAGE 1: EXTRACT")
        logger.info("="*70)
        logger.info("Extracting raw county data...")

        # Just validate that data exists (actual extraction happens in transform)
        from etl.extract import BASE_DATA_PATH
        raw_dir = BASE_DATA_PATH / county / "raw"

        if not raw_dir.exists():
            raise FileNotFoundError(f"Raw data directory not found: {raw_dir}")

        zip_files = list(raw_dir.glob("*.zip"))
        logger.info(f"✓ Found {len(zip_files)} datasets in {county} county")

        # STAGE 2: Transform
        logger.info("\n🔄 STAGE 2: TRANSFORM")
        logger.info("="*70)
        logger.info(f"Processing and clipping data for {city}...")

        datasets = transform_all_for_city(city, county)

        logger.info(f"✓ Processed {len(datasets)} datasets")

        # STAGE 3: Load (Future - to PostGIS)
        logger.info("\n💾 STAGE 3: LOAD")
        logger.info("="*70)
        logger.info("Database loading coming soon...")
        logger.info("For now, data is saved as GeoJSON in processed/ directory")

        # Summary
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        logger.info(f"""
        {'='*70}
        ✅ PIPELINE COMPLETE
        {'='*70}
        City: {city.upper()}
        Datasets processed: {len(datasets)}
        Total features: {sum(len(gdf) for gdf in datasets.values()):,}
        Duration: {duration:.1f} seconds
        Output: /Datasets/hometownmap/cities/{city}/processed/
        {'='*70}
        """)

        return datasets

    except Exception as e:
        logger.error(f"\n❌ Pipeline failed: {e}")
        raise


@click.command()
@click.option('--city', required=True, help='City name (e.g., three-forks)')
@click.option('--county', default='gallatin', help='County name')
@click.option('--stage', type=click.Choice(['extract', 'transform', 'load', 'all']), default='all', help='Pipeline stage to run')
def main(city: str, county: str, stage: str):
    """
    Run ETL pipeline for a city.

    This orchestrates the full Extract → Transform → Load process:
    1. Extract: Load raw county GIS data
    2. Transform: Clean, validate, clip to city boundary
    3. Load: Save as GeoJSON (PostGIS coming soon)

    Examples:
        # Run full pipeline for Three Forks
        python pipeline.py --city three-forks

        # Run only transform stage
        python pipeline.py --city three-forks --stage transform
    """
    if stage == 'all':
        run_full_pipeline(city, county)
    else:
        logger.info(f"Running {stage} stage only...")
        # Individual stages to be implemented as needed
        if stage == 'transform':
            transform_all_for_city(city, county)
        else:
            logger.warning(f"Stage '{stage}' not implemented yet")


if __name__ == "__main__":
    main()
