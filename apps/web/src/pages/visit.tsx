import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import Link from 'next/link'
import { getCityConfigPath, getCityLayerPath } from '@/lib/cityConfig'

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

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-blue-50">
      <div className="text-xl text-blue-600">Loading map...</div>
    </div>
  ),
})

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'State Park': { bg: 'bg-green-100', text: 'text-green-800' },
  'Historic Site': { bg: 'bg-amber-100', text: 'text-amber-800' },
  'Museum': { bg: 'bg-purple-100', text: 'text-purple-800' },
  'Recreation': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'Natural Feature': { bg: 'bg-teal-100', text: 'text-teal-800' },
  'Dining': { bg: 'bg-orange-100', text: 'text-orange-800' },
  'Shopping': { bg: 'bg-pink-100', text: 'text-pink-800' },
  'Lodging': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
}

export default function VisitPage() {
  const [attractions, setAttractions] = useState<Attraction[]>([])
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null)
  const [cityConfig, setCityConfig] = useState<any>(null)
  const [selectedLocation, setSelectedLocation] = useState<{
    longitude: number
    latitude: number
    zoom?: number
  } | null>(null)

  useEffect(() => {
    fetch(getCityConfigPath())
      .then((res) => res.json())
      .then(setCityConfig)
      .catch((err) => console.error('Failed to load config:', err))
  }, [])

  useEffect(() => {
    fetch(getCityLayerPath('attractions.geojson'))
      .then((res) => res.json())
      .then((data) => {
        if (data.features) {
          const list: Attraction[] = data.features.map((f: any) => ({
            name: f.properties.name,
            category: f.properties.category,
            description: f.properties.description,
            highlights: f.properties.highlights,
            hours: f.properties.hours,
            fee: f.properties.fee,
            website: f.properties.website,
            story: f.properties.story,
            coordinates: f.geometry.coordinates as [number, number],
          }))
          setAttractions(list)
        }
      })
      .catch((err) => console.error('Failed to load attractions:', err))
  }, [])

  const handleAttractionClick = (attraction: Attraction) => {
    setSelectedAttraction(attraction)
    setSelectedLocation({
      longitude: attraction.coordinates[0],
      latitude: attraction.coordinates[1],
      zoom: 14,
    })
  }

  const getCategoryStyle = (category: string) => {
    return CATEGORY_COLORS[category] || { bg: 'bg-gray-100', text: 'text-gray-800' }
  }

  if (!cityConfig) {
    return (
      <div className="flex items-center justify-center h-screen bg-blue-50">
        <div className="text-xl text-blue-600">Loading...</div>
      </div>
    )
  }

  // Override config to force tourism layers
  const tourismConfig = {
    ...cityConfig,
    modes: {
      tourism: {
        ...cityConfig.modes.tourism,
        layers: ['attractions', 'waterways', 'cities'],
      }
    }
  }

  return (
    <>
      <Head>
        <title>Visit Three Forks | Discover Montana's Hidden Gem</title>
        <meta
          name="description"
          content="Plan your visit to Three Forks, Montana - where three rivers meet to form the mighty Missouri. Explore state parks, historic sites, and small-town charm."
        />
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
          rel="stylesheet"
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Hero Header */}
        <header className="bg-white border-b border-blue-100">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
                  ← Back to Map
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 mt-1">
                  Visit Three Forks
                </h1>
                <p className="text-gray-600">Where Three Rivers Become One</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Planning your trip?</p>
                <a
                  href="https://www.visitmt.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Visit Montana →
                </a>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100 text-center">
              <div className="text-2xl font-bold text-blue-600">{attractions.length}</div>
              <div className="text-sm text-gray-600">Places to Explore</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100 text-center">
              <div className="text-2xl font-bold text-blue-600">3</div>
              <div className="text-sm text-gray-600">Rivers Converge Here</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100 text-center">
              <div className="text-2xl font-bold text-blue-600">30 min</div>
              <div className="text-sm text-gray-600">From Bozeman</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attractions List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Things to Do</h2>

              {/* Featured: Missouri Headwaters */}
              {attractions.filter(a => a.name.includes('Missouri Headwaters')).map((attraction) => (
                <div
                  key={attraction.name}
                  onClick={() => handleAttractionClick(attraction)}
                  className={`bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border-2 border-green-200 cursor-pointer transition-all hover:shadow-md ${
                    selectedAttraction?.name === attraction.name ? 'ring-2 ring-green-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">1</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                          Don't Miss
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 mt-1">{attraction.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{attraction.description}</p>
                      {attraction.story && (
                        <p className="text-sm text-green-700 mt-2 italic">"{attraction.story}"</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {attraction.hours && <span>Hours: {attraction.hours}</span>}
                        {attraction.fee && <span>Fee: {attraction.fee}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Other Attractions */}
              <div className="grid gap-3">
                {attractions.filter(a => !a.name.includes('Missouri Headwaters')).map((attraction) => {
                  const style = getCategoryStyle(attraction.category)
                  return (
                    <div
                      key={attraction.name}
                      onClick={() => handleAttractionClick(attraction)}
                      className={`bg-white rounded-lg p-3 border border-gray-200 cursor-pointer transition-all hover:shadow-md hover:border-blue-300 ${
                        selectedAttraction?.name === attraction.name ? 'ring-2 ring-blue-500 border-blue-500' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                            {attraction.category}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900">{attraction.name}</h3>
                          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{attraction.description}</p>
                        {attraction.highlights && attraction.highlights.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {attraction.highlights.slice(0, 3).map((h, i) => (
                              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {h}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Map */}
            <div className="lg:sticky lg:top-4 h-[500px] lg:h-[calc(100vh-200px)] rounded-lg overflow-hidden shadow-lg border border-gray-200">
              <MapView
                cityConfig={tourismConfig}
                currentMode="explore"
                visibleLayers={['attractions', 'waterways', 'cities']}
                layerOrder={['cities', 'waterways', 'attractions']}
                mapStyleOverride="streets"
                selectedLocation={selectedLocation}
              />
            </div>
          </div>

          {/* Selected Attraction Detail */}
          {selectedAttraction && (
            <div className="mt-6 bg-white rounded-lg p-6 shadow-lg border border-blue-200">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryStyle(selectedAttraction.category).bg} ${getCategoryStyle(selectedAttraction.category).text}`}>
                    {selectedAttraction.category}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mt-2">{selectedAttraction.name}</h3>
                  <p className="text-gray-600 mt-1">{selectedAttraction.description}</p>
                </div>
                <button
                  onClick={() => setSelectedAttraction(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {selectedAttraction.story && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 italic">"{selectedAttraction.story}"</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                {selectedAttraction.hours && (
                  <div>
                    <div className="text-sm text-gray-500">Hours</div>
                    <div className="font-medium">{selectedAttraction.hours}</div>
                  </div>
                )}
                {selectedAttraction.fee && (
                  <div>
                    <div className="text-sm text-gray-500">Admission</div>
                    <div className="font-medium">{selectedAttraction.fee}</div>
                  </div>
                )}
                {selectedAttraction.website && (
                  <div>
                    <div className="text-sm text-gray-500">More Info</div>
                    <a
                      href={selectedAttraction.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Visit Website →
                    </a>
                  </div>
                )}
              </div>

              {selectedAttraction.highlights && selectedAttraction.highlights.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-gray-500 mb-2">Highlights</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedAttraction.highlights.map((h, i) => (
                      <span key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedAttraction.coordinates[1]},${selectedAttraction.coordinates[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Directions
                </a>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Three Forks, Montana - Gateway to the Missouri River Headwaters</p>
            <p className="mt-1">
              Questions? Call City Hall at{' '}
              <a href="tel:4062853431" className="text-blue-600 hover:text-blue-800">
                (406) 285-3431
              </a>
            </p>
          </footer>
        </div>
      </div>
    </>
  )
}
