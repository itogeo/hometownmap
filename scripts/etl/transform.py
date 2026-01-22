"""
Transform Stage: Clean, Validate, and Standardize GIS Data

Transforms raw GIS data through:
- Coordinate system reprojection (→ WGS84)
- Geometry validation and repair
- Attribute standardization
- Simplification for web display
- Clipping to city boundaries
"""

import geopandas as gpd
import logging
from pathlib import Path
from typing import Optional, Dict
import click
import sys

# Add utils to path
sys.path.append(str(Path(__file__).parent.parent))

from utils.geo_utils import (
    validate_geometries,
    simplify_geometries,
    clean_column_names,
    clip_to_boundary,
    add_area_length_fields,
    export_geojson,
    print_summary,
    WGS84
)
from etl.extract import load_dataset, BASE_DATA_PATH

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def transform_dataset(
    gdf: gpd.GeoDataFrame,
    name: str,
    simplify: bool = True,
    tolerance: float = 0.0001,
    clip_boundary: Optional[gpd.GeoDataFrame] = None
) -> gpd.GeoDataFrame:
    """
    Apply standard transformations to a dataset.

    Args:
        gdf: Input GeoDataFrame
        name: Dataset name (for logging)
        simplify: Whether to simplify geometries
        tolerance: Simplification tolerance
        clip_boundary: Optional boundary to clip to

    Returns:
        Transformed GeoDataFrame
    """
    logger.info(f"{'='*60}")
    logger.info(f"Transforming: {name}")
    logger.info(f"{'='*60}")

    # 1. Reproject to WGS84
    if gdf.crs != WGS84:
        logger.info(f"Reprojecting from {gdf.crs} to {WGS84}")
        gdf = gdf.to_crs(WGS84)

    # 2. Clean column names
    gdf = clean_column_names(gdf)

    # 3. Validate and fix geometries
    gdf = validate_geometries(gdf, fix=True)

    # 4. Remove empty geometries
    null_geoms = gdf.geometry.isna().sum()
    if null_geoms > 0:
        logger.warning(f"Removing {null_geoms} null geometries")
        gdf = gdf[~gdf.geometry.isna()].copy()

    # 5. Clip to boundary if provided
    if clip_boundary is not None:
        logger.info("Clipping to city boundary")
        gdf = clip_to_boundary(gdf, clip_boundary)

    # 6. Add area/length fields
    geom_type = gdf.geometry.geom_type.iloc[0] if len(gdf) > 0 else None

    if geom_type and ('Polygon' in geom_type or 'LineString' in geom_type):
        gdf = add_area_length_fields(gdf)

    # 7. Simplify geometries for web
    if simplify and geom_type and geom_type in ['Polygon', 'MultiPolygon', 'LineString', 'MultiLineString']:
        gdf = simplify_geometries(gdf, tolerance=tolerance)

    # 8. Add metadata
    gdf['dataset'] = name
    gdf['source'] = 'Gallatin County GIS'

    logger.info(f"✓ Transformation complete: {len(gdf)} features")

    return gdf


def transform_county_dataset(
    name: str,
    county: str = "gallatin",
    simplify: bool = True,
    output: bool = True
) -> gpd.GeoDataFrame:
    """
    Transform a single county dataset.

    Args:
        name: Dataset name
        county: County name
        simplify: Whether to simplify geometries
        output: Whether to save output to processed directory

    Returns:
        Transformed GeoDataFrame
    """
    # Load raw data
    logger.info(f"Loading {name} from {county} county")
    gdf = load_dataset(name, county)

    # Transform
    gdf_transformed = transform_dataset(gdf, name, simplify=simplify)

    # Save to processed directory
    if output:
        processed_dir = BASE_DATA_PATH / county / "processed"
        processed_dir.mkdir(exist_ok=True, parents=True)

        output_path = processed_dir / f"{name}.geojson"
        export_geojson(gdf_transformed, str(output_path))

    return gdf_transformed


