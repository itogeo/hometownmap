#!/usr/bin/env node
/**
 * Script to update Three Forks businesses with geocoded coordinates
 * Run with: node scripts/update-businesses.js
 */

const fs = require('fs');
const path = require('path');

// Mapbox token from environment
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN;

// Three Forks businesses compiled from research
const businesses = [
  // Restaurants & Bars
  {
    name: "Sacajawea Hotel",
    category: "Hotel & Restaurant",
    address: "5 N Main St, Three Forks, MT 59752",
    phone: "(406) 285-6515",
    website: "https://sacajaweahotel.com"
  },
  {
    name: "Pompey's Grill",
    category: "Restaurant",
    address: "5 N Main St, Three Forks, MT 59752",
    phone: "(406) 285-6515",
    website: "https://sacajaweahotel.com/pompeys-grill"
  },
  {
    name: "Sac Bar",
    category: "Bar",
    address: "5 N Main St, Three Forks, MT 59752",
    phone: "(406) 285-6515",
    website: "https://sacajaweahotel.com/sac-bar"
  },
  {
    name: "Three Forks Cafe",
    category: "Restaurant",
    address: "105 Main St, Three Forks, MT 59752",
    phone: "(406) 285-4780",
    website: "https://www.threeforkscafe.com"
  },
  {
    name: "Iron Horse Cafe & Pie Shop",
    category: "Restaurant",
    address: "24 N Main St, Three Forks, MT 59752",
    phone: "(406) 285-3698",
    website: null
  },
  {
    name: "Peking China Restaurant",
    category: "Restaurant",
    address: "10 N Main St, Three Forks, MT 59752",
    phone: "(406) 285-3288",
    website: null
  },
  {
    name: "Wheat Montana Bakery & Deli",
    category: "Restaurant",
    address: "10778 US Highway 287, Three Forks, MT 59752",
    phone: "(406) 285-3614",
    website: "https://wheatmontana.com"
  },
  {
    name: "Land of Magic Dinner Club",
    category: "Restaurant",
    address: "7 E Birch St, Three Forks, MT 59752",
    phone: "(406) 285-4944",
    website: null
  },
  {
    name: "Stageline Pizza",
    category: "Restaurant",
    address: "108 S Main St, Three Forks, MT 59752",
    phone: "(406) 285-4455",
    website: null
  },

  // Retail & Services
  {
    name: "Main Street Office",
    category: "Business Services",
    address: "209 S Main St, Three Forks, MT 59752",
    phone: "(406) 285-4556",
    website: "https://www.mainstreetoffice.com"
  },
  {
    name: "Three Forks Hardware",
    category: "Retail",
    address: "115 Main St, Three Forks, MT 59752",
    phone: "(406) 285-3367",
    website: null
  },
  {
    name: "Three Forks Thrift Store",
    category: "Retail",
    address: "110 W Cedar St, Three Forks, MT 59752",
    phone: null,
    website: null
  },
  {
    name: "Opportunity Bank",
    category: "Bank",
    address: "106 Main St, Three Forks, MT 59752",
    phone: "(406) 285-3246",
    website: "https://www.prior.bank"
  },

  // Professional Services
  {
    name: "Three Forks Veterinary Clinic",
    category: "Veterinary",
    address: "321 Milwaukee Ave, Three Forks, MT 59752",
    phone: "(406) 285-4911",
    website: null
  },
  {
    name: "Venture West Realty",
    category: "Real Estate",
    address: "112 Main St, Three Forks, MT 59752",
    phone: "(406) 285-0505",
    website: null
  },

  // Public Services & Attractions
  {
    name: "Three Forks Community Library",
    category: "Library",
    address: "207 Milwaukee Ave, Three Forks, MT 59752",
    phone: "(406) 285-3747",
    website: null
  },
  {
    name: "Headwaters Heritage Museum",
    category: "Museum",
    address: "202 S Main St, Three Forks, MT 59752",
    phone: "(406) 285-4778",
    website: null
  },
  {
    name: "Three Forks City Hall",
    category: "Government",
    address: "206 S Main St, Three Forks, MT 59752",
    phone: "(406) 285-3431",
    website: "https://threeforksmontana.us"
  },
  {
    name: "Three Forks Post Office",
    category: "Government",
    address: "120 E Cedar St, Three Forks, MT 59752",
    phone: "(406) 285-3253",
    website: null
  },
  {
    name: "Three Forks Fire Department",
    category: "Emergency Services",
    address: "215 S Main St, Three Forks, MT 59752",
    phone: "(406) 285-3733",
    website: null
  },

  // Recreation & Wellness
  {
    name: "Madison Buffalo Jump State Park",
    category: "State Park",
    address: "6990 Buffalo Jump Rd, Three Forks, MT 59752",
    phone: "(406) 285-3610",
    website: null
  },
  {
    name: "Missouri Headwaters State Park",
    category: "State Park",
    address: "1585 Trident Rd, Three Forks, MT 59752",
    phone: "(406) 285-3610",
    website: null
  },
  {
    name: "Three Forks Golf Course",
    category: "Golf",
    address: "907 Golf Course Rd, Three Forks, MT 59752",
    phone: "(406) 285-3703",
    website: null
  },

  // Lodging
  {
    name: "Broken Spur Motel",
    category: "Lodging",
    address: "124 W Elm St, Three Forks, MT 59752",
    phone: "(406) 285-3237",
    website: null
  },
  {
    name: "Fort Three Forks Motel",
    category: "Lodging",
    address: "10776 US Highway 287, Three Forks, MT 59752",
    phone: "(406) 285-3233",
    website: null
  },

  // Industrial
  {
    name: "Montana Black Gold Dog Food",
    category: "Manufacturing",
    address: "800 Jefferson St N, Three Forks, MT 59752",
    phone: "(406) 285-3300",
    website: null
  },
  {
    name: "Imerys Talc",
    category: "Mining",
    address: "Three Forks, MT 59752",
    phone: null,
    website: null
  },

  // Gas Stations
  {
    name: "Town Pump",
    category: "Gas Station",
    address: "10777 US Highway 287, Three Forks, MT 59752",
    phone: null,
    website: "https://townpump.com"
  },
  {
    name: "Cenex",
    category: "Gas Station",
    address: "123 S Main St, Three Forks, MT 59752",
    phone: null,
    website: null
  }
];

