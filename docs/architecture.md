# HometownMap - System Architecture

Technical architecture documentation for the HometownMap platform.

---

## 🎯 Overview

HometownMap is a **hybrid multi-tenant SaaS** platform for municipal GIS. It uses a shared codebase with city-specific data schemas and configurations, enabling rapid deployment across multiple cities while maintaining data isolation.

---

## 🏗️ System Components

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                          │
│  (React/Next.js + Mapbox GL JS)                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP / REST API
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   NEXT.JS API ROUTES                         │
│  - Config endpoint: /api/config/[city]                      │
│  - Layer data: /api/layers/[city]/[layer]                   │
│  - Search: /api/search/[city]                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ File System Read
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   DATA STORAGE                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Config Files (JSON)                                 │   │
│  │  /config/cities/[city].json                          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Processed GeoJSON                                   │   │
│  │  /Datasets/hometownmap/cities/[city]/processed/      │   │
│  │  /Datasets/hometownmap/[county]/processed/           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   MAPBOX API (External)                      │
│  - Base map tiles (satellite/streets)                       │
│  - Geocoding (future)                                        │
│  - Routing (future)                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   ETL PIPELINE (Python)                      │
│  Extract → Transform → Load                                  │
│  - Processes raw county GIS data                            │
│  - Clips to city boundaries                                 │
│  - Outputs optimized GeoJSON                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Data Architecture

### Data Hierarchy

```
Datasets/
└── hometownmap/
    ├── statewide/          ← Montana-wide datasets
    │   ├── raw/
    │   ├── processed/
    │   └── final/
    │
    ├── [county]/           ← County-level datasets (shared)
    │   ├── raw/            ← Original county GIS exports
    │   ├── processed/      ← Cleaned GeoJSON
    │   └── final/          ← Production-ready
    │
    └── cities/             ← City-specific datasets
        └── [city]/
            ├── raw/
            ├── processed/  ← Clipped to city boundary
            └── final/
```

### Data Flow

```
RAW DATA                 PROCESSED                CONSUMED BY
(Shapefiles/ZIP)  →     (GeoJSON/WGS84)    →    (Frontend/API)

County GIS Export → ETL Pipeline → /processed/ → Next.js API → Browser
     ↓                    ↓
  Extract             Transform
 (Unzip, Load)      (Reproject, Validate,
                     Clip, Simplify)
```

---

## 🎨 Frontend Architecture

### Technology Stack

- **Framework**: Next.js 14 (React)
- **Mapping**: Mapbox GL JS + react-map-gl
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **State Management**: React Hooks (useState, useEffect)

### Key Components

```
src/
├── pages/
│   ├── index.tsx                 # Main map interface
│   └── api/                      # API routes
│       ├── config/[city].ts      # City configuration
│       ├── layers/[city]/[layer].ts  # Layer data
│       └── search/[city].ts      # Search functionality
│
├── components/
│   ├── MapView.tsx              # Mapbox map + layer rendering
│   ├── ModeSelector.tsx         # Mode switching (Resident, Business, etc.)
│   ├── LayerControl.tsx         # Toggle layers on/off
│   └── SearchBar.tsx            # Address/owner search
│
├── types/
│   └── index.ts                 # TypeScript interfaces
│
├── lib/
│   └── api.ts                   # API client utilities (future)
│
└── styles/
    └── globals.css              # Global styles + Tailwind
```

### Multi-Mode Interface

The platform supports **5 distinct map modes**, each with different layers and features:

```typescript
type MapMode = 'resident' | 'business' | 'recreation' | 'services' | 'development'

modes: {
  resident: {
    layers: ['parcels', 'city_boundary', 'zoning', 'schools'],
    features: ['search_address', 'parcel_info']
  },
  business: {
    layers: ['parcels', 'zoning', 'buildings', 'available_properties'],
    features: ['filter_by_zoning', 'demographics']
  },
  ...
}
```

---

## 🐍 Backend / ETL Architecture

### Python ETL Pipeline

**Location**: `/scripts/etl/`

```python
# Pipeline stages
Extract   →   Transform   →   Load
  ↓             ↓              ↓
Unzip         Reproject     Save GeoJSON
Load SHP      Validate      (Future: PostGIS)
              Clip
              Simplify
```

### Scripts Overview

| Script | Purpose | Usage |
|--------|---------|-------|
| `extract.py` | Load raw data from ZIP/shapefiles | `python extract.py --list` |
| `transform.py` | Clean, reproject, clip, simplify | `python transform.py --city three-forks --dataset parcels` |
| `pipeline.py` | Orchestrate full ETL | `python pipeline.py --city three-forks` |
| `setup/create_city.py` | Scaffold new city | `python create_city.py --name belgrade` |

### Key Libraries

- **GeoPandas**: DataFrame for geospatial data
- **Shapely**: Geometry operations
- **Fiona**: Read/write spatial formats
- **PyProj**: Coordinate transformations

---

## 🗄️ Configuration System

### City Configuration

Each city has a JSON configuration file that controls:
- Map display (center, zoom, bounds)
- Available modes and features
- Layer definitions and styling
- Branding (logo, colors, title)
- Demographics and contact info

**Example**: `/config/cities/three-forks.json`

```json
{
  "id": "three-forks",
  "name": "Three Forks",
  "map": {
    "center": [-111.545, 45.893],
    "zoom": 13
  },
  "modes": {
    "resident": {
      "enabled": true,
      "layers": ["parcels", "zoning", "city_boundary"]
    }
  },
  "layers": {
    "parcels": {
      "source": "county",
      "display_name": "Property Parcels",
      "style": {
        "fill": "#3388ff",
        "fill-opacity": 0.2
      }
    }
  }
}
```

