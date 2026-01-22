import { useState, useEffect } from 'react'

interface Business {
  name: string
  category: string
  address?: string
  phone?: string
  website?: string
  center?: [number, number]
}

interface BusinessDirectoryProps {
  cityId: string
  onBusinessSelect?: (business: Business) => void
}

export default function BusinessDirectory({
  cityId,
  onBusinessSelect,
}: BusinessDirectoryProps) {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadBusinesses()
  }, [cityId])

  useEffect(() => {
    filterBusinesses()
  }, [searchQuery, selectedCategory, businesses])

  const loadBusinesses = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/layers/${cityId}/businesses`)
      if (response.ok) {
        const data = await response.json()
        const businessList = data.features.map((f: any) => ({
          name: f.properties.name || 'Unknown',
          category: f.properties.category || 'Other',
          address: f.properties.address,
          phone: f.properties.phone,
          website: f.properties.website,
          center: f.geometry.coordinates,
        }))
        setBusinesses(businessList)
        setFilteredBusinesses(businessList)
      }
    } catch (error) {
      console.error('Failed to load businesses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterBusinesses = () => {
    let filtered = businesses

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((b) => b.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.category.toLowerCase().includes(query) ||
          b.address?.toLowerCase().includes(query)
      )
    }

    setFilteredBusinesses(filtered)
  }

  const categories = ['all', ...new Set(businesses.map((b) => b.category))].sort()

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed left-4 bottom-4 z-10 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg shadow-lg hover:from-purple-700 hover:to-purple-800 transition-all hover:scale-105 flex items-center gap-2"
      >
        <span className="text-lg">📚</span>
        <span className="font-semibold">Business Directory</span>
        <span className="bg-white bg-opacity-30 px-2 py-0.5 rounded text-xs">
          {businesses.length}
        </span>
      </button>
    )
  }

  return (
    <aside className="fixed left-4 bottom-4 z-10 w-96 max-h-[80vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <h3 className="text-lg font-bold">Business Directory</h3>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search businesses..."
          className="w-full px-3 py-2 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
      </div>

      {/* Category Filter */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {category === 'all' ? 'All' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="px-4 py-2 bg-gray-50 border-b text-sm text-gray-600">
        {filteredBusinesses.length} business
        {filteredBusinesses.length !== 1 ? 'es' : ''}
        {searchQuery && ` matching "${searchQuery}"`}
      </div>

      {/* Business List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No businesses found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredBusinesses.map((business, index) => (
              <div
                key={index}
                className="p-4 hover:bg-purple-50 cursor-pointer transition-colors group"
                onClick={() => onBusinessSelect && onBusinessSelect(business)}
              >
                <div className="font-semibold text-gray-800 group-hover:text-purple-700 mb-1">
                  {business.name}
                </div>

                <div className="text-xs font-medium text-purple-600 mb-2">
                  {business.category}
                </div>

                {business.address && (
                  <div className="text-sm text-gray-600 flex items-start gap-1">
                    <span>📍</span>
                    <span>{business.address}</span>
                  </div>
                )}

                {business.phone && (
                  <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <span>📞</span>
                    <a
                      href={`tel:${business.phone}`}
                      className="hover:text-purple-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {business.phone}
                    </a>
                  </div>
                )}

                {business.website && (
                  <div className="text-sm mt-2">
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 underline flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Visit Website
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
