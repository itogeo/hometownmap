# Quick Start: Get Resident Map Working NOW

## TL;DR - Run These 3 Commands

```bash
cd /Users/ianvandusen/Desktop/Ito/itogeo/repos/hometownmap/scripts

# Step 1: Extract Gallatin County parcels (takes 2-3 minutes)
python3 extract_gallatin_parcels.py

# Step 2: Clip to Three Forks (takes 10 seconds)
python3 clip_parcels_to_city.py --city three-forks

# Step 3: Refresh map at http://localhost:3001
```

## What This Gets You

✅ **1,600+ parcels** in Three Forks
✅ **Owner names** on every parcel
✅ **Property addresses** where available
✅ **Acreage calculations** accurate
✅ **Legal descriptions** for detailed info
✅ **Total assessed values** for property research

## Expected Output

After Step 1 (extract_gallatin_parcels.py):
```
✅ GALLATIN COUNTY PARCELS EXTRACTED SUCCESSFULLY
Parcels: 70,496
Owner names: 69,234/70,496 (98.2%)
Addresses: 58,123/70,496 (82.5%)
Output: datasets/gallatin/processed/parcels_cadastral.geojson
```

After Step 2 (clip_parcels_to_city.py):
```
✅ PARCELS CLIPPED TO CITY SUCCESSFULLY
City: Three-Forks
Parcels: 1,689
Owner data: 98.2% complete
Output: datasets/cities/three-forks/processed/parcels.geojson
```

## Check the Map

1. Go to http://localhost:3001
2. Make sure you're in **Resident Mode**
3. **Click on any parcel** - you should see:
   - Owner Name
   - Property Address
   - Acreage
   - Assessed Value
   - Legal Description

## If Something Goes Wrong

### Error: "Cadastral ZIP not found"
**Fix:** Check path in extract_gallatin_parcels.py
```bash
ls ../datasets/statewide/raw/MontanaCadastral_SHP.zip
```

### Error: "City not found"
**Fix:** City name must match exactly
```python
# Check available cities
python3 -c "
import geopandas as gpd
from etl.extract import load_dataset
cities = load_dataset('cities', 'gallatin')
print(cities['CITY'].tolist())
"
```

### Error: "No parcels found"
**Fix:** Run Step 1 first
```bash
ls datasets/gallatin/processed/parcels_cadastral.geojson
```

## Data Quality Notes

**Montana Cadastral is GOLD:**
- ✅ Authoritative statewide dataset
- ✅ Updated regularly (check TaxYear field)
- ✅ Has everything: owners, addresses, values, legal
- ✅ Better than county parcels because it includes ownership

**Why Not County Parcels?**
- County parcels = just polygons with ID numbers
- No owner data, no addresses, no values
- Would require separate join with cadastral anyway
- Montana Cadastral = one-stop shop

## Next Steps After This Works

1. ✅ Get parcels working (you're here!)
2. Add school districts layer
3. Add waterways layer
4. Add city boundary layer
5. Polish styling
6. Add search by owner name

## Time Estimate

- Step 1: 2-3 minutes (large file extraction)
- Step 2: 10-15 seconds (fast clipping)
- **Total: ~3 minutes to complete parcel data**

## Manual QA Checklist

After running the pipeline:

- [ ] Open map at http://localhost:3001
- [ ] Switch to Resident Mode
- [ ] See parcels displayed (should be ~1,600-1,700)
- [ ] Click on a parcel
- [ ] Popup shows owner name
- [ ] Popup shows address
- [ ] Popup shows acreage
- [ ] Try clicking 5 different parcels - owner data should be present
- [ ] Toggle parcels layer on/off - works smoothly

## Ready to Grind? LET'S GO! 💪

Run the commands above and watch the data come alive!