---

## 🚀 Deployment Architecture

### Current: Local Development

```
Developer Machine
├── Frontend: http://localhost:3000
├── API: Next.js API routes (same process)
└── Data: Local filesystem
```

### Future: Production (Digital Ocean)

```
                    ┌─────────────────┐
                    │   CloudFlare    │ ← CDN + DDoS protection
                    │   DNS           │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  DigitalOcean   │
                    │  Load Balancer  │ ← (Optional for scale)
                    └────────┬────────┘
                             │
           ┌─────────────────┴─────────────────┐
           │                                   │
    ┌──────▼──────┐                    ┌──────▼──────┐
    │   Droplet   │                    │   Droplet   │
    │  (App #1)   │                    │  (App #2)   │
    │             │                    │             │
    │ Next.js +   │                    │ Next.js +   │
    │ Node.js     │                    │ Node.js     │
    └──────┬──────┘                    └──────┬──────┘
           │                                   │
           └─────────────────┬─────────────────┘
                             │
                    ┌────────▼────────┐
                    │  PostgreSQL +   │
                    │  PostGIS        │ ← (Future)
                    └─────────────────┘
```

**Estimated Costs** (10 cities):
- Droplet: $24/month (2GB RAM, 50GB SSD)
- Database: Included in droplet initially
- Bandwidth: 2TB included
- **Total: ~$25/month for 10 cities**

---

## 🔐 Security Considerations

### Data Security
- ✅ All data is **public records** (no PII)
- ✅ No user authentication required (read-only public portal)
- ✅ No database writes from frontend
- ⚠️ Future: Add rate limiting to API endpoints

### API Security
- ✅ CORS configured for frontend domain only
- ⚠️ Future: Add API key for city-specific access
- ⚠️ Future: Implement request throttling

---

## 📊 Performance Optimization

### Frontend Performance

1. **Dynamic Imports**: Map component loaded client-side only
2. **Lazy Layer Loading**: Layers fetched on-demand
3. **Geometry Simplification**: Reduced vertices for web display
4. **GeoJSON over Shapefiles**: Faster parsing in browser

### Data Optimization

| Optimization | Impact | Implementation |
|--------------|--------|----------------|
| Simplify geometries | -60% file size | `simplify_geometries(tolerance=0.0001)` |
| Remove unnecessary fields | -30% file size | Keep only display fields |
| WGS84 projection | Required for web | `to_crs(EPSG:4326)` |
| GeoJSON format | Faster parsing | Native JSON parsing |

### Target Performance
- Initial load: < 3 seconds
- Layer toggle: < 500ms
- Search results: < 1 second

---

## 🔄 Scalability Strategy

### Horizontal Scaling

```
1 City      → 1 Droplet ($12/mo)
10 Cities   → 1 Droplet ($24/mo)
30 Cities   → 2 Droplets ($48/mo) + Load Balancer
100 Cities  → 5+ Droplets + CDN
```

### Data Storage Scaling

- **Local files** (current): Works for 10-30 cities
- **PostGIS** (future): Better for 30+ cities, enables spatial queries
- **Vector tiles** (future): Best for 100+ cities, cached tiles

---

## 🧪 Testing Strategy

### Manual Testing (Current)
- Browser testing (Chrome, Safari, Firefox, mobile)
- Test all 5 modes
- Test layer toggles
- Test search functionality
- Verify data accuracy

### Automated Testing (Future)
- Unit tests for utilities (GeoPandas functions)
- Integration tests for API routes
- E2E tests with Playwright
- Visual regression tests

---

## 📈 Monitoring & Analytics

### Future Additions
- Google Analytics: Page views, mode usage
- Sentry: Error tracking
- Custom events: Layer toggles, searches, clicks
- Performance monitoring: Load times, API latency

---

## 🔧 Developer Workflow

### Adding a New City

1. **Get data**: Download county GIS exports
2. **Scaffold**: `python create_city.py --name new-city`
3. **Process**: `python pipeline.py --city new-city`
4. **Configure**: Edit `/config/cities/new-city.json`
5. **Test**: Load at `http://localhost:3000`

**Time**: 2-4 hours after initial template is perfected

---

## 📚 Technology Decisions

### Why Next.js?
- ✅ Server-side rendering + static generation
- ✅ API routes (no separate backend needed initially)
- ✅ Great developer experience
- ✅ Easy deployment

### Why Mapbox?
- ✅ Beautiful satellite imagery
- ✅ Free tier (50K loads/month)
- ✅ Excellent performance
- ✅ Great documentation

### Why Python for ETL?
- ✅ GeoPandas is industry standard for GIS
- ✅ Excellent geospatial libraries
- ✅ Easy to debug and iterate
- ✅ Familiar to data scientists

### Why GeoJSON over Shapefiles?
- ✅ Web-native format
- ✅ Human-readable
- ✅ Works with JavaScript natively
- ✅ No conversion needed in browser

---

## 🚧 Future Enhancements

### Phase 2: Features
- [ ] PostGIS database integration
- [ ] Real-time data updates (building permits API)
- [ ] Advanced search (fuzzy matching, filters)
- [ ] Print/export maps
- [ ] Share links with specific views

### Phase 3: Scale
- [ ] Multi-tenant database architecture
- [ ] City admin dashboard
- [ ] Custom layer uploads
- [ ] Analytics dashboard
- [ ] Automated data refresh

### Phase 4: Advanced
- [ ] 3D building views
- [ ] Time-series data (historical changes)
- [ ] Mobile apps (iOS/Android)
- [ ] Offline map support
- [ ] Public API for third-party developers

---

**Last Updated**: January 22, 2026
**Version**: 1.0.0
