"""
Geospatial Utility Functions for HometownMap

Common operations for processing GIS data:
- Coordinate system transformations
- Geometry validation and repair
- Simplification
- Attribute cleaning
"""

import geopandas as gpd
import shapely
from shapely.geometry import mapping, shape
from shapely.validation import make_valid
from shapely.ops import unary_union
import logging
from typing import Optional, Tuple, List
import re

logger = logging.getLogger(__name__)

# Standard CRS
WGS84 = "EPSG:4326"
WEB_MERCATOR = "EPSG:3857"


def load_spatial_file(filepath: str, target_crs: str = WGS84) -> gpd.GeoDataFrame:
    """
    Load any spatial file format (shapefile, GeoJSON, etc.) and reproject.

    Args:
        filepath: Path to spatial data file
        target_crs: Target coordinate system (default: WGS84)

    Returns:
        GeoDataFrame reprojected to target CRS
    """
    try:
        gdf = gpd.read_file(filepath)
        logger.info(f"Loaded {len(gdf)} features from {filepath}")
        logger.info(f"Original CRS: {gdf.crs}")

        if gdf.crs is None:
            logger.warning("No CRS found - assuming WGS84")
            gdf.set_crs(WGS84, inplace=True)

        if gdf.crs != target_crs:
            logger.info(f"Reprojecting to {target_crs}")
            gdf = gdf.to_crs(target_crs)

        return gdf

    except Exception as e:
        logger.error(f"Failed to load {filepath}: {e}")
        raise


def validate_geometries(gdf: gpd.GeoDataFrame, fix: bool = True) -> gpd.GeoDataFrame:
    """
    Validate and optionally fix invalid geometries.

    Args:
        gdf: Input GeoDataFrame
        fix: If True, attempt to repair invalid geometries

    Returns:
        GeoDataFrame with valid geometries
    """
    invalid_count = (~gdf.is_valid).sum()

    if invalid_count == 0:
        logger.info("All geometries valid ✓")
        return gdf

    logger.warning(f"Found {invalid_count} invalid geometries")

    if fix:
        logger.info("Attempting to fix invalid geometries...")
        gdf['geometry'] = gdf['geometry'].apply(
            lambda geom: make_valid(geom) if geom and not geom.is_valid else geom
        )

        still_invalid = (~gdf.is_valid).sum()
        if still_invalid > 0:
            logger.warning(f"Could not fix {still_invalid} geometries - removing")
            gdf = gdf[gdf.is_valid].copy()
        else:
            logger.info("All geometries repaired ✓")

    return gdf


def simplify_geometries(
    gdf: gpd.GeoDataFrame,
    tolerance: float = 0.0001,
    preserve_topology: bool = True
) -> gpd.GeoDataFrame:
    """
    Simplify geometries for web display.

    Args:
        gdf: Input GeoDataFrame
        tolerance: Simplification tolerance in CRS units (0.0001° ≈ 11m)
        preserve_topology: If True, prevents topology errors

    Returns:
        GeoDataFrame with simplified geometries
    """
    logger.info(f"Simplifying geometries (tolerance: {tolerance})")

    original_vertices = gdf.geometry.apply(lambda g: len(g.coords) if g.geom_type == 'LineString' else sum(len(p.exterior.coords) for p in ([g] if g.geom_type == 'Polygon' else g.geoms))).sum()

    gdf['geometry'] = gdf['geometry'].simplify(
        tolerance=tolerance,
        preserve_topology=preserve_topology
    )

    simplified_vertices = gdf.geometry.apply(lambda g: len(g.coords) if g.geom_type == 'LineString' else sum(len(p.exterior.coords) for p in ([g] if g.geom_type == 'Polygon' else g.geoms))).sum()

    reduction = (1 - simplified_vertices / original_vertices) * 100
    logger.info(f"Reduced vertices by {reduction:.1f}% ({original_vertices:,} → {simplified_vertices:,})")

    return gdf


