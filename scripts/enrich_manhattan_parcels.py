#!/usr/bin/env python3
"""
Enrich Manhattan parcels.geojson with ownership data from Montana Cadastral.

Downloads ownership data from MSDI_Framework/Parcels MapServer on gisservicemt.gov
and joins it to the Manhattan parcels GeoJSON by GEOCODE/PARCELID.

Data source: Montana State Library MSDI Framework Parcels
URL: https://gisservicemt.gov/arcgis/rest/services/MSDI_Framework/Parcels/MapServer/0
"""

import json
import urllib.request
import urllib.parse
import time
import sys
import os
from pathlib import Path
from datetime import datetime

# Configuration
SERVICE_URL = "https://gisservicemt.gov/arcgis/rest/services/MSDI_Framework/Parcels/MapServer/0/query"
BATCH_SIZE = 100  # Number of PARCELIDs per query (IN clause limit)
MAX_RECORD_COUNT = 2000  # Server max
COUNTY_NAME = "Gallatin"

# Fields to fetch from the cadastral service
CADASTRAL_FIELDS = [
    "PARCELID",
    "OwnerName",
    "OwnerAddress1",
    "OwnerAddress2",
    "OwnerAddress3",
    "OwnerCity",
    "OwnerState",
    "OwnerZipCode",
    "CareOfTaxpayer",
    "AddressLine1",
    "AddressLine2",
    "CityStateZip",
    "PropType",
    "PropAccess",
    "LevyDistrict",
    "TotalValue",
    "TotalLandValue",
    "TotalBuildingValue",
    "GISAcres",
    "TotalAcres",
    "TaxYear",
    "PropertyID",
    "AssessmentCode",
    "LegalDescriptionShort",
    "Subdivision",
    "CertificateOfSurvey",
    "ContinuousCropAcres",
    "FallowAcres",
    "FarmsiteAcres",
    "ForestAcres",
    "GrazingAcres",
    "WildHayAcres",
    "IrrigatedAcres",
    "NonQualAcres",
]

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)

def query_parcels_by_ids(parcel_ids):
    """Query the MSDI Parcels service for a batch of PARCELID values."""
    # Build IN clause
    id_list = ",".join(f"'{pid}'" for pid in parcel_ids)
    where = f"PARCELID IN ({id_list})"
    
    params = {
        "where": where,
        "outFields": ",".join(CADASTRAL_FIELDS),
        "returnGeometry": "false",
        "f": "json",
        "resultRecordCount": MAX_RECORD_COUNT,
    }
    
    url = f"{SERVICE_URL}?{urllib.parse.urlencode(params)}"
    
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        
        if "error" in data:
            log(f"  API Error: {data['error']}")
            return {}
        
        features = data.get("features", [])
        result = {}
        for feat in features:
            attrs = feat["attributes"]
            pid = attrs.get("PARCELID")
            if pid:
                result[pid] = attrs
        return result
    
    except Exception as e:
        log(f"  Request failed: {e}")
        return {}

def query_parcels_by_bbox(xmin, ymin, xmax, ymax, offset=0):
    """Query the MSDI Parcels service using a bounding box (fallback for unmatched)."""
    params = {
        "where": f"CountyName='{COUNTY_NAME}'",
        "outFields": ",".join(CADASTRAL_FIELDS),
        "returnGeometry": "false",
        "f": "json",
        "geometry": f"{xmin},{ymin},{xmax},{ymax}",
        "geometryType": "esriGeometryEnvelope",
        "inSR": "4326",
        "spatialRel": "esriSpatialRelIntersects",
        "resultRecordCount": MAX_RECORD_COUNT,
        "resultOffset": offset,
    }
    
    url = f"{SERVICE_URL}?{urllib.parse.urlencode(params)}"
    
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        
        if "error" in data:
            log(f"  API Error: {data['error']}")
            return {}
        
        features = data.get("features", [])
        result = {}
        for feat in features:
            attrs = feat["attributes"]
            pid = attrs.get("PARCELID")
            if pid:
                result[pid] = attrs
        return result
    
    except Exception as e:
        log(f"  Request failed: {e}")
        return {}


