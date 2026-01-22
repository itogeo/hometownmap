# HometownMap - Dataset Repository

**Last Updated**: January 22, 2026

This repository contains all geospatial data for the HometownMap platform organized by geographic hierarchy: statewide → county → city.

---

## 📁 Directory Structure

```
hometownmap/
├── statewide/          # State-level datasets (Montana)
│   ├── raw/           # Original statewide data
│   ├── processed/     # Cleaned & transformed
│   └── final/         # Production-ready
│
├── gallatin/          # Gallatin County shared datasets
│   ├── raw/           # Original county GIS exports
│   ├── processed/     # Cleaned & validated
│   └── final/         # Production layers
│
└── cities/            # City-specific datasets
    └── three-forks/   # Three Forks, Montana (Template)
        ├── raw/       # City-specific raw data
        ├── processed/ # Processed city data
        └── final/     # Production layers
```

---

## 🗂️ Data Lifecycle

### 1. Raw
Original data as received from sources:
- County GIS exports (shapefiles, GeoJSON)
- OpenStreetMap extracts
- Census data
- City-provided files

**Never modified** - immutable source of truth

### 2. Processed
Cleaned and standardized:
- Reprojected to WGS84 (EPSG:4326)
- Geometries validated and repaired
- Attributes standardized
- Simplified for web display
- Converted to GeoJSON

**Timestamped** - processing date preserved

### 3. Final
Production-ready data:
- Optimized for web delivery
- Loaded to PostGIS database
- Indexed and cached
- Tile sets generated (if needed)

**Versioned** - tied to application releases

---

## 📊 Current Datasets

### Gallatin County (Shared Across All County Cities)

**Location**: `/Datasets/hometownmap/gallatin/raw/`

| Dataset | File | Features | Use Cases |
|---------|------|----------|-----------|
| **Parcels** | `parcels (1).zip` | ~50,000 | Property boundaries, ownership, assessments (Resident, Business, Development modes) |
| **Roads** | `roads.zip` | ~15,000 | Street network, names, classifications (All modes) |
| **Waterways** | `waterways (2).zip` | ~2,000 | Rivers, streams, lakes (Recreation, Development modes) |
| **Cities** | `cities (1).zip` | 12 | Municipal boundaries for all Gallatin County cities |
| **Zoning** | `zoningdistricts (1).zip` | ~500 | Zoning classifications (Business, Development modes) |
| **Fire Districts** | `firedistricts.zip` | 8 | Fire service boundaries (Services mode) |
| **School Districts** | `schooldistricts.zip` | 6 | School district boundaries (Resident mode) |
| **Water/Sewer** | `water_sewer_districts.zip` | 15 | Utility service areas (Services, Development modes) |
| **Voting Precincts** | `votingprecincts (1).zip` | 45 | Electoral boundaries (Resident mode) |
| **Commission Districts** | `commissiondistricts.zip` | 5 | County commission districts (Resident mode) |
| **Major Subdivisions** | `majorsubdivisions.zip` | ~200 | Large developments (Business, Development modes) |
| **Minor Subdivisions** | `minorsubdivisions.zip` | ~800 | Smaller subdivisions (Development mode) |

**Data Source**: Gallatin County GIS Department
**Last Updated**: January 2026
**Coordinate System**: NAD83 Montana State Plane (EPSG:32100) - to be reprojected to WGS84

---

### Statewide (Montana)

**Location**: `/Datasets/hometownmap/statewide/raw/`

| Dataset | File | Description |
|---------|------|-------------|
| **Montana Boundaries** | `Montana.geojson.zip` | State outline, counties, major features |

**Data Source**: Montana State Library
**Future Additions**: State highways, public lands, Montana cities

---

### Three Forks Specific

**Location**: `/Datasets/hometownmap/cities/three-forks/`

**Status**: To be populated

**Planned Layers**:
- City boundary (extracted from county cities layer)
- Parks and recreation facilities
- City government buildings
- Points of interest
- Custom zones/overlays
- Capital improvement projects

---

## 🎯 Data by Map Mode

### 🏠 Resident Mode
- Parcels (property boundaries, ownership)
- City limits
- School districts
- Voting precincts
- Address search

### 🏢 Business/Economic Development Mode
- Available properties
- Commercial zoning
- Demographics (Census integration)
- Existing businesses (future)
- Traffic data (future)

### 🏞️ Parks & Recreation Mode
- Parks with amenities
- Trails
- Public facilities
- Golf courses
- Event venues

