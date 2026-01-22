"""
Extract Stage: Unzip and Load Raw Data

Extracts raw GIS data from various formats (ZIP, SHP, GeoJSON)
and loads into pandas/geopandas for processing.
"""

import os
import zipfile
import geopandas as gpd
import logging
from pathlib import Path
from typing import Optional, List
import click

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Base paths - relative to repo root
SCRIPT_DIR = Path(__file__).parent.parent.parent  # Go up to repo root
BASE_DATA_PATH = SCRIPT_DIR / "datasets"


def extract_zip(zip_path: Path, extract_to: Path) -> List[Path]:
    """
    Extract a ZIP file and return paths to extracted files.

    Args:
        zip_path: Path to ZIP file
        extract_to: Directory to extract to

    Returns:
        List of extracted file paths
    """
    logger.info(f"Extracting {zip_path.name}...")

    extracted_files = []

    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to)
        extracted_files = [extract_to / name for name in zip_ref.namelist()]

    logger.info(f"Extracted {len(extracted_files)} files")

    return extracted_files


def find_shapefile(directory: Path) -> Optional[Path]:
    """
    Find the .shp file in a directory (after unzipping).

    Args:
        directory: Directory to search

    Returns:
        Path to .shp file or None
    """
    shapefiles = list(directory.glob("*.shp"))

    if not shapefiles:
        logger.warning(f"No shapefile found in {directory}")
        return None

    if len(shapefiles) > 1:
        logger.warning(f"Multiple shapefiles found, using {shapefiles[0]}")

    return shapefiles[0]


def load_dataset(
    name: str,
    county: str = "gallatin",
    extract_dir: Optional[Path] = None
) -> gpd.GeoDataFrame:
    """
    Load a dataset by name from raw county data.

    Handles ZIP extraction and shapefile loading automatically.

    Args:
        name: Dataset name (e.g., 'parcels', 'roads')
        county: County name (default: 'gallatin')
        extract_dir: Optional directory for extraction (default: temp dir)

    Returns:
        GeoDataFrame with loaded data
    """
    # Find the raw data file
    raw_dir = BASE_DATA_PATH / county / "raw"

    # Look for various filename patterns
    possible_names = [
        f"{name}.zip",
        f"{name} (1).zip",
        f"{name} (2).zip",
        f"{name}.geojson",
        f"{name}.shp"
    ]

    data_file = None
    for possible in possible_names:
        candidate = raw_dir / possible
        if candidate.exists():
            data_file = candidate
            break

    if not data_file:
        raise FileNotFoundError(f"Could not find data file for '{name}' in {raw_dir}")

    logger.info(f"Loading {name} from {data_file.name}")

    # Handle different file types
    if data_file.suffix == '.zip':
        # Extract to temp directory
        if extract_dir is None:
            extract_dir = raw_dir / f".extracted_{name}"
            extract_dir.mkdir(exist_ok=True)

        extract_zip(data_file, extract_dir)

        # Find shapefile
        shp_file = find_shapefile(extract_dir)
        if not shp_file:
            raise FileNotFoundError(f"No shapefile found in {data_file}")

        gdf = gpd.read_file(shp_file)

    elif data_file.suffix in ['.geojson', '.json']:
        gdf = gpd.read_file(data_file)

    elif data_file.suffix == '.shp':
        gdf = gpd.read_file(data_file)

    else:
        raise ValueError(f"Unsupported file format: {data_file.suffix}")

    logger.info(f"Loaded {len(gdf)} features from {name}")
    logger.info(f"CRS: {gdf.crs}")
    logger.info(f"Columns: {', '.join(gdf.columns[:5])}{'...' if len(gdf.columns) > 5 else ''}")

    return gdf


def extract_all_county_datasets(county: str = "gallatin") -> dict:
    """
    Extract all datasets for a county.

    Args:
        county: County name

    Returns:
        Dictionary mapping dataset names to GeoDataFrames
    """
    raw_dir = BASE_DATA_PATH / county / "raw"

    # Find all ZIP files
    zip_files = list(raw_dir.glob("*.zip"))

    logger.info(f"Found {len(zip_files)} datasets in {county} county")

    datasets = {}

    for zip_file in zip_files:
        # Clean name
        name = zip_file.stem.lower().replace(' (1)', '').replace(' (2)', '')

        try:
            gdf = load_dataset(name, county)
            datasets[name] = gdf
            logger.info(f"✓ Loaded {name}: {len(gdf)} features")

        except Exception as e:
            logger.error(f"✗ Failed to load {name}: {e}")

    return datasets


@click.command()
@click.option('--county', default='gallatin', help='County name')
@click.option('--dataset', default=None, help='Specific dataset to extract (optional)')
@click.option('--list', 'list_datasets', is_flag=True, help='List available datasets')
def main(county: str, dataset: Optional[str], list_datasets: bool):
    """
    Extract raw GIS data from county sources.

    Examples:
        python extract.py --list
        python extract.py --county gallatin
        python extract.py --county gallatin --dataset parcels
    """
    if list_datasets:
        raw_dir = BASE_DATA_PATH / county / "raw"
        zip_files = list(raw_dir.glob("*.zip"))

        print(f"\n{'='*60}")
        print(f"Available datasets in {county.title()} County")
        print(f"{'='*60}")

        for i, zip_file in enumerate(zip_files, 1):
            name = zip_file.stem.replace(' (1)', '').replace(' (2)', '')
            size_mb = zip_file.stat().st_size / 1024 / 1024
            print(f"{i:2d}. {name:<30} ({size_mb:>6.2f} MB)")

        print(f"{'='*60}\n")

        return

    if dataset:
        # Extract single dataset
        try:
            gdf = load_dataset(dataset, county)
            print(f"\n✓ Successfully loaded {dataset}")
            print(f"  Features: {len(gdf):,}")
            print(f"  CRS: {gdf.crs}")
            print(f"  Bounds: {gdf.total_bounds}")

        except Exception as e:
            print(f"\n✗ Failed to load {dataset}: {e}")

    else:
        # Extract all datasets
        datasets = extract_all_county_datasets(county)

        print(f"\n{'='*60}")
        print(f"Extraction Summary")
        print(f"{'='*60}")
        print(f"County: {county.title()}")
        print(f"datasets loaded: {len(datasets)}")
        print(f"Total features: {sum(len(gdf) for gdf in datasets.values()):,}")
        print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
