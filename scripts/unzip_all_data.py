#!/usr/bin/env python3
"""
Unzip all raw GIS data from Gallatin County
"""

import zipfile
import os
from pathlib import Path

# Get script directory and navigate to repo root
SCRIPT_DIR = Path(__file__).parent.parent
BASE_DATA_PATH = SCRIPT_DIR / "datasets"

def unzip_all_data():
    """Unzip all ZIP files in the gallatin/raw directory"""

    raw_dir = BASE_DATA_PATH / "gallatin" / "raw"

    if not raw_dir.exists():
        print(f"❌ Error: {raw_dir} does not exist")
        return

    # Find all ZIP files
    zip_files = list(raw_dir.glob("*.zip"))

    if not zip_files:
        print(f"❌ No ZIP files found in {raw_dir}")
        return

    print(f"📦 Found {len(zip_files)} ZIP files to extract")
    print("=" * 60)

    extracted_count = 0
    failed_count = 0

    for zip_path in sorted(zip_files):
        # Clean up the name (remove numbers in parentheses)
        clean_name = zip_path.stem.replace(" (1)", "").replace(" (2)", "")

        # Create extraction directory
        extract_dir = raw_dir / f".extracted_{clean_name}"
        extract_dir.mkdir(exist_ok=True)

        try:
            print(f"\n📂 Extracting: {zip_path.name}")
            print(f"   → {extract_dir.name}")

            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # List contents
                file_list = zip_ref.namelist()
                print(f"   Files: {len(file_list)}")

                # Extract all
                zip_ref.extractall(extract_dir)

                # Show what we extracted
                for f in file_list[:3]:  # Show first 3 files
                    print(f"      - {f}")
                if len(file_list) > 3:
                    print(f"      ... and {len(file_list) - 3} more files")

            extracted_count += 1
            print(f"   ✅ Success")

        except Exception as e:
            failed_count += 1
            print(f"   ❌ Error: {e}")

    print("\n" + "=" * 60)
    print(f"✅ Extracted: {extracted_count}")
    if failed_count > 0:
        print(f"❌ Failed: {failed_count}")
    print(f"\n📁 All extracted files are in: {raw_dir}")
    print(f"   Look for directories named: .extracted_*")

    return extracted_count, failed_count


if __name__ == "__main__":
    print("🗂️  UNZIPPING ALL GALLATIN COUNTY GIS DATA")
    print("=" * 60)
    unzip_all_data()
