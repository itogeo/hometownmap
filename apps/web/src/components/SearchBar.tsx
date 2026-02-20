import { useState, useEffect, useRef } from 'react'

interface SearchBarProps {
  cityId: string
  mapCenter?: [number, number]
  onResultSelect?: (result: any) => void
  className?: string
}

// Cache for local data
let cachedParcels: any[] | null = null
let cachedBusinesses: any[] | null = null

// Normalize addresses for better matching
function normalizeAddress(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/,.*$/, '') // Remove everything after comma (city, state, zip)
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\broad\b/g, 'rd')
    .replace(/\bdrive\b/g, 'dr')
    .replace(/\blane\b/g, 'ln')
    .replace(/\bcourt\b/g, 'ct')
    .replace(/\bplace\b/g, 'pl')
    .replace(/\bcircle\b/g, 'cir')
    .replace(/\bboulevard\b/g, 'blvd')
    .replace(/\bway\b/g, 'way')
    .replace(/\bnorth\b/g, 'n')
    .replace(/\bsouth\b/g, 's')
    .replace(/\beast\b/g, 'e')
    .replace(/\bwest\b/g, 'w')
    .replace(/\bnortheast\b/g, 'ne')
    .replace(/\bnorthwest\b/g, 'nw')
    .replace(/\bsoutheast\b/g, 'se')
    .replace(/\bsouthwest\b/g, 'sw')
    .replace(/\s+/g, ' ')
    .trim()
}

async function loadLocalData(cityId: string) {
  if (!cachedParcels) {
    try {
      const response = await fetch(`/data/layers/${cityId}/parcels.geojson`)
      if (response.ok) {
        const data = await response.json()
        const parcels = data.features || []
        cachedParcels = parcels
      }
    } catch (err) {
      // silently ignore parcel load failure
    }
  }

  if (!cachedBusinesses) {
    try {
      const response = await fetch(`/data/layers/${cityId}/businesses.geojson`)
      if (response.ok) {
        const data = await response.json()
        const businesses = data.features || []
        cachedBusinesses = businesses
      }
    } catch (err) {
      // silently ignore business load failure
    }
  }
}

function searchParcels(query: string): any[] {
  if (!cachedParcels) return []

  const q = query.toLowerCase()
  const qNormalized = normalizeAddress(query)
  const results: any[] = []

  for (const feature of cachedParcels) {
    const props = feature.properties || {}
    const ownerName = (props.ownername || props.OWNERNAME || '').toLowerCase()
    const address = (props.addresslin || props.ADDRESSLIN || '').toLowerCase()
    const addressNormalized = normalizeAddress(address)
    const parcelId = (props.parcelid || props.PARCELID || '').toLowerCase()

    let score = 0
    let matchType = ''

    // Exact match gets highest score
    if (ownerName === q) {
      score = 100
      matchType = 'Owner (exact)'
    } else if (ownerName.startsWith(q)) {
      score = 90
      matchType = 'Owner'
    } else if (ownerName.includes(q)) {
      score = 80
      matchType = 'Owner'
    } else if (addressNormalized.includes(qNormalized) || address.includes(q)) {
      score = 70
      matchType = 'Address'
    } else if (parcelId.includes(q)) {
      score = 60
      matchType = 'Parcel ID'
    }

    if (score > 0) {
      // Get center of geometry for navigation
      let center: [number, number] | null = null
      if (feature.geometry?.coordinates) {
        const coords = feature.geometry.coordinates
        if (feature.geometry.type === 'Polygon') {
          // Get centroid of first ring
          const ring = coords[0]
          if (ring && ring.length > 0) {
            const sumLng = ring.reduce((sum: number, c: number[]) => sum + c[0], 0)
            const sumLat = ring.reduce((sum: number, c: number[]) => sum + c[1], 0)
            center = [sumLng / ring.length, sumLat / ring.length]
          }
        } else if (feature.geometry.type === 'MultiPolygon') {
          const ring = coords[0]?.[0]
          if (ring && ring.length > 0) {
            const sumLng = ring.reduce((sum: number, c: number[]) => sum + c[0], 0)
            const sumLat = ring.reduce((sum: number, c: number[]) => sum + c[1], 0)
            center = [sumLng / ring.length, sumLat / ring.length]
          }
        }
      }

      results.push({
        type: 'parcel',
        matchType,
        name: props.ownername || props.OWNERNAME || 'Unknown Owner',
        owner_name: props.ownername || props.OWNERNAME,
        address: props.addresslin || props.ADDRESSLIN || 'No address',
        acreage: props.gisacres || props.GISACRES,
        total_value: props.totalvalue || props.TOTALVALUE,
        parcelId: props.parcelid || props.PARCELID,
        center,
        score,
      })
    }

    // Limit initial results
    if (results.length >= 50) break
  }

  return results
}

function searchBusinesses(query: string): any[] {
  if (!cachedBusinesses) return []

  const q = query.toLowerCase()
  const results: any[] = []

  for (const feature of cachedBusinesses) {
    const props = feature.properties || {}
    const name = (props.name || '').toLowerCase()
    const category = (props.category || '').toLowerCase()

    let score = 0

    if (name === q) {
      score = 100
    } else if (name.startsWith(q)) {
      score = 95
    } else if (name.includes(q)) {
      score = 85
    } else if (category.includes(q)) {
      score = 70
    }

    if (score > 0) {
      const coords = feature.geometry?.coordinates
      results.push({
        type: 'business',
        name: props.name,
        category: props.category,
        address: props.address,
        center: coords ? [coords[0], coords[1]] : null,
        score,
      })
    }

    if (results.length >= 20) break
  }

  return results
}

