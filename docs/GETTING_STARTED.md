# Getting Started with HometownMap

Complete setup guide for Three Forks (template city) deployment.

---

## 🎯 Prerequisites

Before starting, ensure you have:

- **Node.js**: v18+ ([Download](https://nodejs.org/))
- **Python**: 3.9+ ([Download](https://www.python.org/downloads/))
- **npm** or **yarn**: Comes with Node.js
- **Mapbox Account**: Free tier ([Sign up](https://account.mapbox.com/auth/signup/))
- **Git**: For version control
- **Code Editor**: VS Code recommended

---

## 📦 Part 1: Initial Setup

### 1.1 Clone/Navigate to Repository

```bash
cd /Users/ianvandusen/Desktop/Ito/itogeo/repos/hometownmap
```

### 1.2 Install Python Dependencies

```bash
cd scripts
pip install -r requirements.txt
```

**Verify installation**:
```bash
python -c "import geopandas; print('GeoPandas:', geopandas.__version__)"
```

### 1.3 Get Mapbox Token

1. Go to [Mapbox Account](https://account.mapbox.com/access-tokens/)
2. Create new token or copy default public token
3. Save it - you'll need it in the next step

### 1.4 Configure Environment

```bash
cd /Users/ianvandusen/Desktop/Ito/itogeo/repos/hometownmap
cp .env.example .env
```

**Edit `.env` file**:
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_actual_mapbox_token_here
```

### 1.5 Install Node.js Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd apps/web
npm install
```

---

## 🗺️ Part 2: Process Three Forks Data

### 2.1 Verify Raw Data

Check that raw Gallatin County data exists:

```bash
ls -lh /Users/ianvandusen/Desktop/Ito/itogeo/Datasets/hometownmap/gallatin/raw/
```

You should see:
- `parcels (1).zip`
- `roads.zip`
- `cities (1).zip`
- `zoningdistricts (1).zip`
- And more...

### 2.2 Run ETL Pipeline

**Important**: This will take 2-5 minutes on first run.

```bash
cd /Users/ianvandusen/Desktop/Ito/itogeo/repos/hometownmap/scripts

# Run full pipeline for Three Forks
python etl/pipeline.py --city three-forks
```

**Expected output**:
```
🚀 HOMETOWNMAP ETL PIPELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
City: THREE-FORKS
County: GALLATIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 STAGE 1: EXTRACT
...
🔄 STAGE 2: TRANSFORM
...
✅ PIPELINE COMPLETE
Datasets processed: 5-10
```

### 2.3 Verify Processed Data

```bash
ls -lh /Users/ianvandusen/Desktop/Ito/itogeo/Datasets/hometownmap/cities/three-forks/processed/
```

You should see GeoJSON files:
- `parcels.geojson`
- `roads.geojson`
- `cities.geojson`
- `zoningdistricts.geojson`

---

## 🚀 Part 3: Start Development Server

### 3.1 Start Frontend

```bash
cd /Users/ianvandusen/Desktop/Ito/itogeo/repos/hometownmap/apps/web
npm run dev
```

**Expected output**:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 3.2 Open Application

Open your browser:
```
http://localhost:3000
```

**You should see**:
- Three Forks Interactive Map
- Mode selector (Resident, Business, Parks, Services, Development)
- Map with Mapbox satellite/streets background
- Layer controls on right side

---

## 🎨 Part 4: Customize Three Forks

### 4.1 Update City Configuration

Edit the config file:
```bash
open /Users/ianvandusen/Desktop/Ito/itogeo/repos/hometownmap/config/cities/three-forks.json
```

**Key things to update**:

1. **Map center coordinates** (get from processed data bounds)
2. **Demographics** (from Census or city website)
3. **Contact information** (city hall phone, email)
4. **Branding** (if they have a logo)

Example:
```json
{
  "demographics": {
    "population": 2143,
    "median_income": 54000,
    "median_age": 42.5,
    "growth_rate": "+8% (2010-2020)"
  },
  "contact": {
    "city_hall": "206 Main Street, Three Forks, MT 59752",
    "phone": "(406) 285-6311",
    "email": "cityclerk@threeforks-mt.gov",
    "website": "https://threeforks-mt.gov"
  }
}
```

### 4.2 Add City Logo (Optional)

1. Save logo as `three-forks-logo.png` in `apps/web/public/`
2. Update config:
```json
"branding": {
  "logo": "/three-forks-logo.png",
  ...
}
```

---

## ✅ Part 5: Testing the Demo

### Test Scenarios

#### 1. Resident Mode
- [ ] Switch to Resident mode
- [ ] Toggle on "Parcels" layer
- [ ] Click on a parcel → see popup with owner info
- [ ] Search an address → should find and highlight parcel

#### 2. Business Mode
- [ ] Switch to Business mode
- [ ] See demographics card in bottom-left
- [ ] Toggle zoning layer → different colors for zones
- [ ] Check legend (if implemented)

#### 3. Mobile Responsive
- [ ] Open on phone or resize browser to mobile width
- [ ] Check that controls are usable
- [ ] Test search functionality
- [ ] Verify map gestures work

---

## 🐛 Troubleshooting

### Issue: "Mapbox token not configured"

**Solution**: Check `.env` file has correct token
```bash
cat .env | grep MAPBOX
```

### Issue: "Failed to load layer data"

**Causes**:
1. ETL pipeline didn't run successfully
2. GeoJSON files missing

**Solution**:
```bash
# Re-run pipeline
cd scripts
python etl/pipeline.py --city three-forks

# Check if files exist
ls -la ../../../Datasets/hometownmap/cities/three-forks/processed/
```

### Issue: "City configuration not found"

**Cause**: Config file not created

**Solution**:
```bash
cd scripts/setup
python create_city.py --name three-forks --display-name "Three Forks"
```

### Issue: GeoPandas import error

**Cause**: Python dependencies not installed

**Solution**:
```bash
cd scripts
pip install -r requirements.txt
```

### Issue: Port 3000 already in use

**Solution**: Kill existing process or use different port
```bash
# Option 1: Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Option 2: Use different port
npm run dev -- -p 3001
```

---

## 📝 Next Steps

Once the basic demo is working:

1. **Add more data layers**:
   - Microsoft Building Footprints
   - OpenStreetMap streets
   - Parks and facilities

2. **Implement search functionality**:
   - Search by address
   - Search by owner name
   - Fuzzy matching

3. **Add filters**:
   - "Available Properties" (Business mode)
   - Filter by zoning type
   - Filter by parcel size

4. **Polish UI**:
   - Add legend for zoning colors
   - Improve popup styling
   - Add loading states

5. **Test with city staff**:
   - Get feedback on use cases
   - Identify missing data
   - Refine workflows

---

## 📚 Useful Commands

```bash
# List available datasets
cd scripts
python etl/extract.py --list

# Process single dataset
python etl/transform.py --city three-forks --dataset parcels

# Check processed data summary
python -c "import geopandas as gpd; gdf = gpd.read_file('../../../Datasets/hometownmap/cities/three-forks/processed/parcels.geojson'); print(f'Features: {len(gdf)}, Bounds: {gdf.total_bounds}')"

# Restart frontend with fresh cache
cd apps/web
rm -rf .next && npm run dev
```

---

## 🎯 Success Checklist

Before showing to Three Forks city staff:

- [ ] Map loads in < 3 seconds
- [ ] All processed layers display correctly
- [ ] Search works reliably
- [ ] Mobile responsive (tested on phone)
- [ ] Demographics data populated
- [ ] Contact info updated
- [ ] No console errors
- [ ] 3 demo scenarios tested successfully
- [ ] Screenshots taken for pitch deck

---

**Questions?** Check `/docs/architecture.md` for technical details or `/docs/data-dictionary.md` for dataset information.

**Ready to deploy another city?** See `/docs/deployment.md` for instructions on replicating for Belgrade, Manhattan, or other cities.
