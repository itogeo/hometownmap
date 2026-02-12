import { useState, useMemo } from 'react'

// Business Card component - compact
function BusinessCard({
  business,
  isSelected,
  onSelect,
  showCategory,
}: {
  business: Business
  isSelected: boolean
  onSelect: (business: Business) => void
  showCategory: boolean
}) {
  return (
    <div
      className={`px-2 py-2 border-b border-gray-100 hover:bg-blue-50 transition-colors ${
        isSelected ? 'bg-blue-100 border-l-2 border-l-blue-500' : ''
      }`}
    >
      {/* Business name - clickable to zoom */}
      <button
        onClick={() => onSelect(business)}
        className="text-sm font-medium text-gray-800 hover:text-blue-600 text-left w-full leading-tight"
      >
        {business.name}
      </button>

      {showCategory && (
        <div className="text-xs text-gray-400">
          {business.category}
        </div>
      )}

      {/* Compact action row */}
      <div className="flex gap-2 mt-1 text-xs">
        {business.website && (
          <a
            href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Website
          </a>
        )}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Directions
        </a>
      </div>
    </div>
  )
}

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

type SortOption = 'category' | 'alphabetical'

export default function BusinessListPanel({
  businesses,
  onBusinessSelect,
  selectedBusiness,
}: BusinessListPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('category')

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


  return (
    <div className="flex flex-col" style={{ maxHeight: 'calc(100vh - 220px)' }}>
      {/* Compact Header */}
      <div className="p-2 border-b bg-blue-50">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-sm text-gray-800">Businesses</h2>
          <span className="text-xs text-gray-500">{filteredBusinesses.length}</span>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        {/* Sort Options */}
        <div className="mt-1 flex gap-1">
          <button
            onClick={() => setSortBy('category')}
            className={`px-2 py-0.5 text-xs rounded ${
              sortBy === 'category'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            Category
          </button>
          <button
            onClick={() => setSortBy('alphabetical')}
            className={`px-2 py-0.5 text-xs rounded ${
              sortBy === 'alphabetical'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            A-Z
          </button>
        </div>
      </div>

      {/* Business List - visible scrollbar */}
      <div className="flex-1 overflow-y-scroll">
        {sortBy === 'category' ? (
          // Grouped by category view
          Object.entries(groupedBusinesses).map(([category, bizList]) => (
            <div key={category}>
              {/* Compact Category Header */}
              <div className="sticky top-0 bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600 flex items-center gap-1">
                <span>{category}</span>
                <span className="text-gray-400">({bizList.length})</span>
              </div>

              {/* Businesses in Category */}
              {bizList.map((business, idx) => (
                <BusinessCard
                  key={`${business.name}-${idx}`}
                  business={business}
                  isSelected={selectedBusiness === business.name}
                  onSelect={onBusinessSelect}
                  showCategory={false}
                />
              ))}
            </div>
          ))
        ) : (
          // Alphabetical A-Z view
          [...filteredBusinesses]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((business, idx) => (
              <BusinessCard
                key={`${business.name}-${idx}`}
                business={business}
                isSelected={selectedBusiness === business.name}
                onSelect={onBusinessSelect}
                showCategory={true}
              />
            ))
        )}

        {filteredBusinesses.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No businesses found matching your search.
          </div>
        )}
      </div>
    </div>
  )
}
