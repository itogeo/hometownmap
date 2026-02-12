# HometownMap Data Inventory

Complete inventory of data sources for municipal GIS mapping.

## Montana State Sources

### Montana Cadastral (Parcels)
- **URL**: https://svc.mt.gov/msl/cadastral/
- **API**: https://gis.mt.gov/arcgis/rest/services/MSL/Cadastral/MapServer
- **Format**: ArcGIS REST Service
- **Update Frequency**: Weekly
- **Coverage**: Statewide
- **Key Fields**: `ownername`, `addresslin`, `citystatez`, `gisacres`, `proptype`, `totalvalue`
- **Script**: `download_parcels.sh`

### Montana State Library GIS
- **URL**: https://gis.mt.gov/
- **Layers Available**:
  - County boundaries
  - City limits
  - State parks
  - Public lands

---

## Gallatin County Sources

### Gallatin County ArcGIS REST Services
- **Base URL**: https://gis.gallatin.mt.gov/arcgis/rest/services

#### ESZ (Emergency Services Zones)
- **Service**: `ESZ/ESZ/MapServer`
- **Layers**:
  | ID | Name | Description |
  |----|------|-------------|
  | 0 | Fire_Districts | Fire district boundaries |
  | 1 | School_Districts | School district boundaries |
  | 2 | Water_Sewer_Districts | Water/sewer district boundaries |
  | 3 | Hydrants_Fill_Sites | Fire hydrants and water fill sites |
  | 5 | Groundwater_Monitor_Wells | Groundwater monitoring locations |
  | 6 | Wastewater_Treatment_Systems | Wastewater system locations |
  | 7 | Water_Supply_Systems | Water supply infrastructure |

#### Subdivision Data
- **Service**: `Subdivision/SubDivision/MapServer`
- **Layers**:
  | ID | Name | Description |
  |----|------|-------------|
  | 0 | Subdivisions | Major subdivision boundaries |
  | 1 | Minor_Subdivisions | Minor subdivision boundaries |
  | 2 | Certificates_of_Survey | COS records |

#### Environmental/Hazards
- **Service**: Various
- **Layers**:
  | Layer | Service | ID |
  |-------|---------|-----|
  | Floodplain | FEMA NFHL | - |
  | WUI (Wildfire) | Fire/WUI/MapServer | 0 |
  | Conservation | Land/Conservation/MapServer | 0 |

---

## Federal Sources

### FEMA National Flood Hazard Layer (NFHL)
- **URL**: https://hazards.fema.gov/gis/nfhl/rest/services
- **Format**: ArcGIS REST Service
- **Key Fields**: `FLD_ZONE`, `ZONE_SUBTY`, `SFHA_TF`, `STATIC_BFE`
- **Zones**:
  - `A`, `AE`, `AH`, `AO` = 100-year floodplain (1% annual chance)
  - `X` = 500-year floodplain (0.2% annual chance)

### USGS National Hydrography Dataset
- **URL**: https://www.usgs.gov/national-hydrography
- **Format**: GeoPackage, Shapefile
- **Use**: Rivers, streams, water bodies

### Microsoft Building Footprints
- **URL**: https://github.com/microsoft/USBuildingFootprints
- **Format**: GeoJSON
- **Coverage**: All 50 states
- **Update**: Periodic

---

## Download URLs (Direct)

### Gallatin County Queries