async function geocodeAddress(address) {
  if (!MAPBOX_TOKEN) {
    console.error('No Mapbox token found. Set NEXT_PUBLIC_MAPBOX_TOKEN or MAPBOX_TOKEN');
    return null;
  }

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      return data.features[0].center; // [lng, lat]
    }
    return null;
  } catch (err) {
    console.error(`Failed to geocode ${address}:`, err.message);
    return null;
  }
}

async function main() {
  console.log('🏢 Updating Three Forks businesses...\n');

  const features = [];

  for (const biz of businesses) {
    process.stdout.write(`Geocoding: ${biz.name}... `);

    const coords = await geocodeAddress(biz.address);

    if (coords) {
      console.log(`✓ [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]`);
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: coords
        },
        properties: {
          name: biz.name,
          category: biz.category,
          address: biz.address,
          phone: biz.phone,
          website: biz.website
        }
      });
    } else {
      console.log('✗ Could not geocode');
    }

    // Rate limit - 10 requests per second max
    await new Promise(r => setTimeout(r, 150));
  }

  const geojson = {
    type: "FeatureCollection",
    features: features
  };

  const outputPath = path.join(__dirname, '../datasets/cities/three-forks/processed/businesses.geojson');
  fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));

  console.log(`\n✅ Saved ${features.length} businesses to ${outputPath}`);
}

main().catch(console.error);