def main():
    # Paths
    base_dir = Path(__file__).parent.parent
    
    # Try multiple possible paths for the Manhattan parcels
    manhattan_paths = [
        base_dir / "apps" / "web" / "public" / "data" / "layers" / "manhattan" / "parcels.geojson",
        base_dir / "datasets" / "cities" / "manhattan" / "processed" / "parcels.geojson",
        base_dir / "data" / "manhattan" / "parcels.geojson",
    ]
    
    parcels_path = None
    for p in manhattan_paths:
        if p.exists():
            parcels_path = p
            break
    
    if not parcels_path:
        log("ERROR: Cannot find Manhattan parcels.geojson")
        log("Searched:")
        for p in manhattan_paths:
            log(f"  {p}")
        sys.exit(1)
    
    log(f"Loading parcels from: {parcels_path}")
    with open(parcels_path) as f:
        geojson = json.load(f)
    
    features = geojson["features"]
    log(f"Loaded {len(features)} parcel features")
    
    # Collect unique GEOCODEs
    geocode_to_indices = {}
    for i, feat in enumerate(features):
        gc = feat["properties"].get("GEOCODE")
        if gc:
            if gc not in geocode_to_indices:
                geocode_to_indices[gc] = []
            geocode_to_indices[gc].append(i)
    
    unique_geocodes = list(geocode_to_indices.keys())
    log(f"Unique GEOCODEs: {len(unique_geocodes)}")
    
    # Download cadastral data in batches
    log(f"Downloading ownership data from MSDI Framework Parcels service...")
    log(f"Service URL: {SERVICE_URL}")
    log(f"Batch size: {BATCH_SIZE}")
    
    cadastral_data = {}
    total_batches = (len(unique_geocodes) + BATCH_SIZE - 1) // BATCH_SIZE
    
    for batch_num in range(total_batches):
        start = batch_num * BATCH_SIZE
        end = min(start + BATCH_SIZE, len(unique_geocodes))
        batch_ids = unique_geocodes[start:end]
        
        if batch_num % 10 == 0 or batch_num == total_batches - 1:
            log(f"  Batch {batch_num + 1}/{total_batches} ({len(cadastral_data)} records so far)")
        
        result = query_parcels_by_ids(batch_ids)
        cadastral_data.update(result)
        
        # Be respectful - small delay between requests
        if batch_num < total_batches - 1:
            time.sleep(0.3)
    
    log(f"Downloaded {len(cadastral_data)} cadastral records")
    
    # Calculate match rate
    matched = sum(1 for gc in unique_geocodes if gc in cadastral_data)
    match_pct = (matched / len(unique_geocodes)) * 100 if unique_geocodes else 0
    log(f"Matched: {matched}/{len(unique_geocodes)} unique GEOCODEs ({match_pct:.1f}%)")
    
    # Enrich features
    log("Enriching parcel features with ownership data...")
    
    enriched_count = 0
    fields_added = set()
    
    for gc, indices in geocode_to_indices.items():
        if gc in cadastral_data:
            attrs = cadastral_data[gc]
            for idx in indices:
                props = features[idx]["properties"]
                
                # Add cadastral fields (skip PARCELID since we already have GEOCODE)
                for field in CADASTRAL_FIELDS:
                    if field == "PARCELID":
                        continue
                    value = attrs.get(field)
                    if value is not None:
                        # Use lowercase field names for consistency
                        field_lower = field.lower() if field != "PARCELID" else field
                        props[field_lower] = value
                        fields_added.add(field_lower)
                
                enriched_count += 1
    
    log(f"Enriched {enriched_count}/{len(features)} features ({enriched_count/len(features)*100:.1f}%)")
    log(f"Fields added: {sorted(fields_added)}")
    
    # Show sample enriched records
    log("\nSample enriched parcels:")
    samples_shown = 0
    for feat in features:
        props = feat["properties"]
        if props.get("ownername"):
            log(f"  {props['ownername']}")
            if props.get("addressline1"):
                log(f"    Property: {props['addressline1']}, {props.get('citystatezip', '')}")
            if props.get("owneraddress1"):
                log(f"    Owner: {props['owneraddress1']}, {props.get('ownercity', '')} {props.get('ownerstate', '')} {props.get('ownerzipcode', '')}")
            if props.get("totalvalue"):
                log(f"    Value: ${props['totalvalue']:,} (Land: ${props.get('totallandvalue', 0):,}, Bldg: ${props.get('totalbuildingvalue', 0):,})")
            if props.get("proptype"):
                log(f"    Type: {props['proptype']}")
            samples_shown += 1
            if samples_shown >= 5:
                break
    
    # Save enriched GeoJSON
    output_path = parcels_path.parent / "parcels_enriched.geojson"
    log(f"\nSaving enriched parcels to: {output_path}")
    
    with open(output_path, "w") as f:
        json.dump(geojson, f)
    
    file_size = os.path.getsize(output_path)
    log(f"Saved: {file_size / 1024 / 1024:.1f} MB")
    
    # Also save a backup of the original
    backup_path = parcels_path.parent / "parcels_original.geojson"
    if not backup_path.exists():
        import shutil
        shutil.copy(parcels_path, backup_path)
        log(f"Backed up original to: {backup_path}")
    
    # Replace the original with enriched version
    with open(parcels_path, "w") as f:
        json.dump(geojson, f)
    log(f"Updated original parcels.geojson with enriched data")
    
    # Also save just the cadastral data as a JSON lookup table
    lookup_path = parcels_path.parent / "cadastral_lookup.json"
    with open(lookup_path, "w") as f:
        json.dump(cadastral_data, f, indent=2)
    log(f"Saved cadastral lookup table to: {lookup_path}")
    
    # Summary
    log(f"\n{'='*60}")
    log("ENRICHMENT COMPLETE")
    log(f"{'='*60}")
    log(f"Total features:     {len(features)}")
    log(f"Unique GEOCODEs:    {len(unique_geocodes)}")
    log(f"Matched GEOCODEs:   {matched} ({match_pct:.1f}%)")
    log(f"Enriched features:  {enriched_count}")
    log(f"Fields added:       {len(fields_added)}")
    log(f"Output file:        {output_path}")
    
    # Stats on property values
    values = [cadastral_data[gc].get("TotalValue", 0) for gc in cadastral_data if cadastral_data[gc].get("TotalValue")]
    if values:
        log(f"\nProperty Value Stats:")
        log(f"  Count:   {len(values)}")
        log(f"  Min:     ${min(values):,}")
        log(f"  Max:     ${max(values):,}")
        log(f"  Median:  ${sorted(values)[len(values)//2]:,}")
        log(f"  Total:   ${sum(values):,}")
    
    # Stats on property types
    prop_types = {}
    for gc in cadastral_data:
        pt = cadastral_data[gc].get("PropType", "Unknown")
        prop_types[pt] = prop_types.get(pt, 0) + 1
    if prop_types:
        log(f"\nProperty Types:")
        for pt, count in sorted(prop_types.items(), key=lambda x: -x[1]):
            log(f"  {pt}: {count}")


if __name__ == "__main__":
    main()
