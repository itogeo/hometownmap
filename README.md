# HometownMap - Municipal GIS SaaS Platform

> **Template City**: Three Forks, Montana | **County**: Gallatin | **State**: Montana

A scalable, reproducible platform for providing interactive mapping and GIS data visualization to small and medium-sized cities.

## 🏗️ Project Overview

HometownMap is a hybrid-architecture SaaS platform that delivers municipal GIS capabilities to cities. Built with a shared codebase and city-specific configurations, it allows rapid deployment across multiple municipalities while maintaining data isolation and customization.

### Current Status
- ✅ **Frontend**: Complete with 5 modes, search, business directory
- ✅ **Data**: 12 Gallatin County datasets ready to process
- ✅ **Demo**: Working with sample data
- ⏳ **Next**: Process real data and deploy

**[→ Start Here: GETTING_STARTED.md](GETTING_STARTED.md)**

---

## 📁 Architecture

### Tech Stack
- **Frontend**: Next.js (React) + Mapbox GL JS
- **Backend**: Node.js (Express/Fastify)
- **Data Processing**: Python (GeoPandas, Shapely, Fiona)
- **Database**: PostGIS (PostgreSQL with spatial extensions)
- **Data Formats**: GeoJSON, Vector Tiles
- **Deployment**: Docker + Docker Compose (local), Digital Ocean (production)

### Project Structure

```
hometownmap/
├── apps/
│   ├── web/                    # Next.js frontend application
│   │   ├── src/
│   │   │   ├── components/    # React components (Map, Layers, Controls)
│   │   │   ├── pages/         # Next.js pages
│   │   │   ├── lib/           # Utilities, API clients
│   │   │   ├── config/        # Frontend configuration
│   │   │   └── styles/        # Global styles
│   │   └── package.json
│   │
│   └── api/                    # Node.js API backend
│       ├── src/
│       │   ├── routes/        # API endpoints
│       │   ├── services/      # Business logic
│       │   ├── models/        # Database models
│       │   ├── config/        # Backend configuration
│       │   └── middleware/    # Auth, logging, etc.
│       └── package.json
│
├── scripts/                    # Data processing & automation
│   ├── etl/                   # Extract, Transform, Load pipelines
│   │   ├── extract.py         # Extract from raw sources
│   │   ├── transform.py       # Clean & transform geometries
│   │   ├── load.py            # Load to database/files
│   │   └── pipeline.py        # Orchestrate full ETL
│   │
│   ├── setup/                 # Initial setup & utilities
│   │   ├── init_database.py   # Database initialization
│   │   └── create_city.py     # Scaffold new city
│   │
│   └── utils/                 # Shared utilities
│       └── geo_utils.py       # Geospatial helper functions
│
├── config/                     # Configuration management
│   ├── cities/                # City-specific configs
│   │   └── three-forks.json   # Three Forks configuration
│   ├── database.yml           # Database connection configs
│   └── mapbox.yml             # Mapbox settings
│
├── database/                   # Database schemas & migrations
│   ├── migrations/            # Version-controlled schema changes
│   └── schemas/               # Schema definitions
│
├── docs/                      # Documentation
│   ├── architecture.md        # System architecture details
│   ├── data-dictionary.md     # Data layer descriptions
│   └── deployment.md          # Deployment procedures
│
├── Datasets/                   # All GIS data (git-ignored: raw/*.zip)
│   ├── statewide/             # Montana-wide datasets
│   │   ├── raw/
│   │   ├── processed/
│   │   └── final/
│   │
│   ├── gallatin/              # Gallatin County datasets (shared)
│   │   ├── raw/              # *.zip files (git-ignored)
│   │   ├── processed/
│   │   └── final/
│   │
│   └── cities/                # City-specific datasets
│       └── three-forks/
│           ├── raw/
│           ├── processed/
│           └── final/
│
├── docker-compose.yml         # Local development environment (future)
├── .env.example               # Environment variables template
├── .gitignore
├── package.json               # Root package.json (monorepo)
└── README.md                  # This file
```

---

## 📊 Data Organization

**All data is stored within the repo** at: `/Datasets/` (large files are git-ignored)

### Data Hierarchy

```
Datasets/
├── statewide/                 # Montana-wide datasets
│   ├── raw/                   # Original downloads (git-ignored)
│   ├── processed/             # Cleaned & transformed
│   └── final/                 # Production-ready
│
├── gallatin/                  # Gallatin County datasets (shared)
│   ├── raw/                   # *.zip files (git-ignored)
│   ├── processed/             # Cleaned & validated
│   └── final/                 # Production-ready county layers
│
└── cities/                    # City-specific datasets
    └── three-forks/
        ├── raw/               # City-specific raw data
        ├── processed/         # Processed city data
        └── final/             # Production layers for Three Forks
```

### Data Lifecycle

1. **Raw**: Original data as downloaded from sources (zipped shapefiles, GeoJSON, etc.)
2. **Processed**: Cleaned, validated, reprojected to WGS84, simplified geometries
3. **Final**: Optimized for production (GeoJSON for web, loaded to PostGIS)

---

## 📦 Current Datasets

### Gallatin County (Shared)

Located at: `Datasets/gallatin/raw/`