def clean_column_names(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Standardize column names to snake_case and remove special characters.

    Args:
        gdf: Input GeoDataFrame

    Returns:
        GeoDataFrame with cleaned column names
    """
    def to_snake_case(name: str) -> str:
        # Remove special characters
        name = re.sub(r'[^\w\s]', '', name)
        # Replace spaces with underscores
        name = re.sub(r'\s+', '_', name)
        # Convert to lowercase
        name = name.lower()
        return name

    original_columns = gdf.columns.tolist()
    gdf.columns = [to_snake_case(col) for col in gdf.columns]

    renamed = [f"{old} → {new}" for old, new in zip(original_columns, gdf.columns) if old != new]
    if renamed:
        logger.info(f"Renamed columns: {', '.join(renamed)}")

    return gdf


def clip_to_boundary(
    gdf: gpd.GeoDataFrame,
    boundary: gpd.GeoDataFrame
) -> gpd.GeoDataFrame:
    """
    Clip GeoDataFrame to a boundary polygon.

    Args:
        gdf: Input GeoDataFrame to clip
        boundary: Boundary GeoDataFrame (single or multi polygon)

    Returns:
        Clipped GeoDataFrame
    """
    logger.info(f"Clipping {len(gdf)} features to boundary")

    # Ensure same CRS
    if gdf.crs != boundary.crs:
        boundary = boundary.to_crs(gdf.crs)

    # Union all boundary polygons into one
    boundary_union = unary_union(boundary.geometry)

    # Clip
    clipped = gdf.clip(boundary_union)

    logger.info(f"Retained {len(clipped)} features after clipping")

    return clipped


def calculate_bounds(gdf: gpd.GeoDataFrame) -> Tuple[float, float, float, float]:
    """
    Calculate bounding box of GeoDataFrame.

    Args:
        gdf: Input GeoDataFrame

    Returns:
        Tuple of (min_lon, min_lat, max_lon, max_lat)
    """
    bounds = gdf.total_bounds
    return tuple(bounds)


def get_centroid(gdf: gpd.GeoDataFrame) -> Tuple[float, float]:
    """
    Calculate centroid of all features.

    Args:
        gdf: Input GeoDataFrame

    Returns:
        Tuple of (lon, lat)
    """
    union = unary_union(gdf.geometry)
    centroid = union.centroid
    return (centroid.x, centroid.y)


def add_area_length_fields(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Add area (for polygons) or length (for lines) fields in appropriate units.

    Calculates in Web Mercator for accuracy, converts to sq meters / meters.

    Args:
        gdf: Input GeoDataFrame

    Returns:
        GeoDataFrame with area_sqm or length_m fields
    """
    original_crs = gdf.crs

    # Convert to Web Mercator for accurate metric calculations
    gdf_metric = gdf.to_crs(WEB_MERCATOR)

    geom_type = gdf_metric.geometry.geom_type.iloc[0]

    if 'Polygon' in geom_type:
        gdf['area_sqm'] = gdf_metric.geometry.area
        gdf['area_acres'] = gdf['area_sqm'] * 0.000247105
        logger.info("Added area_sqm and area_acres fields")

    elif 'LineString' in geom_type:
        gdf['length_m'] = gdf_metric.geometry.length
        gdf['length_ft'] = gdf['length_m'] * 3.28084
        logger.info("Added length_m and length_ft fields")

    return gdf


def export_geojson(
    gdf: gpd.GeoDataFrame,
    output_path: str,
    driver: str = "GeoJSON",
    precision: int = 6
) -> None:
    """
    Export GeoDataFrame to GeoJSON with specified precision.

    Args:
        gdf: Input GeoDataFrame
        output_path: Output file path
        driver: Output driver (default: GeoJSON)
        precision: Decimal places for coordinates (default: 6 ≈ 10cm accuracy)
    """
    logger.info(f"Exporting {len(gdf)} features to {output_path}")

    # Ensure WGS84 for GeoJSON
    if gdf.crs != WGS84:
        gdf = gdf.to_crs(WGS84)

    gdf.to_file(output_path, driver=driver)

    import os
    file_size = os.path.getsize(output_path) / 1024 / 1024
    logger.info(f"Exported successfully ({file_size:.2f} MB)")


def merge_datasets(
    gdfs: List[gpd.GeoDataFrame],
    on: Optional[str] = None
) -> gpd.GeoDataFrame:
    """
    Merge multiple GeoDataFrames.

    Args:
        gdfs: List of GeoDataFrames to merge
        on: Column to join on (if None, simple concatenation)

    Returns:
        Merged GeoDataFrame
    """
    if not gdfs:
        raise ValueError("No GeoDataFrames to merge")

    if len(gdfs) == 1:
        return gdfs[0]

    logger.info(f"Merging {len(gdfs)} datasets")

    if on:
        result = gdfs[0]
        for gdf in gdfs[1:]:
            result = result.merge(gdf, on=on)
    else:
        result = gpd.GeoDataFrame(pd.concat(gdfs, ignore_index=True))

    logger.info(f"Merged dataset contains {len(result)} features")

    return result


def summary_stats(gdf: gpd.GeoDataFrame) -> dict:
    """
    Generate summary statistics for a GeoDataFrame.

    Args:
        gdf: Input GeoDataFrame

    Returns:
        Dictionary of statistics
    """
    stats = {
        'feature_count': len(gdf),
        'geometry_types': gdf.geometry.geom_type.value_counts().to_dict(),
        'crs': str(gdf.crs),
        'bounds': calculate_bounds(gdf),
        'centroid': get_centroid(gdf),
        'columns': gdf.columns.tolist(),
        'null_geometries': gdf.geometry.isna().sum(),
        'invalid_geometries': (~gdf.is_valid).sum()
    }

    return stats


def print_summary(gdf: gpd.GeoDataFrame, name: str = "Dataset") -> None:
    """
    Print formatted summary of GeoDataFrame.

    Args:
        gdf: Input GeoDataFrame
        name: Name of dataset for display
    """
    stats = summary_stats(gdf)

    print(f"\n{'='*60}")
    print(f"{name} Summary")
    print(f"{'='*60}")
    print(f"Features: {stats['feature_count']:,}")
    print(f"Geometry Types: {stats['geometry_types']}")
    print(f"CRS: {stats['crs']}")
    print(f"Bounds: {stats['bounds']}")
    print(f"Centroid: {stats['centroid']}")
    print(f"Columns: {', '.join(stats['columns'][:5])}{'...' if len(stats['columns']) > 5 else ''}")

    if stats['null_geometries'] > 0:
        print(f"⚠️  Null Geometries: {stats['null_geometries']}")
    if stats['invalid_geometries'] > 0:
        print(f"⚠️  Invalid Geometries: {stats['invalid_geometries']}")

    print(f"{'='*60}\n")
