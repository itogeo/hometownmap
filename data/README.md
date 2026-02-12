# HometownMap Data Pipeline

Municipal GIS data sourcing, processing, and visualization pipeline.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  PRONG 1: DATA SOURCING                                         │
├─────────────────────────────────────────────────────────────────┤
│  1a. Download datasets from authoritative sources               │
│  1b. Check for updates (manual now, automated future)           │
│  1c. Clean/transform to map-ready GeoJSON format                │
│                                                                 │
│  Scripts: data/scripts/download_*.sh                            │
│  Output:  data/raw/                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PRONG 2: PROCESSING PIPELINE                                   │
├─────────────────────────────────────────────────────────────────┤
│  2a. Transform raw data to standardized format                  │
│  2b. Clip to city/county boundaries                             │
│  2c. Add computed fields (area, centroids, etc.)                │
│                                                                 │
│  Scripts: data/scripts/process_*.py                             │
│  Output:  data/processed/                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PRONG 3: VISUALIZATION                                         │
├─────────────────────────────────────────────────────────────────┤
│  3a. Copy processed data to web app                             │
│  3b. Update layer configs as needed                             │
│  3c. Deploy to production                                       │
│                                                                 │
│  Output: apps/web/public/data/layers/{city}/                    │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
data/
├── sources/           # Source definitions (JSON configs)
│   ├── montana.json   # State-level sources
│   └── gallatin.json  # County-level sources
├── scripts/           # Download and processing scripts
│   ├── download_parcels.sh
│   ├── download_gallatin.sh
│   └── process_layers.py
├── raw/               # Raw downloaded data (git-ignored)
└── processed/         # Processed GeoJSON (git-ignored)
```

## Quick Start

```bash
# 1. Download all data for Three Forks
./data/scripts/download_all.sh three-forks

# 2. Process and clip to city boundary
python data/scripts/process_layers.py --city three-forks

# 3. Deploy to web app
./data/scripts/deploy_layers.sh three-forks
```

## Data Inventory

See [INVENTORY.md](./INVENTORY.md) for complete list of data sources.
