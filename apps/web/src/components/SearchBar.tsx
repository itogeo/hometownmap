import { useState } from 'react'

interface SearchBarProps {
  cityId: string
}

export default function SearchBar({ cityId }: SearchBarProps) {
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

  return (
    <div className="relative w-80">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          handleSearch(e.target.value)
        }}
        placeholder="Search address or owner name..."
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {isSearching && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}

      {results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto z-50">
          {results.map((result, index) => (
            <button
              key={index}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              onClick={() => {
                // TODO: Zoom to feature
                setQuery(result.address || result.owner_name || '')
                setResults([])
              }}
            >
              <div className="font-medium text-gray-800">
                {result.address || 'No address'}
              </div>
              {result.owner_name && (
                <div className="text-sm text-gray-600">{result.owner_name}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
