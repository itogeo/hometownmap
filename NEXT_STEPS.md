# 🎯 Next Steps - Building the Three Forks Demo

You now have a **complete foundation** for HometownMap. Here's what to do next to create a killer demo.

---

## ✅ Phase 1: Process the Data (Today - 1 hour)

### 1.1 Extract All Datasets

```bash
cd scripts
python etl/extract.py --list
```

**You should see**:
- parcels
- roads
- waterways
- cities
- zoning
- fire districts
- school districts
- etc.

### 1.2 Run the Full Pipeline

```bash
python etl/pipeline.py --city three-forks
```

**This will**:
- Extract all county datasets
- Clip them to Three Forks boundary
- Clean and validate geometries
- Output GeoJSON files

### 1.3 Verify the Output

```bash
ls -lh ../../../Datasets/hometownmap/cities/three-forks/processed/
```

**You should have**:
- `parcels.geojson` ← THE MONEY DATA
- `roads.geojson`
- `cities.geojson` (city boundary)
- `zoningdistricts.geojson`
- And more...

---

## 🎨 Phase 2: Customize Three Forks (Today - 1 hour)

### 2.1 Update City Config

Edit: `/config/cities/three-forks.json`

**Add demographics** (get from census or city website):
```json
"demographics": {
  "population": 2143,
  "median_income": 54000,
  "median_age": 42.5,
  "growth_rate": "+8% (2010-2020)"
}
```

**Add contact info**:
```json
"contact": {
  "city_hall": "206 Main Street, Three Forks, MT 59752",
  "phone": "(406) 285-6311",
  "email": "cityclerk@threeforks-mt.gov",
  "website": "https://threeforks-mt.gov"
}
```

**Update map center** (get from processed data):
```bash
cd scripts
python -c "
import geopandas as gpd
gdf = gpd.read_file('../../../Datasets/hometownmap/cities/three-forks/processed/cities.geojson')
bounds = gdf.total_bounds
center_lon = (bounds[0] + bounds[2]) / 2
center_lat = (bounds[1] + bounds[3]) / 2
print(f'Center: [{center_lon:.6f}, {center_lat:.6f}]')
print(f'Bounds: {bounds}')
"
```

Copy the center coordinates to your config.

### 2.2 Test the Changes

```bash
cd apps/web
npm run dev
```

Open http://localhost:3000 and verify:
- Demographics show up in Business mode
- Map is centered on Three Forks
- All layers load correctly

---

## 🏗️ Phase 3: Add Premium Features (Tomorrow - 3 hours)

### 3.1 Add Microsoft Building Footprints

**Why**: Shows vacant land vs. developed parcels instantly (killer feature for economic development)

**How**:
1. Download Montana buildings: https://github.com/microsoft/USBuildingFootprints
2. Filter to Three Forks area
3. Add to ETL pipeline
4. Display in Business mode

### 3.2 Implement "Available Properties" Filter

**In Business mode**, add a toggle button that:
- Highlights parcels with no buildings (vacant land)
- Filters by commercial/industrial zoning
- Shows parcels > 1 acre

**This is THE feature** that sells economic development directors.

### 3.3 Improve Search

Currently search is basic. Make it better:
- Fuzzy matching (handle typos)
- Search by parcel ID
- Search by street name
- Show results on map (zoom + highlight)

---

## 🎬 Phase 4: Create Demo Scenarios (Tomorrow - 1 hour)

### Scenario 1: Resident Use Case
**Story**: "I want to see my property and check the zoning"

**Demo**:
1. Search "123 Main Street"
2. Map zooms to parcel
3. Click parcel → popup shows owner, zoning, acreage
4. Toggle zoning layer → see color-coded zones

**Time**: 15 seconds

---

### Scenario 2: Economic Development
**Story**: "A brewery wants a 2+ acre commercial lot near the highway"

**Demo**:
1. Switch to Business mode
2. Click "Available Properties" toggle
3. Select commercial zoning filter
4. 3-5 green parcels highlight
5. Click one → "City can facilitate introduction to owner"

**Time**: 30 seconds

---

### Scenario 3: City Staff Efficiency
**Story**: "Resident calls asking who owns the vacant lot next door"

