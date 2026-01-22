#!/usr/bin/env python3
"""
Create an inventory of all available GIS data
Shows what datasets we have and their properties
"""

import os
from pathlib import Path
import json

# Get script directory and navigate to repo root
SCRIPT_DIR = Path(__file__).parent.parent
BASE_DATA_PATH = SCRIPT_DIR / "datasets"


def get_file_size(path):
    """Get human-readable file size"""
    size = path.stat().st_size
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} TB"


def analyze_extracted_data():
    """Analyze extracted data and create inventory"""

    raw_dir = BASE_DATA_PATH / "gallatin" / "raw"

    if not raw_dir.exists():
        print(f"❌ Error: {raw_dir} does not exist")
        return

    # Find all extracted directories
    extracted_dirs = [d for d in raw_dir.iterdir() if d.is_dir() and d.name.startswith(".extracted_")]

    if not extracted_dirs:
        print("❌ No extracted data found. Run unzip_all_data.py first!")
        return

    print("📊 DATA INVENTORY")
    print("=" * 80)

    inventory = {}

    for extract_dir in sorted(extracted_dirs):
        dataset_name = extract_dir.name.replace(".extracted_", "")

        print(f"\n📁 {dataset_name}")
        print("-" * 80)

        # Find shapefiles
        shapefiles = list(extract_dir.glob("**/*.shp"))

        if not shapefiles:
            print("   ⚠️  No shapefiles found")
            continue

        dataset_info = {
            "name": dataset_name,
            "shapefiles": [],
            "total_files": len(list(extract_dir.rglob("*.*")))
        }

        for shp in shapefiles:
            # Get associated files
            base_name = shp.stem
            dbf = shp.with_suffix('.dbf')
            prj = shp.with_suffix('.prj')
            shx = shp.with_suffix('.shx')

            has_complete_set = all([dbf.exists(), prj.exists(), shx.exists()])

            shp_info = {
                "name": shp.name,
                "size": get_file_size(shp),
                "complete": has_complete_set,
                "path": str(shp.relative_to(raw_dir))
            }

            dataset_info["shapefiles"].append(shp_info)

            # Print info
            status = "✅" if has_complete_set else "⚠️ "
            print(f"   {status} {shp.name} ({get_file_size(shp)})")

            if not has_complete_set:
                missing = []
                if not dbf.exists():
                    missing.append(".dbf")
                if not prj.exists():
                    missing.append(".prj")
                if not shx.exists():
                    missing.append(".shx")
                print(f"      Missing: {', '.join(missing)}")

        inventory[dataset_name] = dataset_info

    # Summary
    print("\n" + "=" * 80)
    print("📋 SUMMARY")
    print("=" * 80)
    print(f"Total datasets: {len(inventory)}")
    total_shapefiles = sum(len(info["shapefiles"]) for info in inventory.values())
    print(f"Total shapefiles: {total_shapefiles}")

    complete_count = sum(
        1 for info in inventory.values()
        for shp in info["shapefiles"]
        if shp["complete"]
    )
    print(f"Complete shapefiles: {complete_count}/{total_shapefiles}")

    # Save inventory to JSON
    inventory_file = SCRIPT_DIR / "data_inventory.json"
    with open(inventory_file, 'w') as f:
        json.dump(inventory, f, indent=2)

    print(f"\n💾 Inventory saved to: {inventory_file}")

    # Print recommendations
    print("\n" + "=" * 80)
    print("💡 NEXT STEPS")
    print("=" * 80)
    print("1. Ready to process datasets:")
    for name in sorted(inventory.keys()):
        if any(shp["complete"] for shp in inventory[name]["shapefiles"]):
            print(f"   ✅ {name}")

    print("\n2. Run the ETL pipeline:")
    print("   cd scripts")
    print("   python etl/pipeline.py --city three-forks")

    return inventory


if __name__ == "__main__":
    analyze_extracted_data()
