# Three Forks Data Processing Pipeline

## Strategy: Manual Quality Control

This pipeline prioritizes **data quality** over automation. Each step can be run independently and inspected.

## Phase 1: Get Montana Cadastral Parcels (THE SOURCE OF TRUTH)

### Why Montana Cadastral?
- ✅ Has parcel polygons WITH owner data built-in
- ✅ Statewide authoritative dataset
- ✅ Includes: Owner names, addresses, acreage, values, legal descriptions
- ✅ Already has everything we need in one place

### Step 1.1: Extract Gallatin County Parcels from Montana Cadastral

```bash
cd /Users/ianvandusen/Desktop/Ito/itogeo/repos/hometownmap/scripts
python3 extract_gallatin_parcels.py
```

**What this does:**
- Loads OWNERPARCEL.shp from MontanaCadastral_SHP.zip
- Filters to Gallatin County only (~70,000 parcels)
- Reprojects to WGS84
- Cleans column names
- Saves to: `datasets/gallatin/processed/parcels_cadastral.geojson`

**Output:** Gallatin County parcels with ALL owner data

### Step 1.2: Clip Parcels to Three Forks

```bash
python3 clip_parcels_to_city.py --city three-forks
```

**What this does:**
- Loads parcels_cadastral.geojson
- Loads Three Forks city boundary
- Clips parcels to city limits
- Validates geometries
- Adds area calculations
- Saves to: `datasets/cities/three-forks/processed/parcels.geojson`

**Manual Check:**
- Open in QGIS/ArcGIS to verify
- Check that ~1,600-1,700 parcels are retained
- Verify owner names are present

---

## Phase 2: Process Supporting Layers (Resident Mode)

### Step 2.1: School Districts

```bash
python3 etl/transform.py --city three-forks --dataset schooldistricts
```

**Manual Check:**
- Should see 2 school districts
- Elementary and High School districts

### Step 2.2: Waterways

```bash
python3 etl/transform.py --city three-forks --dataset waterways
```

**Manual Check:**
- Should see ~9 waterway features
- Rivers/streams through Three Forks

### Step 2.3: City Boundary

```bash
python3 etl/transform.py --city three-forks --dataset cities
```

**Manual Check:**
- Should be 1 polygon
- ~950 acres

---

## Phase 3: Verify Data Quality

### Check 3.1: Parcel Ownership Data

```bash
python3 -c "
import geopandas as gpd
gdf = gpd.read_file('datasets/cities/three-forks/processed/parcels.geojson')
print(f'Total parcels: {len(gdf)}')
print(f'Parcels with owner names: {gdf[\"ownername\"].notna().sum()}')
print(f'Parcels with addresses: {gdf[\"addresslin\"].notna().sum()}')
print(f'Sample owners:')
for owner in gdf[\"ownername\"].dropna().head(5):
    print(f'  - {owner}')
"
```

### Check 3.2: Layer File Sizes

```bash
ls -lh datasets/cities/three-forks/processed/
```

**Expected sizes:**
- parcels.geojson: 1.5-2 MB
- schooldistricts.geojson: 5-10 KB
- waterways.geojson: 5-10 KB
- cities.geojson: 3-5 KB

---

## Phase 4: Load into Map

### Update Config

Edit `config/cities/three-forks.json`:
- Resident mode layers: `["cities", "parcels", "schooldistricts", "waterways"]`
- Parcel popup fields: `["ownername", "addresslin", "gisacres", "totalvalue", "legaldescr"]`

### Restart Dev Server

```bash
cd apps/web
npm run dev
```

### Test Map
1. Open http://localhost:3001
2. Switch to Resident Mode
3. Click on parcels - should see owner names!
4. Check all 4 layers toggle on/off

---

## Troubleshooting

### Problem: "No features after clipping"
**Cause:** City boundary doesn't intersect parcels
**Fix:** Check CRS match - both should be in WGS84

### Problem: "Owner names are null"
**Cause:** Montana Cadastral data incomplete for this county
**Fix:** Check if TaxYear field is recent (should be 2023-2024)

### Problem: "Too many parcels showing"
**Cause:** Clipping didn't work
**Fix:** Verify city boundary loaded correctly, expand buffer slightly

### Problem: "Geometries have diagonal lines"
**Cause:** Mixed geometry types in layer
**Fix:** Already handled in MapView.tsx with geometry-type filters

---

## Data Sources

1. **Montana Cadastral (OWNERPARCEL.shp)**
   - Location: `datasets/statewide/raw/MontanaCadastral_SHP.zip`
   - Size: 1.9 GB (uncompressed)
   - Contains: 773,199 parcels statewide
   - Fields: 44 columns including ownership, legal, values

2. **Gallatin County GIS**
   - Location: `datasets/gallatin/raw/*.zip`
   - Contains: boundaries, infrastructure, natural features
   - Use for: city limits, schools, water, districts

---

## Pipeline Summary

```
MontanaCadastral_SHP.zip
    ↓ extract_gallatin_parcels.py
Gallatin County Parcels (70K parcels)
    ↓ clip_parcels_to_city.py
Three Forks Parcels (1,600 parcels) WITH OWNER DATA
    ↓ Load to map
Beautiful Resident Map! 🎉
```

---

## Next Session Goals

1. ✅ Get parcels working with owner data
2. ✅ Verify all 4 resident mode layers display
3. ✅ Test parcel popups show owner names
4. Polish parcel styling for clarity
5. Add search by owner name functionality

---

## Notes for Manual Processing

- **Each step is independent** - you can re-run any step
- **Outputs are versioned** - old files backed up automatically
- **Quality over speed** - take time to verify each layer
- **QGIS is your friend** - open intermediate outputs to check
- **Failing is fine** - easy to debug single steps

Ready to grind! 💪