| Dataset | File | Type | Size | Description |
|---------|------|------|------|-------------|
| **Parcels** | `parcels (1).zip` | Polygon | 11.1 MB | Property boundaries & ownership |
| **Roads** | `roads.zip` | LineString | 3.7 MB | Road network & street names |
| **Waterways** | `waterways (2).zip` | LineString/Polygon | 6.8 MB | Rivers, streams, water bodies |
| **Cities** | `cities (1).zip` | Polygon | 131 KB | Municipal boundaries |
| **Zoning Districts** | `zoningdistricts (1).zip` | Polygon | 3.9 MB | Zoning classifications |
| **Fire Districts** | `firedistricts.zip` | Polygon | 317 KB | Fire service boundaries |
| **School Districts** | `schooldistricts.zip` | Polygon | 146 KB | School district boundaries |
| **Water/Sewer** | `water_sewer_districts.zip` | Polygon | 127 KB | Utility service areas |
| **Voting Precincts** | `votingprecincts (1).zip` | Polygon | 222 KB | Electoral precincts |
| **Commission Districts** | `commissiondistricts.zip` | Polygon | 75 KB | County commission districts |
| **Major Subdivisions** | `majorsubdivisions.zip` | Polygon | 1.9 MB | Large developments |
| **Minor Subdivisions** | `minorsubdivisions.zip` | Polygon | 604 KB | Smaller subdivisions |

### Statewide (Montana)

Located at: `Datasets/statewide/raw/`

| Dataset | File | Type | Size | Description |
|---------|------|------|------|-------------|
| **Montana Boundaries** | `Montana.geojson.zip` | Mixed | 26.6 MB | Statewide geographic data |

### Three Forks Specific

Located at: `Datasets/cities/three-forks/`

*To be populated with city-specific data layers*

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18+ and npm/yarn
- **Python**: 3.9+ with pip
- **Docker**: Docker Desktop or Docker Engine
- **PostgreSQL/PostGIS**: Via Docker or local install
- **Mapbox Account**: For mapping tiles (free tier available)

### Installation

1. **Navigate to the repository**
```bash
cd ~/Desktop/Ito/itogeo/repos/hometownmap
```

2. **Install Python dependencies**
```bash
cd scripts
pip install -r requirements.txt
```

3. **Install Node.js dependencies**
```bash
# Root
npm install

# Frontend
cd apps/web
npm install

# Backend
cd ../api
npm install
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your Mapbox token, database credentials, etc.
```

5. **Start local development environment**
```bash
docker-compose up -d
```

6. **Run initial data processing**
```bash
cd scripts
python etl/pipeline.py --city three-forks
```

7. **Start development servers**
```bash
# Terminal 1 - Backend
cd apps/api
npm run dev

# Terminal 2 - Frontend
cd apps/web
npm run dev
```

8. **Open application**
```
http://localhost:3000
```

---

## 🔄 Data Processing Workflow

### Processing New Data

1. **Add raw data** to appropriate directory:
   - County data → `Datasets/gallatin/raw/`
   - City data → `Datasets/cities/three-forks/raw/`
   - State data → `Datasets/statewide/raw/`

2. **Run ETL pipeline**:
```bash
cd scripts
python etl/pipeline.py --county gallatin --city three-forks
```

3. **Verify processed data**:
   - Check `/processed/` directory for cleaned GeoJSON
   - Review logs for any errors or warnings

4. **Load to database**:
```bash
python etl/load.py --city three-forks
```

5. **Update dataset catalog** in this README

---

## 🏙️ Adding a New City

### Within Gallatin County

```bash
cd scripts/setup
python create_city.py --name "new-city-name" --county gallatin
```

This will:
- Create directory structure in `/Datasets/hometownmap/cities/new-city-name/`
- Generate city config in `config/cities/new-city-name.json`
- Set up database schema
- Create city-specific README

### New County

```bash
python create_city.py --name "new-city" --county "new-county" --state montana
```

---

## 📖 Key Concepts

### Multi-Level Data Sharing

1. **Statewide**: Data used across all Montana cities (state boundaries, highways)
2. **County-wide**: Shared across cities in same county (parcels, roads, utilities)
3. **City-specific**: Unique to individual city (custom zones, city projects)

### Configuration System

Each city has a JSON config defining:
- Display name, bounds, default zoom
- Data layers to show/hide
- Styling preferences
- Custom features

Example: `config/cities/three-forks.json`

### Data Versioning

- Raw data is never modified (immutable)
- Each processing run creates new timestamped outputs
- Database migrations track schema changes
- Git tracks code and configuration changes

---

## 🎯 Roadmap

### Phase 1: Foundation (Current)
- [x] Project structure and data organization
- [x] ETL pipeline for Gallatin County data
- [ ] Basic Next.js frontend with Mapbox
- [ ] API for serving GeoJSON layers
- [ ] PostGIS database setup
- [ ] Three Forks initial deployment

### Phase 2: Features
- [ ] Layer toggle controls
- [ ] Search & geocoding
- [ ] Parcel detail popups
- [ ] Print/export maps
- [ ] Mobile responsive design

### Phase 3: Scale
- [ ] Multi-tenant architecture
- [ ] Admin dashboard for cities
- [ ] Automated data updates
- [ ] Custom layer upload
- [ ] Analytics & usage tracking

### Phase 4: Production
- [ ] Digital Ocean deployment
- [ ] CI/CD pipeline
- [ ] Monitoring & logging
- [ ] Backup & disaster recovery
- [ ] Customer onboarding flow

---

## 🤝 Contributing

This is a template project for Three Forks. Keep code clean, well-documented, and focused on reproducibility for future city deployments.

### Development Principles
1. **Simplicity First**: Avoid over-engineering
2. **Reproducibility**: Every city should deploy the same way
3. **Documentation**: Update docs with every change
4. **Data Quality**: Validate and test all data transformations
5. **Performance**: Optimize for small-city scales (1000-10000 residents)

---

## 📝 License

Proprietary - All rights reserved

---

## 📞 Contact

Project Lead: Ian Van Dusen
Repository: `/Users/ianvandusen/Desktop/Ito/itogeo/repos/hometownmap`

---

**Last Updated**: January 22, 2026
**Template Version**: 1.0.0
**Current City**: Three Forks, Montana
