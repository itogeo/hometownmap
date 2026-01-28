import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'

const Map = dynamic(
  () => import('react-map-gl').then((mod) => mod.default),
  { ssr: false }
)

const Source = dynamic(
  () => import('react-map-gl').then((mod) => mod.Source),
  { ssr: false }
)

const Layer = dynamic(
  () => import('react-map-gl').then((mod) => mod.Layer),
  { ssr: false }
)

const NavigationControl = dynamic(
  () => import('react-map-gl').then((mod) => mod.NavigationControl),
  { ssr: false }
)

// All available datasets organized by category
const DATASETS: { [category: string]: { id: string; name: string; path: string }[] } = {
  'Core Layers': [
    { id: 'parcels', name: 'Parcels', path: 'processed/parcels' },
    { id: 'roads', name: 'Roads', path: 'processed/roads' },
    { id: 'buildings', name: 'Buildings', path: 'processed/buildings' },
    { id: 'waterways', name: 'Waterways', path: 'processed/waterways' },
    { id: 'cities', name: 'Cities', path: 'processed/cities' },
    { id: 'city_boundary', name: 'City Boundary', path: 'processed/city_boundary' },
  ],
  'Districts & Zones': [
    { id: 'zoningdistricts', name: 'Zoning Districts', path: 'processed/zoningdistricts' },
    { id: 'firedistricts', name: 'Fire Districts', path: 'processed/firedistricts' },
    { id: 'schooldistricts', name: 'School Districts', path: 'processed/schooldistricts' },
    { id: 'water_sewer_districts', name: 'Water/Sewer Districts', path: 'processed/water_sewer_districts' },
    { id: 'planning_juris', name: 'Planning Jurisdictions', path: 'gallatin/planning_jurisdictions' },
  ],
  'Subdivisions': [
    { id: 'subdivisions', name: 'Subdivisions', path: 'processed/subdivisions' },
    { id: 'minor_subdivisions', name: 'Minor Subdivisions', path: 'processed/minor_subdivisions' },
  ],
  'Points of Interest': [
    { id: 'businesses', name: 'Businesses', path: 'processed/businesses' },
    { id: 'attractions', name: 'Attractions', path: 'processed/attractions' },
    { id: 'projects', name: 'Capital Projects', path: 'processed/projects' },
  ],
  'Environmental': [
    { id: 'fema_flood', name: 'FEMA Flood Zones', path: 'gallatin/fema_flood_zones' },
    { id: 'soils', name: 'Soils (NRCS)', path: 'gallatin/soils_nrcs' },
    { id: 'landslides', name: 'Landslides', path: 'gallatin/landslides' },
    { id: 'wui', name: 'Wildland Urban Interface', path: 'gallatin/wildland_urban_interface' },
    { id: 'conservation', name: 'Conservation Easements', path: 'gallatin/conservation_easements' },
  ],
  'Water Infrastructure': [
    { id: 'groundwater_wells', name: 'Groundwater Wells', path: 'gallatin/groundwater_monitor_wells' },
    { id: 'wastewater', name: 'Wastewater Systems', path: 'gallatin/wastewater_treatment_systems' },
    { id: 'water_supply', name: 'Water Supply Systems', path: 'gallatin/water_supply_systems' },
  ],
}

// Generate distinct colors for each dataset
const COLORS = [
  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
  '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
  '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000',
  '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080',
  '#000000', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
  '#ffeaa7', '#dfe6e9', '#ff7675', '#74b9ff', '#a29bfe',
]

function getColor(index: number): string {
  return COLORS[index % COLORS.length]
}

interface LayerData {
  id: string
  name: string
  path: string
  data: any | null
  loading: boolean
  error: string | null
  featureCount: number
  geometryType: string | null
  color: string
}

