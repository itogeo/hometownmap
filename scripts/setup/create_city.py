"""
Create City Setup Script

Scaffolds directory structure and configuration for a new city.
"""

import json
from pathlib import Path
import click
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

SCRIPT_DIR = Path(__file__).parent.parent.parent  # Go up to repo root
BASE_DATA_PATH = SCRIPT_DIR / "Datasets"
BASE_REPO_PATH = SCRIPT_DIR


def create_city_directories(city: str) -> Path:
    """Create directory structure for a new city."""
    city_path = BASE_DATA_PATH / "cities" / city

    directories = [
        city_path / "raw",
        city_path / "processed",
        city_path / "final"
    ]

    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
        logger.info(f"Created {directory}")

    return city_path


def create_city_config(city: str, county: str, display_name: str) -> Path:
    """Create city configuration file."""
    config = {
        "id": city,
        "name": display_name,
        "county": county,
        "state": "montana",
        "map": {
            "center": [-111.545, 45.893],  # Will be updated after data processing
            "zoom": 13,
            "bounds": None  # Will be calculated from city boundary
        },
        "modes": {
            "resident": {
                "enabled": True,
                "layers": ["parcels", "city_boundary", "zoning", "schools", "voting_precincts"],
                "features": ["search_address", "parcel_info", "zoning_lookup"]
            },
            "business": {
                "enabled": True,
                "layers": ["parcels", "zoning", "buildings", "available_properties"],
                "features": ["search_properties", "filter_by_zoning", "filter_by_size", "demographics"]
            },
            "recreation": {
                "enabled": True,
                "layers": ["parks", "trails", "facilities", "waterways"],
                "features": ["facility_info", "amenity_search"]
            },
            "services": {
                "enabled": True,
                "layers": ["government_buildings", "utilities", "fire_districts", "trash_zones"],
                "features": ["office_hours", "contact_info", "service_areas"]
            },
            "development": {
                "enabled": True,
                "layers": ["parcels", "zoning", "subdivisions", "floodplains", "permits"],
                "features": ["permit_search", "zoning_regulations", "capital_projects"]
            }
        },
        "layers": {
            "parcels": {
                "source": "county",
                "display_name": "Property Parcels",
                "style": {
                    "fill": "#3388ff",
                    "fill-opacity": 0.2,
                    "stroke": "#3388ff",
                    "stroke-width": 1
                },
                "popup_fields": ["owner_name", "address", "acres", "zoning", "assessed_value"]
            },
            "zoning": {
                "source": "county",
                "display_name": "Zoning Districts",
                "style_by_field": "zone_code",
                "styles": {
                    "R1": {"fill": "#FFD700", "name": "Residential Low Density"},
                    "R2": {"fill": "#FFA500", "name": "Residential Medium Density"},
                    "C1": {"fill": "#FF6347", "name": "Commercial"},
                    "I1": {"fill": "#A9A9A9", "name": "Industrial"},
                    "AG": {"fill": "#90EE90", "name": "Agricultural"}
                }
            },
            "buildings": {
                "source": "microsoft",
                "display_name": "Building Footprints",
                "style": {
                    "fill": "#888888",
                    "fill-opacity": 0.5,
                    "stroke": "#333333"
                }
            },
            "city_boundary": {
                "source": "county",
                "display_name": f"{display_name} City Limits",
                "style": {
                    "stroke": "#FF0000",
                    "stroke-width": 3,
                    "fill": "none"
                }
            }
        },
        "branding": {
            "logo": None,
            "primary_color": "#3388ff",
            "secondary_color": "#ffffff",
            "title": f"{display_name} Interactive Map"
        },
        "contact": {
            "city_hall": None,
            "phone": None,
            "email": None,
            "website": None
        },
        "demographics": {
            "population": None,
            "median_income": None,
            "median_age": None,
            "growth_rate": None
        }
    }

    config_path = BASE_REPO_PATH / "config" / "cities" / f"{city}.json"
    config_path.parent.mkdir(parents=True, exist_ok=True)

    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)

    logger.info(f"Created config: {config_path}")

    return config_path


def create_city_readme(city: str, display_name: str, county: str) -> Path:
    """Create city-specific README."""
    readme_content = f"""# {display_name} - HometownMap

**County**: {county.title()}
**State**: Montana
**Status**: In Development

---

## Data Layers

### Current Status

| Layer | Status | Source | Last Updated |
|-------|--------|--------|--------------|
| Parcels | ⏳ Pending | {county.title()} County GIS | - |
| Zoning | ⏳ Pending | {county.title()} County GIS | - |
| City Boundary | ⏳ Pending | {county.title()} County GIS | - |
| Buildings | ⏳ Pending | Microsoft Footprints | - |
| Streets | ⏳ Pending | OpenStreetMap | - |
| Parks | ⏳ Pending | City of {display_name} | - |

---

## Processing Steps

### 1. Run ETL Pipeline

```bash
cd /repos/hometownmap/scripts
python etl/pipeline.py --city {city}
```

### 2. Update Configuration

Edit `/repos/hometownmap/config/cities/{city}.json`:
- Update map center coordinates
- Add demographics
- Configure layer styling
- Set branding (logo, colors)

### 3. Start Development Server

```bash
cd /repos/hometownmap/apps/web
npm run dev -- --city {city}
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

**Created**: {Path(__file__).stat().st_mtime}
**Template Version**: 1.0.0
"""

    readme_path = BASE_DATA_PATH / "cities" / city / "README.md"

    with open(readme_path, 'w') as f:
        f.write(readme_content)

    logger.info(f"Created README: {readme_path}")

    return readme_path


@click.command()
@click.option('--name', required=True, help='City name (lowercase, hyphens for spaces)')
@click.option('--display-name', default=None, help='Display name (e.g., "Three Forks")')
@click.option('--county', default='gallatin', help='County name')
def main(name: str, display_name: str, county: str):
    """
    Create scaffolding for a new city.

    This creates:
    - Directory structure in /Datasets/hometownmap/cities/{name}/
    - Configuration file in /repos/hometownmap/config/cities/{name}.json
    - City-specific README

    Examples:
        python create_city.py --name three-forks --display-name "Three Forks"
        python create_city.py --name belgrade --display-name "Belgrade" --county gallatin
    """
    if display_name is None:
        display_name = name.replace('-', ' ').title()

    logger.info(f"{'='*60}")
    logger.info(f"Creating city: {display_name} ({name})")
    logger.info(f"County: {county.title()}")
    logger.info(f"{'='*60}\n")

    # Create directories
    city_path = create_city_directories(name)

    # Create configuration
    config_path = create_city_config(name, county, display_name)

    # Create README
    readme_path = create_city_readme(name, display_name, county)

    logger.info(f"\n{'='*60}")
    logger.info(f"✓ City created successfully!")
    logger.info(f"{'='*60}")
    logger.info(f"Data directory: {city_path}")
    logger.info(f"Config file: {config_path}")
    logger.info(f"README: {readme_path}")
    logger.info(f"\nNext steps:")
    logger.info(f"1. Run ETL pipeline: python etl/pipeline.py --city {name}")
    logger.info(f"2. Update config: {config_path}")
    logger.info(f"3. Start frontend: cd apps/web && npm run dev")
    logger.info(f"{'='*60}\n")


if __name__ == "__main__":
    main()