export default function SearchBar({ cityId, mapCenter, onResultSelect, className = '' }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  // Load local data on mount
  useEffect(() => {
    loadLocalData(cityId).then(() => setDataLoaded(true))
  }, [cityId])

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsSearching(true)

    try {
      // Search local data first (parcels and businesses)
      const parcelResults = searchParcels(searchQuery)
      const businessResults = searchBusinesses(searchQuery)

      // Search Mapbox for addresses and places
      let mapboxResults: any[] = []
      if (mapboxToken) {
        try {
          // Bias search to city area with ~40-mile bounding box around center
          const [cLng, cLat] = mapCenter || [-111.5514, 45.8925]
          const proximity = `${cLng},${cLat}`
          const bbox = `${cLng - 0.8},${cLat - 0.58},${cLng + 0.8},${cLat + 0.58}`
          const mapboxResponse = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?` +
            `access_token=${mapboxToken}&` +
            `proximity=${proximity}&` +
            `bbox=${bbox}&` +
            `types=address,poi,place&` +
            `limit=5&` +
            `country=US`
          )

          if (mapboxResponse.ok) {
            const mapboxData = await mapboxResponse.json()
            mapboxResults = (mapboxData.features || []).map((feature: any) => {
              // Check if result is within city area (higher priority)
              const [lng, lat] = feature.center
              const isLocal = lng >= cLng - 0.15 && lng <= cLng + 0.15 && lat >= cLat - 0.1 && lat <= cLat + 0.1
              const placeContext = feature.context?.find((c: any) => c.id?.startsWith('place.'))

              return {
                type: feature.place_type?.[0] === 'poi' ? 'place' : 'address',
                name: feature.text,
                address: feature.place_name,
                category: feature.properties?.category,
                center: feature.center,
                score: isLocal ? 80 : 50,
                isLocal,
                city: placeContext?.text,
              }
            })
          }
        } catch (err) {
          // silently ignore geocoding failure
        }
      }

      // Combine and sort results by score
      const allResults = [...parcelResults, ...businessResults, ...mapboxResults]
        .sort((a, b) => b.score - a.score)
        .slice(0, 15)

      setResults(allResults)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  const debouncedSearch = (searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      handleSearch(searchQuery)
    }, 200)
  }

  const selectResult = (result: any) => {
    setQuery(result.address || result.name || result.owner_name || '')
    setResults([])

    if (onResultSelect) {
      onResultSelect(result)
    }
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'parcel':
        return (
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        )
      case 'business':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )
      case 'address':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      case 'place':
        return (
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )
    }
  }

  const getResultLabel = (result: any) => {
    if (result.type === 'parcel') {
      return result.matchType || 'Property'
    }
    if (result.type === 'business') {
      return 'Business'
    }
    if (result.isLocal) {
      return 'Local'
    }
    return result.type === 'place' ? 'Place' : 'Address'
  }

  return (
    <div className={`relative ${className || 'w-full sm:w-80'}`}>
      <div className="relative">
        <div className="absolute left-3 top-2.5 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            debouncedSearch(e.target.value)
          }}
          placeholder="Search address, owner, business..."
          className="w-full pl-10 pr-10 py-2.5 border border-civic-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-civic-blue-500 focus:border-transparent
                     text-sm placeholder:text-gray-400"
          aria-label="Search for addresses, property owners, or businesses"
        />

        {isSearching && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-civic-blue-600"></div>
          </div>
        )}

        {!isSearching && query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
            }}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 p-0.5"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-xl border border-civic-gray-200 max-h-96 overflow-y-auto z-[9999]">
          <div className="px-3 py-2 text-xs text-civic-gray-500 bg-civic-gray-50 border-b flex items-center justify-between">
            <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
            <span className="text-civic-gray-400">Press Enter or click to select</span>
          </div>
          {results.map((result, index) => (
            <button
              key={index}
              className="w-full px-4 py-3 text-left hover:bg-civic-blue-50 border-b border-civic-gray-100 last:border-b-0 transition-colors"
              onClick={() => selectResult(result)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {getResultIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 truncate">
                      {result.type === 'parcel' ? (result.owner_name || 'Unknown Owner') : result.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded flex-shrink-0">
                      {getResultLabel(result)}
                    </span>
                  </div>
                  {result.type === 'parcel' && (
                    <>
                      {result.address && result.address !== 'No address' && (
                        <div className="text-sm text-gray-600 truncate mt-0.5">
                          {result.address}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                        {result.acreage && (
                          <span>{Number(result.acreage).toFixed(2)} acres</span>
                        )}
                        {result.total_value && (
                          <span>Value: ${Number(result.total_value).toLocaleString()}</span>
                        )}
                      </div>
                    </>
                  )}
                  {result.type === 'business' && (
                    <>
                      {result.category && (
                        <div className="text-xs text-blue-600 font-medium mt-0.5">
                          {result.category}
                        </div>
                      )}
                      {result.address && (
                        <div className="text-sm text-gray-600 truncate">{result.address}</div>
                      )}
                    </>
                  )}
                  {(result.type === 'address' || result.type === 'place') && (
                    <>
                      {result.address && (
                        <div className="text-sm text-gray-600 truncate mt-0.5">
                          {result.address}
                        </div>
                      )}
                      {result.category && (
                        <div className="text-xs text-purple-600 font-medium mt-1">
                          {result.category}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {query.length >= 2 && results.length === 0 && !isSearching && (
        <div className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-xl border border-civic-gray-200 p-4 z-[9999]">
          <div className="text-center text-gray-500 text-sm">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            No results found for "{query}"
            <div className="text-xs text-gray-400 mt-1">
              Try searching for an owner name, address, or business
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
