# Getting Started with HometownMap

## Quick Start (5 minutes)

```bash
# 1. Install Node dependencies
cd apps/web
npm install

# 2. Start the development server
npm run dev

# 3. Open browser
# Visit: http://localhost:3000
```

## What You'll See

- **Welcome Modal** - First-time user guide
- **5 Map Modes** - Resident, Business, Recreation, Services, Development
- **Search Bar** - Find addresses, owners, businesses
- **Business Directory** - Browse local businesses
- **Resource Links** - Quick links to county/state GIS

## Processing Real Data

The demo includes sample data. To process real Gallatin County data:

```bash
# 1. Unzip all raw data
cd scripts
python3 unzip_all_data.py

# 2. See what you have
python3 data_inventory.py

# 3. Process for Three Forks
python3 etl/pipeline.py --city three-forks
```

## Current Status

✅ **Working**:
- Frontend with 5 modes
- Enhanced search
- Business directory
- Resource links
- Demo data (5 parcels, 8 businesses)

⏳ **Next**:
- Process real county data (12 datasets ready!)
- Add Montana Cadastral ownership
- Integrate OpenStreetMap
- Deploy to production

## Common Issues

**Port 3000 in use?**
```bash
npm run dev -- -p 3001
```

**Map not loading?**
- Check `.env.local` has Mapbox token
- Restart dev server

## Documentation

- [SETUP.md](SETUP.md) - Complete installation guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
- [docs/architecture.md](docs/architecture.md) - Technical details

---

**Built**: January 22, 2026
**Status**: Beta v1.0 - Ready to test!
