import { useState } from 'react'

interface SearchBarProps {
  cityId: string
  onResultSelect?: (result: any) => void
}

export default function SearchBar({ cityId, onResultSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsSearching(true)

    try {
      const response = await fetch(
        `/api/search/${cityId}?q=${encodeURIComponent(searchQuery)}`
      )

      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
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
            handleSearch(e.target.value)
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
        <div className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
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
                        {result.address || 'No address'}
                      </div>
                      {result.owner_name && (
                        <div className="text-sm text-gray-600 truncate">
                          Owner: {result.owner_name}
                        </div>
                      )}
                      <div className="flex gap-2 mt-1 text-xs text-gray-500">
                        {result.acreage && <span>{result.acreage} acres</span>}
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
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