### 🏛️ City Services Mode
- Government offices with hours/contacts
- Utility service areas
- Fire/police districts
- Waste collection zones
- Service request areas

### 🏗️ Development & Planning Mode
- Building permits (future - API integration)
- Capital improvement projects
- Proposed developments
- Floodplains
- Zoning districts
- Subdivision plats

---

## 🔄 Data Processing Workflow

### Initial Setup (Per County)

1. **Acquire Data**
   - Contact county GIS department
   - Download available layers
   - Store in `{county}/raw/`

2. **Inventory & Catalog**
   - Document data sources
   - List available layers
   - Note coordinate systems
   - Update this README

3. **Process County Layers**
   ```bash
   cd /repos/hometownmap/scripts
   python etl/pipeline.py --county gallatin --stage all
   ```

4. **Load to Database**
   ```bash
   python etl/load.py --county gallatin
   ```

### Adding a New City

1. **Create City Structure**
   ```bash
   cd /repos/hometownmap/scripts/setup
   python create_city.py --name "new-city" --county gallatin
   ```

2. **Extract City Data**
   - Clip county layers to city boundary
   - Add city-specific data
   - Store in `cities/{city-name}/raw/`

3. **Process City Layers**
   ```bash
   python etl/pipeline.py --city new-city --stage all
   ```

4. **Configure Map Modes**
   - Edit `config/cities/new-city.json`
   - Define which layers appear in each mode
   - Set default zoom, bounds, styling

---

## 📋 Data Quality Standards

### Geometry
- ✅ Valid geometries (no self-intersections, holes, etc.)
- ✅ Topologically clean (no gaps or overlaps where inappropriate)
- ✅ Simplified for web (tolerance: 0.0001 degrees)
- ✅ WGS84 projection (EPSG:4326)

### Attributes
- ✅ Consistent naming (snake_case)
- ✅ Required fields present (id, name, type)
- ✅ Clean text (trimmed, proper case)
- ✅ Standardized values (enums for categories)

### Files
- ✅ GeoJSON format (UTF-8 encoding)
- ✅ Reasonable file sizes (<10MB preferred)
- ✅ Descriptive filenames (county_parcels.geojson)
- ✅ Metadata included (source, date, CRS)

---

## 🚀 Future Data Sources

### Planned Integrations
- **OpenStreetMap**: Buildings, POIs, amenities
- **Microsoft Building Footprints**: Detailed building polygons
- **US Census**: Demographics, block groups
- **USGS**: Elevation, topography, water bodies
- **FEMA**: Flood zones
- **Montana Cadastral**: Statewide parcels (alternative/supplement to county data)

### City-Specific Data
- Business licenses (via API)
- Building permits (via API)
- Code violations (via API)
- Events calendar
- News/announcements

---

## 📝 Contributing Data

### Adding County Data
1. Create county directory: `mkdir -p {county}/{raw,processed,final}`
2. Add raw data to `{county}/raw/`
3. Update this README with dataset inventory
4. Run ETL pipeline
5. Document any quirks or issues

### Adding City Data
1. Use `create_city.py` to scaffold structure
2. Add city-specific data to `cities/{city}/raw/`
3. Update city README
4. Process and load
5. Configure map modes

### Data Naming Conventions
- **Counties**: lowercase, no spaces (e.g., `gallatin`)
- **Cities**: lowercase, hyphens for spaces (e.g., `three-forks`)
- **Files**: descriptive, lowercase, underscores (e.g., `gallatin_parcels_2026.geojson`)

---

## 🔒 Data Privacy & Security

- **Public Data Only**: All data is from public sources or city-provided public records
- **No PII**: Personal information is stripped from all datasets
- **Compliance**: GDPR/CCPA compliant (public records exemption)
- **Attribution**: All data sources credited per license requirements

---

## 📞 Data Requests & Issues

**Missing Data**: Contact county GIS or city planning department
**Data Errors**: Report to ian@itogeospatial.com with screenshot/location
**Update Requests**: Cities can request updates within 24 hours

---

## 📚 Resources

- [Gallatin County GIS](http://www.gallatin.mt.gov/gis)
- [Montana State Library GIS](https://geoinfo.msl.mt.gov/)
- [Montana Cadastral Mapping](https://svc.mt.gov/msl/mtcadastral/)
- [OpenStreetMap Montana](https://www.openstreetmap.org/relation/162115)

---

**Maintained By**: Ito Geospatial
**Contact**: ian@itogeospatial.com
**Last Inventory**: January 22, 2026
