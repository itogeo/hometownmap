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

✅ **Extracted**: All 12 datasets unzipped
✅ **Processed**: 6 datasets clipped to Three Forks:
- cities.geojson
- firedistricts.geojson
- schooldistricts.geojson
- minorsubdivisions.geojson
- zoningdistricts.geojson (empty - Three Forks might not have zoning data)
- water_sewer_districts.geojson (empty)

⚠️ **Failed**: Some datasets had geometry issues:
- parcels (IMPORTANT - needs fixing!)
- roads
- waterways
- majorsubdivisions

---

## Next Steps

1. Fix geometry processing for parcels/roads/waterways
2. Process county-wide first, then clip
3. Add Montana Cadastral ownership data
4. Integrate OpenStreetMap for businesses

---

## Troubleshooting

**"City not found"**: Check city name matches exactly in cities dataset (use `three forks` not `three-forks`)

**"0 features after clipping"**: City might not have that data type, or geometry issues

**Geometry errors**: Some county data has invalid geometries - we try to fix automatically

**Out of memory**: Process datasets one at a time instead of all together
