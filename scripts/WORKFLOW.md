# Data Processing Workflow

## Complete Processing Order

Run scripts in this exact order:

### 1. Unzip Raw Data
```bash
cd /Users/ianvandusen/Desktop/Ito/itogeo/repos/hometownmap/scripts
python3 unzip_all_data.py
```

**What it does**: Extracts all 12 ZIP files from `datasets/gallatin/raw/` into `.extracted_*` directories

**Output**: Raw shapefiles ready to process

---

### 2. Create Data Inventory
```bash
python3 data_inventory.py
```

**What it does**: Analyzes all extracted shapefiles and creates `data_inventory.json`

**Output**: Shows you what datasets are complete and ready

---

### 3. Process County-Wide Data (Optional)
```bash
python3 etl/transform.py --county gallatin --output
```

**What it does**: Converts all shapefiles to GeoJSON (county-wide, not clipped)

**Output**: Files in `datasets/gallatin/processed/`

**Use this for**: County-wide analysis or if you need full datasets

---

### 4. Process City-Specific Data
```bash
python3 etl/pipeline.py --city three-forks
```

**What it does**:
1. Loads county data
2. Clips to Three Forks city boundary
3. Cleans and validates geometries
4. Exports as optimized GeoJSON

**Output**: Files in `datasets/cities/three-forks/processed/`

**This is what the map uses!**

---

### 5. Quick All-in-One (Recommended)
```bash
./process_all_data.sh
```

**What it does**: Runs steps 1, 2, and 4 automatically

**Use this when**: You just want to process everything quickly

---

## What Each Script Does

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `unzip_all_data.py` | Extract ZIP files | First time, or when new data arrives |
| `data_inventory.py` | Analyze what you have | After unzipping, to see status |
| `etl/extract.py` | Load shapefiles | Called by other scripts (don't run directly) |
| `etl/transform.py` | Convert & clean data | For county-wide processing |
| `etl/pipeline.py` | Full ETL for a city | Main script - use this! |
| `process_all_data.sh` | Run everything | Quick processing |

---

## Current Status

✅ **Extracted**: All 12 datasets unzipped from raw ZIP files

✅ **Processed**: All 10 datasets successfully clipped to Three Forks boundary:
- **parcels.geojson** (1.6MB, 1,689 features) - Property ownership data
- **roads.geojson** (466KB, 431 features) - Street network
- **waterways.geojson** (6.3KB, 9 features) - Rivers, streams, canals
- **cities.geojson** (4.2KB, 1 feature) - City boundary
- **firedistricts.geojson** (4.3KB, 2 features) - Fire service districts
- **schooldistricts.geojson** (5.2KB, 2 features) - School districts
- **majorsubdivisions.geojson** (9.6KB, 12 features) - Major subdivisions
- **minorsubdivisions.geojson** (3.8KB, 6 features) - Minor subdivisions
- **zoningdistricts.geojson** (163B, 0 features) - Empty (Three Forks has no zoning data)
- **water_sewer_districts.geojson** (169B, 0 features) - Empty

**Total: 2,151 features processed in ~3 seconds**

---

## Next Steps

1. ✅ ~~Fix geometry processing~~ - COMPLETE! All datasets now processing successfully
2. Load processed data into the web map
3. Add Montana Cadastral ownership data (future enhancement)
4. Integrate OpenStreetMap for businesses (future enhancement)
5. Test map with real Three Forks data

---

## Troubleshooting

**"City not found"**: Check city name matches exactly in cities dataset (use `three forks` not `three-forks`)

**"0 features after clipping"**: City might not have that data type, or geometry issues

**Geometry errors**: Some county data has invalid geometries - we try to fix automatically

**Out of memory**: Process datasets one at a time instead of all together
