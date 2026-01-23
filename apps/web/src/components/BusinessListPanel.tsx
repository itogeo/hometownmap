import { useState, useMemo } from 'react'

interface Business {
  name: string
  category: string
  address: string
  phone?: string
  website?: string
  coordinates: [number, number]
}

interface BusinessListPanelProps {
  businesses: Business[]
  onBusinessSelect: (business: Business) => void
  selectedBusiness?: string | null
}

export default function BusinessListPanel({
  businesses,
  onBusinessSelect,
  selectedBusiness,
}: BusinessListPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(businesses.map(b => b.category))
    return Array.from(cats).sort()
  }, [businesses])

  // Filter businesses based on search and category
  const filteredBusinesses = useMemo(() => {
    return businesses.filter(b => {
      const matchesSearch = !searchQuery ||
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.address.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = !selectedCategory || b.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [businesses, searchQuery, selectedCategory])

  // Group businesses by category for display
  const groupedBusinesses = useMemo(() => {
    const grouped: { [key: string]: Business[] } = {}
    filteredBusinesses.forEach(b => {
      if (!grouped[b.category]) {
        grouped[b.category] = []
      }
      grouped[b.category].push(b)
    })
    return grouped
  }, [filteredBusinesses])

  const categoryIcons: { [key: string]: string } = {
    'Restaurant': '🍽️',
    'Hotel & Restaurant': '🏨',
    'Bar': '🍺',
    'Retail': '🛍️',
    'Bank': '🏦',
    'Government': '🏛️',
    'Emergency Services': '🚒',
    'Library': '📚',
    'Museum': '🏛️',
    'State Park': '🌲',
    'Golf': '⛳',
    'Lodging': '🛏️',
    'Manufacturing': '🏭',
    'Mining': '⛏️',
    'Gas Station': '⛽',
    'Veterinary': '🐾',
    'Real Estate': '🏠',
    'Business Services': '💼',
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-blue-50">
        <h2 className="font-bold text-lg text-gray-800 mb-2">
          Local Businesses
        </h2>
        <p className="text-sm text-gray-600 mb-3">
          {filteredBusinesses.length} of {businesses.length} businesses
        </p>

        {/* Search */}
        <input
          type="text"
          placeholder="Search businesses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Category Filter */}
        <div className="mt-2 flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-2 py-1 text-xs rounded-full ${
              !selectedCategory
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          {categories.slice(0, 5).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`px-2 py-1 text-xs rounded-full ${
                selectedCategory === cat
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Business List */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedBusinesses).map(([category, bizList]) => (
          <div key={category} className="border-b">
            {/* Category Header */}
            <div className="sticky top-0 bg-gray-100 px-4 py-2 font-semibold text-sm text-gray-700 flex items-center gap-2">
              <span>{categoryIcons[category] || '📍'}</span>
              <span>{category}</span>
              <span className="text-gray-400 font-normal">({bizList.length})</span>
            </div>

            {/* Businesses in Category */}
            {bizList.map((business, idx) => (
              <button
                key={`${business.name}-${idx}`}
                onClick={() => onBusinessSelect(business)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                  selectedBusiness === business.name ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="font-medium text-gray-800">
                  {business.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {business.address}
                </div>
                {business.phone && (
                  <div className="text-xs text-gray-500">
                    {business.phone}
                  </div>
                )}
              </button>
            ))}
          </div>
        ))}

        {filteredBusinesses.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No businesses found matching your search.
          </div>
        )}
      </div>
    </div>
  )
}
