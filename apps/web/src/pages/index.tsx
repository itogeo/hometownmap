import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import Link from 'next/link'
import ModeSelector from '@/components/ModeSelector'
import LayerControl from '@/components/LayerControl'
import SearchBar from '@/components/SearchBar'
import WelcomeModal from '@/components/WelcomeModal'
import BusinessListPanel from '@/components/BusinessListPanel'
import TourismPanel from '@/components/TourismPanel'
import { MapMode } from '@/types'

interface Business {
  name: string
  category: string
  address: string
  phone?: string
  website?: string
  coordinates: [number, number]
}

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

// Dynamic import to avoid SSR issues with mapbox-gl
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-xl text-gray-600">Loading map...</div>
    </div>
  ),
})

export default function Home() {
  const [currentMode, setCurrentMode] = useState<MapMode>('resident')
  const [visibleLayers, setVisibleLayers] = useState<string[]>([])
  const [layerOrder, setLayerOrder] = useState<string[]>([])
  const [mapStyle, setMapStyle] = useState<'satellite' | 'streets'>('streets')
  const [cityConfig, setCityConfig] = useState<any>(null)
  const [selectedLocation, setSelectedLocation] = useState<{
    longitude: number
    latitude: number
    zoom?: number
  } | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [attractions, setAttractions] = useState<Attraction[]>([])
  const [selectedAttraction, setSelectedAttraction] = useState<string | null>(null)

  // Load city configuration
  useEffect(() => {
    fetch('/api/config/three-forks')
      .then((res) => res.json())
      .then((config) => {
        setCityConfig(config)
        // Set initial layers based on mode - load ALL layers from config
        const modeLayers = config.modes[currentMode]?.layers || []
        setVisibleLayers(modeLayers)
        // Initialize layer order (reversed so first = rendered on top)
        setLayerOrder([...modeLayers].reverse())
        // Set map style from mode config
        const modeStyle = config.modes[currentMode]?.mapStyle
        if (modeStyle === 'satellite' || modeStyle === 'streets') {
          setMapStyle(modeStyle)
        }
      })
      .catch((err) => console.error('Failed to load city config:', err))
  }, [currentMode])

  // Load businesses data
  useEffect(() => {
    fetch('/api/layers/three-forks/businesses')
      .then((res) => res.json())
      .then((data) => {
        if (data.features) {
          const bizList: Business[] = data.features.map((f: any) => ({
            name: f.properties.name,
            category: f.properties.category,
            address: f.properties.address,
            phone: f.properties.phone,
            website: f.properties.website,
            coordinates: f.geometry.coordinates as [number, number],
          }))
          setBusinesses(bizList)
          console.log(`✅ Loaded ${bizList.length} businesses`)
        }
      })
      .catch((err) => console.error('Failed to load businesses:', err))
  }, [])

  // Load attractions data
  useEffect(() => {
    fetch('/api/layers/three-forks/attractions')
      .then((res) => res.json())
      .then((data) => {
        if (data.features) {
          const attractionList: Attraction[] = data.features.map((f: any) => ({
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
          setAttractions(attractionList)
          console.log(`✅ Loaded ${attractionList.length} attractions`)
        }
      })
      .catch((err) => console.error('Failed to load attractions:', err))
  }, [])

  const handleModeChange = (mode: MapMode) => {
    setCurrentMode(mode)
    if (cityConfig) {
      const modeLayers = cityConfig.modes[mode]?.layers || []
      setVisibleLayers(modeLayers)
      setLayerOrder([...modeLayers].reverse())
      // Update map style from mode config
      const modeStyle = cityConfig.modes[mode]?.mapStyle
      if (modeStyle === 'satellite' || modeStyle === 'streets') {
        setMapStyle(modeStyle)
      }
    }
  }

  const toggleLayer = (layerId: string) => {
    setVisibleLayers((prev) =>
      prev.includes(layerId)
        ? prev.filter((id) => id !== layerId)
        : [...prev, layerId]
    )
  }

  const handleReorderLayer = (layerId: string, direction: 'up' | 'down') => {
    setLayerOrder((prev) => {
      const index = prev.indexOf(layerId)
      if (index === -1) return prev
      const newOrder = [...prev]
      if (direction === 'up' && index > 0) {
        // Swap with previous (move up = render on top)
        ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
      } else if (direction === 'down' && index < prev.length - 1) {
        // Swap with next (move down = render below)
        ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
      }
      return newOrder
    })
  }

  const toggleMapStyle = () => {
    setMapStyle((prev) => (prev === 'satellite' ? 'streets' : 'satellite'))
  }

  const handleSearchSelect = (result: any) => {
    if (result.center) {
      setSelectedLocation({
        longitude: result.center[0],
        latitude: result.center[1],
        zoom: 17,
      })
    }
  }

  const handleBusinessSelect = (business: Business) => {
    setSelectedBusiness(business.name)
    setSelectedLocation({
      longitude: business.coordinates[0],
      latitude: business.coordinates[1],
      zoom: 17,
    })
  }

  const handleAttractionSelect = (attraction: Attraction) => {
    setSelectedAttraction(attraction.name)
    setSelectedLocation({
      longitude: attraction.coordinates[0],
      latitude: attraction.coordinates[1],
      zoom: 15,
    })
  }

  if (!cityConfig) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-xl text-gray-600">Loading configuration...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{cityConfig.branding.title || 'HometownMap'}</title>
        <meta
          name="description"
          content={`Interactive mapping portal for ${cityConfig.name}`}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
          rel="stylesheet"
        />
      </Head>

      <WelcomeModal cityName={cityConfig.name} />

      <div className="relative h-screen w-screen overflow-hidden">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-2">
            <h1 className="text-lg font-semibold text-gray-900">
              {cityConfig.name}
            </h1>

            <div className="flex items-center gap-3">
              <SearchBar
                cityId={cityConfig.id}
                onResultSelect={handleSearchSelect}
              />
              <Link
                href="/projects"
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                Projects
              </Link>
              {cityConfig.contact?.phone && (
                <a
                  href={`tel:${cityConfig.contact.phone.replace(/\D/g, '')}`}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {cityConfig.contact.phone}
                </a>
              )}
            </div>
          </div>

          <ModeSelector
            currentMode={currentMode}
            onModeChange={handleModeChange}
            availableModes={Object.keys(cityConfig.modes).filter(
              (mode) => cityConfig.modes[mode].enabled
            )}
          />
        </header>

        {/* Map */}
        <div className="absolute inset-0 pt-20">
          <MapView
            cityConfig={cityConfig}
            currentMode={currentMode}
            visibleLayers={visibleLayers}
            layerOrder={layerOrder}
            mapStyleOverride={mapStyle}
            selectedLocation={selectedLocation}
            onAttractionSelect={handleAttractionSelect}
          />
        </div>

        {/* Business List Panel */}
        {currentMode === 'business' && businesses.length > 0 && (
          <aside className="absolute left-3 top-24 z-10 w-56 bg-white rounded shadow-lg" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <div className="p-2 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-700">{businesses.length} Businesses</span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <BusinessListPanel
                businesses={businesses}
                onBusinessSelect={handleBusinessSelect}
                selectedBusiness={selectedBusiness}
              />
            </div>
          </aside>
        )}

        {/* Tourism Panel */}
        {currentMode === 'tourism' && attractions.length > 0 && (
          <aside className="absolute left-3 top-24 z-10 w-64 bg-white rounded shadow-lg" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <div className="p-2 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-700">{attractions.length} Places</span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <TourismPanel
                attractions={attractions}
                onAttractionSelect={handleAttractionSelect}
                selectedAttraction={selectedAttraction}
              />
            </div>
          </aside>
        )}

        {/* Layer Control */}
        <aside className="absolute right-3 top-24 z-10 w-48 bg-white rounded shadow-lg">
          <div className="p-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">Layers</span>
            <button
              onClick={toggleMapStyle}
              className="text-[10px] text-gray-500 hover:text-gray-700"
            >
              {mapStyle === 'satellite' ? 'Satellite' : 'Streets'}
            </button>
          </div>
          <div className="p-1.5 max-h-[calc(100vh-180px)] overflow-y-auto">
            <LayerControl
              layers={cityConfig.modes[currentMode]?.layers || []}
              visibleLayers={visibleLayers}
              onToggleLayer={toggleLayer}
              layerConfig={cityConfig.layers}
              layerOrder={layerOrder}
              onReorderLayer={handleReorderLayer}
            />
          </div>
        </aside>

        {/* Footer links */}
        <div className="absolute bottom-3 right-3 z-10 flex gap-2 text-[11px]">
          <Link
            href="/test-map"
            className="px-2 py-1 bg-white/90 text-gray-600 hover:text-gray-900 rounded shadow-sm"
          >
            Data
          </Link>
          {cityConfig.contact?.website && (
            <a
              href={cityConfig.contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-white/90 text-gray-600 hover:text-gray-900 rounded shadow-sm"
            >
              City Website
            </a>
          )}
        </div>
      </div>
    </>
  )
}
