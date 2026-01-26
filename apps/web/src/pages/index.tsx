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
    }
  }

  const toggleLayer = (layerId: string) => {
    setVisibleLayers((prev) =>
      prev.includes(layerId)
        ? prev.filter((id) => id !== layerId)
        : [...prev, layerId]
    )
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
        <header className="absolute top-0 left-0 right-0 z-10 bg-white shadow-md">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {cityConfig.branding.logo && (
                <img
                  src={cityConfig.branding.logo}
                  alt={`${cityConfig.name} logo`}
                  className="h-10 w-10"
                />
              )}
              <h1 className="text-xl font-bold text-gray-800">
                {cityConfig.branding.title}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/projects"
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm text-sm font-medium"
              >
                <span>🏗️</span>
                <span>Projects</span>
              </Link>
              <SearchBar
                cityId={cityConfig.id}
                onResultSelect={handleSearchSelect}
              />
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
        <div className="absolute inset-0 pt-32">
          <MapView
            cityConfig={cityConfig}
            currentMode={currentMode}
            visibleLayers={visibleLayers}
            selectedLocation={selectedLocation}
            onAttractionSelect={handleAttractionSelect}
          />
        </div>

        {/* Business List Panel (Business Mode) - Hover to expand */}
        {currentMode === 'business' && businesses.length > 0 && (
          <aside className="absolute left-2 top-36 z-10 group/biz">
            {/* Collapsed state - small pill */}
            <div className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg cursor-pointer flex items-center gap-2 text-xs font-medium group-hover/biz:hidden">
              <span>🏢</span> Businesses ({businesses.length})
            </div>
            {/* Expanded state on hover */}
            <div className="hidden group-hover/biz:flex flex-col w-64 bg-white rounded-lg shadow-lg" style={{ maxHeight: 'calc(100vh - 180px)' }}>
              <div className="flex-1 overflow-y-auto min-h-0">
                <BusinessListPanel
                  businesses={businesses}
                  onBusinessSelect={handleBusinessSelect}
                  selectedBusiness={selectedBusiness}
                />
              </div>
              {/* Demographics at bottom */}
              {cityConfig.demographics && (
                <div className="border-t p-2 bg-gray-50 text-xs shrink-0">
                  <div className="flex gap-3 text-gray-600">
                    <span>Pop: <b>{cityConfig.demographics.population?.toLocaleString()}</b></span>
                    <span>Income: <b>${(cityConfig.demographics.median_income / 1000).toFixed(0)}K</b></span>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Tourism Panel (Tourism Mode) - Story map style sidebar */}
        {currentMode === 'tourism' && attractions.length > 0 && (
          <aside className="absolute left-2 top-36 z-10 group/tour">
            {/* Collapsed state - attractive pill */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-2 rounded-lg shadow-lg cursor-pointer flex items-center gap-2 text-xs font-medium group-hover/tour:hidden">
              <span>🗺️</span> Explore ({attractions.length} attractions)
            </div>
            {/* Expanded state on hover */}
            <div className="hidden group-hover/tour:flex flex-col w-80 bg-white rounded-lg shadow-xl min-h-0" style={{ maxHeight: 'calc(100vh - 180px)' }}>
              <div className="flex-1 overflow-y-auto min-h-0">
                <TourismPanel
                  attractions={attractions}
                  onAttractionSelect={handleAttractionSelect}
                  selectedAttraction={selectedAttraction}
                />
              </div>
            </div>
          </aside>
        )}

        {/* Layer Control - Hover to expand */}
        <aside className="absolute right-2 top-36 z-10 group/layers">
          {/* Collapsed state */}
          <div className="bg-gray-700 text-white px-3 py-2 rounded-lg shadow-lg cursor-pointer flex items-center gap-2 text-xs font-medium group-hover/layers:hidden">
            <span>🗺️</span> Layers ({visibleLayers.length})
          </div>
          {/* Expanded state */}
          <div className="hidden group-hover/layers:block w-44 bg-white rounded-lg shadow-lg p-2 max-h-[calc(100vh-160px)] overflow-y-auto">
            <LayerControl
              layers={cityConfig.modes[currentMode]?.layers || []}
              visibleLayers={visibleLayers}
              onToggleLayer={toggleLayer}
              layerConfig={cityConfig.layers}
              allLayers={Object.keys(cityConfig.layers)}
            />
          </div>
        </aside>

        {/* City Hall Contact - Compact hover card */}
        {cityConfig.contact && (
          <aside className="absolute left-4 bottom-4 z-10 group">
            {/* Collapsed state - small button */}
            <div className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg cursor-pointer flex items-center gap-2 text-xs font-medium group-hover:hidden">
              <span>🏛️</span> City Hall • {cityConfig.contact.phone}
            </div>
            {/* Expanded state on hover */}
            <div className="hidden group-hover:block bg-white rounded-lg shadow-lg overflow-hidden w-64">
              <div className="bg-blue-600 px-3 py-1.5">
                <h3 className="font-bold text-white text-xs flex items-center gap-2">
                  <span>🏛️</span> City Hall
                </h3>
              </div>
              <div className="p-2 space-y-1.5 text-xs">
                {cityConfig.contact.phone && (
                  <a
                    href={`tel:${cityConfig.contact.phone.replace(/\D/g, '')}`}
                    className="text-gray-700 hover:text-blue-600 flex items-center gap-2"
                  >
                    📞 {cityConfig.contact.phone}
                  </a>
                )}
                {cityConfig.contact.city_hall && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cityConfig.contact.city_hall)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-blue-600 flex items-center gap-2"
                  >
                    📍 Directions
                  </a>
                )}
                {cityConfig.contact.website && (
                  <a
                    href={cityConfig.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    🌐 Website
                  </a>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </>
  )
}
