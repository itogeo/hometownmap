# Three Forks - HometownMap

**County**: Gallatin
**State**: Montana
**Status**: In Development

---

## Data Layers

### Current Status

| Layer | Status | Source | Last Updated |
|-------|--------|--------|--------------|
| Parcels | ⏳ Pending | Gallatin County GIS | - |
| Zoning | ⏳ Pending | Gallatin County GIS | - |
| City Boundary | ⏳ Pending | Gallatin County GIS | - |
| Buildings | ⏳ Pending | Microsoft Footprints | - |
| Streets | ⏳ Pending | OpenStreetMap | - |
| Parks | ⏳ Pending | City of Three Forks | - |

---

## Processing Steps

### 1. Run ETL Pipeline

```bash
cd /repos/hometownmap/scripts
python etl/pipeline.py --city three-forks
```

### 2. Update Configuration

Edit `/repos/hometownmap/config/cities/three-forks.json`:
- Update map center coordinates
- Add demographics
- Configure layer styling
- Set branding (logo, colors)

### 3. Start Development Server

```bash
cd /repos/hometownmap/apps/web
npm run dev -- --city three-forks
```

---

## Map Modes

### 🏠 Resident Mode
- Property boundaries
- Zoning information
- School districts
- Search by address

### 🏢 Business/Economic Development Mode
- Available properties
- Commercial zoning
- Building footprints
- Demographics

### 🏞️ Parks & Recreation Mode
- Parks and facilities
- Trails
- Public spaces

### 🏛️ City Services Mode
- Government offices
- Utility service areas
- Fire/police districts

### 🏗️ Development & Planning Mode
- Zoning regulations
- Building permits
- Subdivisions
- Capital projects

---

## Demo Scenarios

### Scenario 1: Resident Property Lookup
**Use Case**: Resident wants to know zoning of neighbor's property

**Steps**:
1. Search address
2. Click parcel
3. View zoning and ownership info

**Time**: 15 seconds

### Scenario 2: Economic Development
**Use Case**: Business looking for commercial property

**Steps**:
1. Switch to Business mode
2. Filter: Commercial zoning + 2+ acres
3. View available properties
4. Contact city with inquiries

**Time**: 30 seconds

---

## City-Specific Notes

*(Add any special requirements, data quirks, or customizations here)*

---

**Created**: 1769103921.1915355
**Template Version**: 1.0.0