def transform_city_dataset(
    name: str,
    city: str,
    county: str = "gallatin",
    simplify: bool = True,
    output: bool = True
) -> gpd.GeoDataFrame:
    """
    Transform a dataset and clip to city boundary.

    Args:
        name: Dataset name
        city: City name
        county: County name
        simplify: Whether to simplify
        output: Whether to save output

    Returns:
        Transformed and clipped GeoDataFrame
    """
    # Load county dataset
    logger.info(f"Loading {name} from {county} county")
    gdf = load_dataset(name, county)

    # Load city boundary
    logger.info(f"Loading boundary for {city}")
    cities_gdf = load_dataset('cities', county)

    # Find city by name
    city_boundary = cities_gdf[
        cities_gdf['NAME'].str.lower() == city.lower().replace('-', ' ')
    ]

    if len(city_boundary) == 0:
        logger.warning(f"City '{city}' not found in cities dataset")
        logger.info(f"Available cities: {', '.join(cities_gdf['NAME'].tolist())}")
        raise ValueError(f"City not found: {city}")

    logger.info(f"Found city boundary for {city}")

    # Transform with city boundary clipping
    gdf_transformed = transform_dataset(
        gdf,
        f"{city}_{name}",
        simplify=simplify,
        clip_boundary=city_boundary
    )

    # Save to city processed directory
    if output:
        processed_dir = BASE_DATA_PATH / "cities" / city / "processed"
        processed_dir.mkdir(exist_ok=True, parents=True)

        output_path = processed_dir / f"{name}.geojson"
        export_geojson(gdf_transformed, str(output_path))

    return gdf_transformed


def transform_all_for_city(city: str, county: str = "gallatin") -> Dict[str, gpd.GeoDataFrame]:
    """
    Transform all relevant datasets for a city.

    Args:
        city: City name
        county: County name

    Returns:
        Dictionary of transformed datasets
    """
    # Core datasets to process for every city
    core_datasets = [
        'parcels',
        'roads',
        'waterways',
        'zoningdistricts',
        'cities',  # City boundary
    ]

    # Optional datasets (process if available)
    optional_datasets = [
        'firedistricts',
        'schooldistricts',
        'water_sewer_districts',
        'majorsubdivisions',
        'minorsubdivisions'
    ]

    all_datasets = core_datasets + optional_datasets

    results = {}

    logger.info(f"{'='*60}")
    logger.info(f"Processing all datasets for {city.upper()}")
    logger.info(f"{'='*60}")

    for dataset_name in all_datasets:
        try:
            logger.info(f"\n➤ Processing {dataset_name}...")

            gdf = transform_city_dataset(
                name=dataset_name,
                city=city,
                county=county,
                simplify=True,
                output=True
            )

            results[dataset_name] = gdf

            logger.info(f"✓ {dataset_name}: {len(gdf)} features")

        except FileNotFoundError:
            logger.warning(f"⊘ {dataset_name}: Not found (skipping)")
        except Exception as e:
            logger.error(f"✗ {dataset_name}: Error - {e}")

    logger.info(f"\n{'='*60}")
    logger.info(f"Transformation Summary")
    logger.info(f"{'='*60}")
    logger.info(f"City: {city.title()}")
    logger.info(f"Datasets processed: {len(results)}/{len(all_datasets)}")
    logger.info(f"Total features: {sum(len(gdf) for gdf in results.values()):,}")
    logger.info(f"{'='*60}\n")

    return results


@click.command()
@click.option('--county', default='gallatin', help='County name')
@click.option('--city', default=None, help='City name (clips to city boundary)')
@click.option('--dataset', default=None, help='Specific dataset to transform')
@click.option('--all', 'process_all', is_flag=True, help='Process all datasets')
@click.option('--no-simplify', is_flag=True, help='Skip geometry simplification')
def main(county: str, city: Optional[str], dataset: Optional[str], process_all: bool, no_simplify: bool):
    """
    Transform raw GIS data for web display.

    Examples:
        # Transform single county dataset
        python transform.py --dataset parcels

        # Transform for specific city (clips to boundary)
        python transform.py --city three-forks --dataset parcels

        # Process all datasets for a city
        python transform.py --city three-forks --all
    """
    simplify = not no_simplify

    if process_all and city:
        # Process all datasets for city
        transform_all_for_city(city, county)

    elif dataset and city:
        # Single dataset for city
        gdf = transform_city_dataset(dataset, city, county, simplify=simplify)
        print_summary(gdf, f"{city} - {dataset}")

    elif dataset:
        # Single county dataset
        gdf = transform_county_dataset(dataset, county, simplify=simplify)
        print_summary(gdf, f"{county} - {dataset}")

    else:
        logger.error("Must specify --dataset or --all")
        logger.info("Examples:")
        logger.info("  python transform.py --dataset parcels")
        logger.info("  python transform.py --city three-forks --all")


if __name__ == "__main__":
    main()
