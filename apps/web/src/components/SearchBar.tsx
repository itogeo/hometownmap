import { useState, useEffect, useRef } from 'react'

interface SearchBarProps {
  cityId: string
  onResultSelect?: (result: any) => void
}

export default function SearchBar({ cityId, onResultSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsSearching(true)

    try {
      // Search Mapbox for addresses, businesses, parks (geocoding)
      let mapboxResults: any[] = []
      if (mapboxToken) {
        try {
          // Bias search to Three Forks, MT area
          const proximity = '-111.5514,45.8925'
          const mapboxResponse = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?` +
            `access_token=${mapboxToken}&` +
            `proximity=${proximity}&` +
            `types=address,poi,place&` +
            `limit=10&` +
            `country=US`
          )

          if (mapboxResponse.ok) {
            const mapboxData = await mapboxResponse.json()
            mapboxResults = (mapboxData.features || []).map((feature: any) => ({
              type: feature.place_type?.[0] === 'poi' ? 'place' : 'address',
              name: feature.text,
              address: feature.place_name,
              category: feature.properties?.category,
              center: feature.center,
              score: 75,
            }))
          }
        } catch (err) {
          console.log('Mapbox geocoding failed:', err)
        }
      }

      setResults(mapboxResults.slice(0, 15))
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
        return '🏠'
      case 'business':
        return '🏢'
      case 'address':
        return '📍'
      case 'place':
        return '🏛️'
      default:
        return '📍'
    }
  }

  return (
    <div className="relative w-80">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            debouncedSearch(e.target.value)
          }}
          placeholder="Search address, owner, business..."
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {isSearching && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!isSearching && query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
            }}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-[9999]">
          <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </div>
          {results.map((result, index) => (
            <button
              key={index}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
              onClick={() => selectResult(result)}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{getResultIcon(result.type)}</span>
                <div className="flex-1 min-w-0">
                  {result.type === 'parcel' && (
                    <>
                      <div className="font-medium text-gray-800 truncate">
                        {result.owner_name || 'Unknown Owner'}
                      </div>
                      {result.address && result.address !== 'No address' && (
                        <div className="text-sm text-gray-600 truncate">
                          {result.address}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                        {result.acreage && (
                          <span>{Number(result.acreage).toFixed(2)} acres</span>
                        )}
                        {result.total_value && (
                          <span>• ${Number(result.total_value).toLocaleString()}</span>
                        )}
                        {result.zoning && <span>• {result.zoning}</span>}
                      </div>
                    </>
                  )}
                  {result.type === 'business' && (
                    <>
                      <div className="font-medium text-gray-800">
                        {result.name}
                      </div>
                      {result.category && (
                        <div className="text-xs text-blue-600 font-medium">
                          {result.category}
                        </div>
                      )}
                      {result.address && (
                        <div className="text-sm text-gray-600">{result.address}</div>
                      )}
                    </>
                  )}
                  {(result.type === 'address' || result.type === 'place') && (
                    <>
                      <div className="font-medium text-gray-800 truncate">
                        {result.name}
                      </div>
                      {result.address && (
                        <div className="text-sm text-gray-600 truncate">
                          {result.address}
                        </div>
                      )}
                      {result.category && (
                        <div className="text-xs text-green-600 font-medium mt-1">
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
    </div>
  )
}