**Demo**:
1. Search the address
2. Instantly see owner name and contact
3. "Instead of 5 minutes searching county records, instant answer"

**Time**: 10 seconds

**Practice these until you can do them smoothly.**

---

## 📸 Phase 5: Screenshots & Pitch (2 hours)

### 5.1 Take Screenshots

**Capture**:
- Full map view (Resident mode)
- Business mode with demographics card
- Available properties highlighted
- Parcel popup with details
- Mobile view (resize browser)

**Before/After**:
- Screenshot Three Forks' current PDF maps
- Screenshot county's clunky GIS portal
- Screenshot YOUR clean interface

**Use for pitch deck and emails.**

### 5.2 Write the Pitch Email

**Subject**: "Three Forks Interactive Maps - Demo Ready"

**Body**:
```
Hi [City Administrator],

I'm Ian, a Montana-based geospatial consultant. I built something I think Three Forks could benefit from.

I created an interactive map portal specifically for Three Forks that:
• Shows all parcel ownership and zoning (searchable)
• Highlights available properties for economic development
• Works beautifully on phones
• Gives residents instant answers without calling city hall

I built this as a proof-of-concept because I believe small Montana cities deserve modern tools.

Would you have 15 minutes for me to show it to you? No obligation—I just want feedback from a real city.

Demo link: [your hosted demo or localhost instructions]

Best,
Ian
Ito Geospatial
ian@itogeospatial.com
```

---

## 🚀 Phase 6: Deploy Demo (Optional - 2 hours)

### Option A: Keep it Local
Show the demo on your laptop in person. Most effective for first pitch.

### Option B: Deploy to Vercel (Free)
```bash
cd apps/web
npm run build
vercel deploy
```

Get a URL like: `threeforks-demo.vercel.app`

Send this in your email.

---

## 📊 Success Metrics

Before pitching to Three Forks:

### Technical
- [ ] Map loads in < 3 seconds
- [ ] All layers display correctly
- [ ] Search works reliably
- [ ] No console errors
- [ ] Mobile responsive (tested on phone)

### Business
- [ ] 3 demo scenarios perfected
- [ ] Screenshots taken
- [ ] Comparison with county site prepared
- [ ] Economic development value clear
- [ ] Pricing prepared ($300-500/month for Three Forks)

### Narrative
- [ ] Can explain value in < 30 seconds
- [ ] Can demo in < 2 minutes
- [ ] Have testimonials ready (if any)
- [ ] Know your numbers (cost, revenue, time to deploy)

---

## 💡 Pro Tips

### 1. Lead with Economic Development
Don't say "I built a map." Say "I can help you attract businesses to Three Forks."

### 2. Show, Don't Tell
Don't describe features. Open the map and click around. Let them see it.

### 3. Be Honest About Stage
"This is a proof-of-concept. I built it specifically for Three Forks to get your feedback."

### 4. Price Confidently
$300-500/month is nothing for a city. Don't apologize for it.

### 5. Ask for Feedback
"What else would make this useful for Three Forks?" They'll tell you what to build next.

---

## 🎯 Timeline

| Phase | Time | Priority |
|-------|------|----------|
| Process all data | 1 hour | HIGH |
| Customize config | 1 hour | HIGH |
| Add building footprints | 3 hours | MEDIUM |
| Perfect demo scenarios | 1 hour | HIGH |
| Take screenshots | 1 hour | HIGH |
| Write pitch email | 1 hour | HIGH |
| Deploy (optional) | 2 hours | LOW |

**Total**: 10 hours to demo-ready

---

## 🔥 The End Goal

**You want to**:
1. Get Three Forks to say "yes, we'll pay $300/month"
2. Use that as social proof for Belgrade, Manhattan, Livingston
3. Get to 10 cities in Year 1
4. Build the business from there

**This foundation gets you there.**

---

## 📞 Questions?

- Architecture questions: `/docs/architecture.md`
- Setup issues: `/docs/GETTING_STARTED.md`
- Data questions: `/Datasets/hometownmap/README.md`

**You've got this. Now go build the demo and land that first client!** 🚀
