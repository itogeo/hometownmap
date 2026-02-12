import { useState, useMemo, useEffect } from 'react'

interface Attraction {
  name: string
  category: string
  description: string
  highlights?: string[]
  hours?: string
  fee?: string
  website?: string
  story?: string
  coordinates: [number, number]
}

interface TourismPanelProps {
  attractions: Attraction[]
  onAttractionSelect: (attraction: Attraction) => void
  selectedAttraction?: string | null
}

const categoryConfig: { [key: string]: { color: string; bgColor: string } } = {
  'State Park': { color: '#059669', bgColor: '#D1FAE5' },
  'Historic Site': { color: '#7C3AED', bgColor: '#EDE9FE' },
  'Trail': { color: '#0891B2', bgColor: '#CFFAFE' },
  'Historic Landmark': { color: '#B45309', bgColor: '#FEF3C7' },
  'Museum': { color: '#6366F1', bgColor: '#E0E7FF' },
  'Recreation': { color: '#0D9488', bgColor: '#CCFBF1' },
  'City Park': { color: '#16A34A', bgColor: '#DCFCE7' },
  'Events': { color: '#DC2626', bgColor: '#FEE2E2' },
  'Lodging': { color: '#EA580C', bgColor: '#FFEDD5' },
}

function AttractionCard({
  attraction,
  isSelected,
  onSelect,
}: {
  attraction: Attraction
  isSelected: boolean
  onSelect: () => void
}) {
  const config = categoryConfig[attraction.category] || { color: '#6B7280', bgColor: '#F3F4F6' }

  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
        isSelected
          ? 'border-amber-500 shadow-lg bg-amber-50'
          : 'border-transparent hover:border-gray-200 hover:shadow-md bg-white'
      }`}
    >
      {/* Category badge */}
      <div
        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mb-2"
        style={{ backgroundColor: config.bgColor, color: config.color }}
      >
        {attraction.category}
      </div>

      {/* Name */}
      <h3 className="font-bold text-gray-900 leading-tight">{attraction.name}</h3>

      {/* Description */}
      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{attraction.description}</p>

      {/* Quick info */}
      <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
        {attraction.fee && (
          <span>{attraction.fee}</span>
        )}
        {attraction.hours && (
          <span>{attraction.hours}</span>
        )}
      </div>

      {/* Highlights preview */}
      {attraction.highlights && attraction.highlights.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {attraction.highlights.slice(0, 3).map((h, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              {h}
            </span>
          ))}
          {attraction.highlights.length > 3 && (
            <span className="px-1.5 py-0.5 text-gray-400 text-xs">
              +{attraction.highlights.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function AttractionDetail({
  attraction,
  onClose,
}: {
  attraction: Attraction
  onClose: () => void
}) {
  const config = categoryConfig[attraction.category] || { color: '#6B7280', bgColor: '#F3F4F6' }

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden">
      {/* Header with gradient */}
      <div
        className="p-4 text-white relative"
        style={{ background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)` }}
      >
        <button
          onClick={onClose}
          className="absolute top-1 right-1 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30
                     flex items-center justify-center text-white touch-manipulation"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-xl font-bold">{attraction.name}</h2>
        <div className="text-sm opacity-90">{attraction.category}</div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
        {/* Story/Description */}
        {attraction.story ? (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg">
            <p className="text-sm text-amber-900 italic">{attraction.story}</p>
          </div>
        ) : (
          <p className="text-gray-700">{attraction.description}</p>
        )}

        {attraction.story && (
          <p className="text-gray-600 text-sm">{attraction.description}</p>
        )}

        {/* Highlights */}
        {attraction.highlights && attraction.highlights.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Things To Do</h4>
            <div className="grid grid-cols-2 gap-2">
              {attraction.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  {h}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Practical Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {attraction.hours && (
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-500 text-xs">Hours</div>
              <div className="font-medium">{attraction.hours}</div>
            </div>
          )}
          {attraction.fee && (
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-500 text-xs">Fee</div>
              <div className="font-medium">{attraction.fee}</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${attraction.coordinates[1]},${attraction.coordinates[0]}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            Get Directions
          </a>
          {attraction.website && (
            <a
              href={attraction.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
            >
              Visit Website
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TourismPanel({
  attractions,
  onAttractionSelect,
  selectedAttraction,
}: TourismPanelProps) {
  const [filter, setFilter] = useState<string | null>(null)
  const [detailView, setDetailView] = useState<Attraction | null>(null)

  const categories = useMemo(() => {
    const cats = new Set(attractions.map(a => a.category))
    return Array.from(cats).sort()
  }, [attractions])

  const filteredAttractions = useMemo(() => {
    if (!filter) return attractions
    return attractions.filter(a => a.category === filter)
  }, [attractions, filter])

  // Group by category for display
  const grouped = useMemo(() => {
    const groups: { [key: string]: Attraction[] } = {}
    filteredAttractions.forEach(a => {
      if (!groups[a.category]) groups[a.category] = []
      groups[a.category].push(a)
    })
    return groups
  }, [filteredAttractions])

  const handleSelect = (attraction: Attraction) => {
    setDetailView(attraction)
    onAttractionSelect(attraction)
  }

  // Open detail view when attraction is selected from map
  useEffect(() => {
    if (selectedAttraction) {
      const attraction = attractions.find(a => a.name === selectedAttraction)
      if (attraction && (!detailView || detailView.name !== selectedAttraction)) {
        setDetailView(attraction)
      }
    }
  }, [selectedAttraction, attractions])

  // If detail view is open
  if (detailView) {
    return (
      <div className="h-full">
        <AttractionDetail
          attraction={detailView}
          onClose={() => setDetailView(null)}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <div className="p-3 border-b bg-white/80 backdrop-blur shrink-0">
        <div className="mb-2">
          <h2 className="font-bold text-gray-900">Explore Three Forks</h2>
          <p className="text-xs text-gray-500">Your guide to adventure</p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilter(null)}
            className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
              !filter ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({attractions.length})
          </button>
          {categories.map(cat => {
            const count = attractions.filter(a => a.category === cat).length
            return (
              <button
                key={cat}
                onClick={() => setFilter(filter === cat ? null : cat)}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === cat
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Attractions list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
        {/* Must-See callout */}
        {!filter && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3 rounded-lg mb-3">
            <div className="font-bold">Don't Miss</div>
            <p className="text-sm opacity-90 mt-1">
              Missouri Headwaters State Park - where Lewis & Clark discovered where three rivers become one
            </p>
          </div>
        )}

        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="space-y-2">
            {!filter && (
              <div className="flex items-center gap-2 px-1 pt-2">
                <span className="text-sm font-semibold text-gray-700">{category}</span>
                <span className="text-xs text-gray-400">({items.length})</span>
              </div>
            )}
            {items.map((attraction, idx) => (
              <AttractionCard
                key={`${attraction.name}-${idx}`}
                attraction={attraction}
                isSelected={selectedAttraction === attraction.name}
                onSelect={() => handleSelect(attraction)}
              />
            ))}
          </div>
        ))}

        {filteredAttractions.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No attractions found
          </div>
        )}
      </div>

      {/* Footer with tourism links */}
      <div className="border-t p-2 bg-white text-xs shrink-0">
        <div className="flex gap-2 justify-center text-gray-500">
          <a href="https://discoverthreeforks.com" target="_blank" rel="noopener noreferrer" className="hover:text-amber-600">
            DiscoverThreeForks.com
          </a>
          <span>|</span>
          <a href="https://visitmt.com" target="_blank" rel="noopener noreferrer" className="hover:text-amber-600">
            Visit Montana
          </a>
        </div>
      </div>
    </div>
  )
}
