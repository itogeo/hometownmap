# Three Forks Demo Data

This directory contains sample GeoJSON data for testing the Three Forks map interface.

## Available Demo Files

### `city_boundary.geojson`
- City limits boundary for Three Forks
- Used to clip other datasets and show jurisdiction

### `parcels.geojson`
- 5 sample property parcels
- Includes residential & commercial properties with owner info

### `businesses.geojson`
- 8 real Three Forks businesses (as points)
- Includes addresses and phone numbers where available

## How to Replace with Real Data

Run the ETL pipeline:
```bash
cd ../../../scripts
python etl/pipeline.py --city three-forks
```

Real data sources: Gallatin County GIS, Montana Cadastral, OpenStreetMap, Microsoft Building Footprints