export default function TestMap() {
  const [layers, setLayers] = useState<{ [id: string]: LayerData }>({})
  const [enabledLayers, setEnabledLayers] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Core Layers', 'Districts & Zones', 'Subdivisions'])
  )

  // Initialize layers
  useEffect(() => {
    const initialLayers: { [id: string]: LayerData } = {}
    let colorIndex = 0

    Object.entries(DATASETS).forEach(([, datasets]) => {
      datasets.forEach((dataset) => {
        initialLayers[dataset.id] = {
          ...dataset,
          data: null,
          loading: false,
          error: null,
          featureCount: 0,
          geometryType: null,
          color: getColor(colorIndex++),
        }
      })
    })

    setLayers(initialLayers)
  }, [])

  // Load a layer - use functional state update to avoid stale closure issues
  const loadLayer = useCallback(async (layerId: string) => {
    // Get the layer path from DATASETS directly to avoid stale state
    let layerPath: string | null = null
    Object.values(DATASETS).forEach((datasets) => {
      const found = datasets.find((d) => d.id === layerId)
      if (found) layerPath = found.path
    })

    if (!layerPath) {
      console.error(`Layer ${layerId} not found in DATASETS`)
      return
    }

    // Check if already loaded or loading
    setLayers((prev) => {
      if (prev[layerId]?.data || prev[layerId]?.loading) return prev
      return {
        ...prev,
        [layerId]: { ...prev[layerId], loading: true, error: null },
      }
    })

    try {
      console.log(`Loading layer: ${layerId} from /api/test-layers/${layerPath}`)
      const response = await fetch(`/api/test-layers/${layerPath}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()
      const featureCount = data.features?.length || 0

      // Detect all geometry types in the dataset
      const geometryTypes = new Set<string>()
      data.features?.forEach((f: any) => {
        if (f.geometry?.type) {
          geometryTypes.add(f.geometry.type)
        }
      })
      const geometryType = geometryTypes.size > 0
        ? Array.from(geometryTypes).join(', ')
        : null

      console.log(`Loaded ${layerId}: ${featureCount} features, types: ${geometryType}`)

      setLayers((prev) => ({
        ...prev,
        [layerId]: {
          ...prev[layerId],
          data,
          loading: false,
          featureCount,
          geometryType,
        },
      }))
    } catch (error: any) {
      console.error(`Error loading ${layerId}:`, error)
      setLayers((prev) => ({
        ...prev,
        [layerId]: {
          ...prev[layerId],
          loading: false,
          error: error.message,
        },
      }))
    }
  }, [])

  // Toggle layer visibility
  const toggleLayer = useCallback((layerId: string) => {
    setEnabledLayers((prev) => {
      const next = new Set(prev)
      if (next.has(layerId)) {
        next.delete(layerId)
      } else {
        next.add(layerId)
        // Load the layer (loadLayer will check if already loaded)
        loadLayer(layerId)
      }
      return next
    })
  }, [loadLayer])

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  // Enable all layers in a category
  const enableCategory = (category: string) => {
    const datasets = DATASETS[category]
    if (!datasets) return

    datasets.forEach((dataset) => {
      if (!enabledLayers.has(dataset.id)) {
        toggleLayer(dataset.id)
      }
    })
  }

  // Disable all layers
  const disableAll = () => {
    setEnabledLayers(new Set())
  }

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <div className="text-red-600">Mapbox token not configured</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Data Index - Three Forks</title>
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
          rel="stylesheet"
        />
      </Head>

      <div className="flex h-screen">
        {/* Sidebar - Layer List */}
        <aside className="w-80 bg-gray-900 text-white overflow-y-auto">
          <div className="p-4 border-b border-gray-700">
            <h1 className="text-xl font-bold">Data Index</h1>
            <p className="text-sm text-gray-400 mt-1">All Available Datasets</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={disableAll}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
              >
                Clear All
              </button>
              <span className="text-sm text-gray-400 py-1">
                {enabledLayers.size} active
              </span>
            </div>
          </div>

          {Object.entries(DATASETS).map(([category, datasets]) => (
            <div key={category} className="border-b border-gray-700">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800"
              >
                <span className="font-semibold">{category}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      enableCategory(category)
                    }}
                    className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded"
                  >
                    All
                  </button>
                  <span className="text-gray-400">
                    {expandedCategories.has(category) ? '▼' : '▶'}
                  </span>
                </div>
              </button>

              {expandedCategories.has(category) && (
                <div className="pb-2">
                  {datasets.map((dataset) => {
                    const layer = layers[dataset.id]
                    const isEnabled = enabledLayers.has(dataset.id)

                    return (
                      <div
                        key={dataset.id}
                        className={`mx-2 mb-1 rounded ${
                          isEnabled ? 'bg-gray-700' : 'bg-gray-800'
                        }`}
                      >
                        <button
                          onClick={() => toggleLayer(dataset.id)}
                          className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-600 rounded"
                        >
                          {/* Color indicator */}
                          <div
                            className="w-4 h-4 rounded border-2 border-white flex-shrink-0"
                            style={{
                              backgroundColor: isEnabled ? layer?.color : 'transparent',
                            }}
                          />

                          {/* Layer info */}
                          <div className="flex-1 text-left">
                            <div className="text-sm font-medium">{dataset.name}</div>
                            {layer?.loading && (
                              <div className="text-xs text-blue-400">Loading...</div>
                            )}
                            {layer?.error && (
                              <div className="text-xs text-red-400">{layer.error}</div>
                            )}
                            {layer?.data && (
                              <div className="text-xs text-gray-400">
                                {layer.featureCount} features • {layer.geometryType}
                                {layer.geometryType?.includes('GeometryCollection') && (
                                  <span className="text-yellow-400"> ⚠️</span>
                                )}
                              </div>
                            )}
                            {layer?.featureCount === 0 && layer?.data && (
                              <div className="text-xs text-yellow-400">Empty dataset</div>
                            )}
                          </div>

                          {/* Status indicator */}
                          {isEnabled && (
                            <span className="text-green-400 text-lg">✓</span>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Legend */}
          <div className="p-4">
            <h3 className="font-semibold mb-2">Active Layers</h3>
            {enabledLayers.size === 0 ? (
              <p className="text-sm text-gray-500">No layers selected</p>
            ) : (
              <div className="space-y-1">
                {Array.from(enabledLayers).map((layerId) => {
                  const layer = layers[layerId]
                  if (!layer) return null
                  return (
                    <div key={layerId} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: layer.color }}
                      />
                      <span>{layer.name}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1">
          <Map
            mapboxAccessToken={mapboxToken}
            initialViewState={{
              longitude: -111.5,
              latitude: 45.85,
              zoom: 10,
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/light-v11"
          >
            <NavigationControl position="top-right" />

            {/* Render enabled layers - render ALL geometry types for each layer */}
            {Array.from(enabledLayers).map((layerId) => {
              const layer = layers[layerId]
              if (!layer?.data) return null

              return (
                <Source
                  key={layerId}
                  id={`${layerId}-source`}
                  type="geojson"
                  data={layer.data}
                >
                  {/* Polygon fill - filter to only polygons */}
                  <Layer
                    id={`${layerId}-fill`}
                    type="fill"
                    filter={['any',
                      ['==', ['geometry-type'], 'Polygon'],
                      ['==', ['geometry-type'], 'MultiPolygon']
                    ]}
                    paint={{
                      'fill-color': layer.color,
                      'fill-opacity': 0.3,
                    }}
                  />
                  {/* Polygon outline */}
                  <Layer
                    id={`${layerId}-outline`}
                    type="line"
                    filter={['any',
                      ['==', ['geometry-type'], 'Polygon'],
                      ['==', ['geometry-type'], 'MultiPolygon']
                    ]}
                    paint={{
                      'line-color': layer.color,
                      'line-width': 2,
                    }}
                  />

                  {/* Lines - filter to only lines */}
                  <Layer
                    id={`${layerId}-line`}
                    type="line"
                    filter={['any',
                      ['==', ['geometry-type'], 'LineString'],
                      ['==', ['geometry-type'], 'MultiLineString']
                    ]}
                    paint={{
                      'line-color': layer.color,
                      'line-width': 3,
                    }}
                  />

                  {/* Points - filter to only points */}
                  <Layer
                    id={`${layerId}-point`}
                    type="circle"
                    filter={['any',
                      ['==', ['geometry-type'], 'Point'],
                      ['==', ['geometry-type'], 'MultiPoint']
                    ]}
                    paint={{
                      'circle-radius': 6,
                      'circle-color': layer.color,
                      'circle-stroke-width': 2,
                      'circle-stroke-color': '#ffffff',
                    }}
                  />
                </Source>
              )
            })}
          </Map>
        </main>
      </div>
    </>
  )
}
