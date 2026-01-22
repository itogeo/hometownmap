# Complete Setup Guide

## Prerequisites

### 1. Install Node.js

**macOS** (using Homebrew):
```bash
brew install node
```

**Or download from**: https://nodejs.org/ (LTS version recommended)

Verify installation:
```bash
node --version  # Should show v18 or higher
npm --version   # Should show v9 or higher
```

### 2. Install Python 3.9+

**macOS**:
```bash
brew install python@3.11
```

**Or download from**: https://www.python.org/downloads/

Verify installation:
```bash
python3 --version  # Should show 3.9 or higher
pip3 --version
```

### 3. Install Git

**macOS**:
```bash
brew install git
```

Verify installation:
```bash
git --version
```

## Quick Start

### 1. Install Dependencies

```bash
# Install Python dependencies
cd repos/hometownmap/scripts
pip3 install -r requirements.txt

# Install Node.js dependencies
cd ../apps/web
npm install
```

### 2. Environment Setup

The `.env.local` file is already configured with your Mapbox token. If you need to change it:

```bash
cd repos/hometownmap/apps/web
```

Edit `.env.local`:
```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
NEXT_PUBLIC_DEFAULT_CITY=three-forks
```

### 3. Start Development Server

```bash
cd repos/hometownmap/apps/web
npm run dev
```

Open http://localhost:3000 in your browser.

## Demo Data

Sample demo data is already in place at:
```
repos/hometownmap/Datasets/cities/three-forks/processed/
```

This includes:
- `city_boundary.geojson` - Three Forks city limits
- `parcels.geojson` - 5 sample properties
- `businesses.geojson` - 8 real Three Forks businesses

## Processing Real Data

When ready to process real county GIS data:

```bash
cd repos/hometownmap/scripts
python etl/pipeline.py --city three-forks
```

This will:
1. Load data from `/Datasets/gallatin/raw/`
2. Clip to Three Forks boundary (with 1-mile buffer)
3. Clean and validate geometries
4. Output to `/Datasets/cities/three-forks/processed/`

## GitHub Setup

### Initialize and Push to GitHub

```bash
cd repos/hometownmap

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: HometownMap foundation"

# Create repo on GitHub at https://github.com/itogeo/hometownmap
# Then connect and push:
git remote add origin https://github.com/itogeo/hometownmap.git
git branch -M main
git push -u origin main
```

### What Gets Uploaded

✅ **Uploaded to GitHub**:
- All source code
- Configuration files
- Documentation
- Demo data (small GeoJSON files)

❌ **NOT Uploaded** (via `.gitignore`):
- Raw ZIP files (`Datasets/*/raw/*.zip`)
- Large processed files (`Datasets/*/processed/*.geojson`)
- Node modules
- Environment files (`.env.local`)

## Project Structure

```
repos/hometownmap/
├── apps/
│   └── web/              # Next.js frontend
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── pages/       # Pages and API routes
│       │   └── types/       # TypeScript types
│       └── .env.local       # Environment config (YOUR TOKEN HERE)
│
├── scripts/
│   ├── etl/              # Data processing pipeline
│   └── requirements.txt  # Python dependencies
│
├── config/
│   └── cities/           # City configurations
│       └── three-forks.json
│
├── Datasets/
│   ├── gallatin/         # County-level data
│   │   └── raw/          # Raw GIS data (user adds)
│   └── cities/
│       └── three-forks/
│           └── processed/ # Processed GeoJSON (demo data included)
│
└── docs/                 # Documentation
```

## Troubleshooting

### Port 3000 Already in Use

```bash
npm run dev -- -p 3001
```

Then open http://localhost:3001

### Python Module Not Found

```bash
cd repos/hometownmap/scripts
pip3 install -r requirements.txt --upgrade
```

### Map Not Loading / Mapbox Token Error

1. Check `.env.local` file exists in `apps/web/`
2. Verify token starts with `pk.`
3. Restart the dev server

### No Data Showing

1. Verify demo data exists: `ls Datasets/cities/three-forks/processed/`
2. Check browser console for errors (F12)
3. Try visiting: http://localhost:3000/api/config/three-forks
4. Should return JSON config

## Development Workflow

1. **Make changes** to components in `apps/web/src/`
2. **Hot reload** automatically updates the browser
3. **Test** all 5 map modes (Resident, Business, Recreation, Services, Development)
4. **Commit** changes to git:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```

## Next Steps

1. ✅ Test the demo with sample data
2. ✅ Customize Three Forks config (`config/cities/three-forks.json`)
3. ⏳ Process real Gallatin County data
4. ⏳ Add Montana Cadastral ownership data
5. ⏳ Integrate OpenStreetMap features
6. ⏳ Perfect demo scenarios
7. ⏳ Deploy to production

## Need Help?

- **Architecture**: See `docs/architecture.md`
- **Data Processing**: See `Datasets/README.md`
- **Quick Start**: See `QUICKSTART.md`
- **Next Steps**: See `NEXT_STEPS.md`
- **Project Summary**: See `PROJECT_SUMMARY.md`
