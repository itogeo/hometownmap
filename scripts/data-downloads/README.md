# Data Download Scripts

Scripts for downloading GIS data from various sources. These can be re-run anytime to refresh data.

## Scripts

### `download_fema_nfhl.py`
Downloads FEMA National Flood Hazard Layer (NFHL) flood zone polygons.

```bash
python download_fema_nfhl.py
```

**Output:** `datasets/cities/three-forks/processed/flood_zones.geojson`

**Source:** [FEMA NFHL ArcGIS Service](https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer)

### `download-gallatin-data.sh`
Downloads Gallatin County GIS data layers from the county's ArcGIS services.

```bash
./download-gallatin-data.sh
```

**Output:** `datasets/cities/three-forks/raw/gallatin-county/*.geojson`

## Data Sources

| Source | URL | Layers |
|--------|-----|--------|
| FEMA NFHL | https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer | Flood zones, LOMAs, LOMRs |
| Gallatin County GIS | https://gis.gallatin.mt.gov/arcgis/rest/services | Parcels, zoning, subdivisions, etc. |
| Montana Cadastral | https://svc.mt.gov/msl/cadastral | Statewide parcel data |

## Adding New Data Sources

1. Create a new script in this folder
2. Follow the existing pattern:
   - Define bounding box for Three Forks area
   - Query the ArcGIS REST service
   - Save to appropriate location in `datasets/`
3. Update this README with the new script

## Bounding Box Reference

Three Forks, Montana area (with buffer):
- **West:** -111.65
- **East:** -111.45
- **South:** 45.82
- **North:** 45.98