```bash
# Hydrants - Three Forks area
https://gis.gallatin.mt.gov/arcgis/rest/services/ESZ/ESZ/MapServer/3/query?where=FIRE_AREA%3D%27THREE+FORKS%27&outFields=*&f=geojson

# Groundwater Wells - Three Forks bbox
https://gis.gallatin.mt.gov/arcgis/rest/services/ESZ/ESZ/MapServer/5/query?geometry=-111.7,45.8,-111.4,46.0&geometryType=esriGeometryEnvelope&outFields=*&f=geojson

# Wastewater Systems - Three Forks bbox
https://gis.gallatin.mt.gov/arcgis/rest/services/ESZ/ESZ/MapServer/6/query?geometry=-111.7,45.8,-111.4,46.0&geometryType=esriGeometryEnvelope&outFields=*&f=geojson

# Water Supply Systems - Three Forks bbox
https://gis.gallatin.mt.gov/arcgis/rest/services/ESZ/ESZ/MapServer/7/query?geometry=-111.7,45.8,-111.4,46.0&geometryType=esriGeometryEnvelope&outFields=*&f=geojson

# Subdivisions - Three Forks bbox
https://gis.gallatin.mt.gov/arcgis/rest/services/Subdivision/SubDivision/MapServer/0/query?geometry=-111.7,45.8,-111.4,46.0&geometryType=esriGeometryEnvelope&outFields=*&f=geojson

# Fire Districts
https://gis.gallatin.mt.gov/arcgis/rest/services/ESZ/ESZ/MapServer/0/query?where=1%3D1&outFields=*&f=geojson

# School Districts
https://gis.gallatin.mt.gov/arcgis/rest/services/ESZ/ESZ/MapServer/1/query?where=1%3D1&outFields=*&f=geojson
```

### Montana Cadastral Query

```bash
# Parcels for Three Forks (Gallatin County)
https://gis.mt.gov/arcgis/rest/services/MSL/Cadastral/MapServer/0/query?where=countyname%3D%27GALLATIN%27&geometry=-111.7,45.8,-111.4,46.0&geometryType=esriGeometryEnvelope&outFields=*&f=geojson
```

---

## Layer Status

| Layer | Source | Status | Last Updated | Notes |
|-------|--------|--------|--------------|-------|
| parcels | MT Cadastral | Active | 2024-02-11 | ~3000 features |
| subdivisions | Gallatin County | Active | 2024-02-11 | Major subdivisions |
| minor_subdivisions | Gallatin County | Active | 2024-02-11 | COS and minor |
| hydrants | Gallatin County | Active | 2024-02-11 | 39 features |
| groundwater_wells | Gallatin County | Active | 2024-02-11 | 150 features |
| wastewater | Gallatin County | Active | 2024-02-11 | Treatment systems |
| water_supply | Gallatin County | Active | 2024-02-11 | Supply systems |
| cities | MT State | Active | 2024-02-11 | City boundaries |
| firedistricts | Gallatin County | Active | 2024-02-11 | District boundaries |
| schooldistricts | Gallatin County | Active | 2024-02-11 | District boundaries |
| buildings | Microsoft | Active | 2024-02-11 | Building footprints |
| waterways | USGS NHD | Active | 2024-02-11 | Rivers and streams |
| floodplain_100yr | FEMA NFHL | Active | 2024-02-11 | 1% annual flood |
| floodplain_500yr | FEMA NFHL | Active | 2024-02-11 | 0.2% annual flood |
| wui | Gallatin County | Active | 2024-02-11 | Wildfire interface |
| conservation | Gallatin County | Active | 2024-02-11 | Easements |

---

## Adding a New City

1. **Identify Data Sources**
   - Check if county has ArcGIS REST services
   - Find cadastral service endpoint
   - Locate FEMA flood data

2. **Create City Config**
   ```bash
   cp data/sources/three-forks.json data/sources/{new-city}.json
   # Edit with new bounding box and source URLs
   ```

3. **Download Data**
   ```bash
   ./data/scripts/download_all.sh {new-city}
   ```

4. **Process and Deploy**
   ```bash
   python data/scripts/process_layers.py --city {new-city}
   ./data/scripts/deploy_layers.sh {new-city}
   ```

5. **Create Web Config**
   ```bash
   cp apps/web/public/data/config/three-forks.json apps/web/public/data/config/{new-city}.json
   # Edit branding, contact info, layer list
   ```
