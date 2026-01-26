import React, { useCallback, useMemo } from 'react'
import Map, { Source, Layer, NavigationControl, Marker } from 'react-map-gl'
import type { MapLayerMouseEvent } from 'react-map-gl'

interface Project {
  id: string
  name: string
  category: string
  status: string
  coordinates: [number, number] | [number, number][] | [number, number][][]
  geometryType: string
  [key: string]: any // Allow additional properties from the full project
}

interface ProjectsMapProps {
  projects: Project[]
  selectedProject: Project | null
  onProjectSelect: (project: any) => void
  cityConfig: any
}

const statusColors: { [key: string]: string } = {
  'Completed': '#22C55E',
  'In Progress': '#3B82F6',
  'Planning': '#F59E0B',
  'On Hold': '#6B7280',
}

const categoryIcons: { [key: string]: string } = {
  'Streets': '🛤️',
  'Parks': '🌳',
  'Water/Sewer': '💧',
  'Buildings': '🏛️',
}

export default function ProjectsMap({
  projects,
  selectedProject,
  onProjectSelect,
  cityConfig,
}: ProjectsMapProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50">
        <div className="text-red-600">Mapbox token not configured</div>
      </div>
    )
  }

  // Create GeoJSON for line/polygon projects
  const projectsGeoJSON = useMemo(() => {
    const features = projects
      .filter((p) => p.geometryType !== 'Point')
      .map((project) => ({
        type: 'Feature' as const,
        properties: {
          id: project.id,
          name: project.name,
          status: project.status,
          category: project.category,
          isSelected: selectedProject?.id === project.id,
        },
        geometry: {
          type: project.geometryType as 'LineString' | 'Polygon',
          coordinates: project.coordinates,
        },
      }))

    return {
      type: 'FeatureCollection' as const,
      features,
    }
  }, [projects, selectedProject])

  // Point projects for markers
  const pointProjects = useMemo(() => {
    return projects.filter((p) => p.geometryType === 'Point')
  }, [projects])

  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0]
      if (feature) {
        const project = projects.find((p) => p.id === feature.properties?.id)
        if (project) {
          onProjectSelect(project)
        }
      }
    },
    [projects, onProjectSelect]
  )

  return (
    <Map
      mapboxAccessToken={mapboxToken}
      initialViewState={{
        longitude: cityConfig.map.center[0],
        latitude: cityConfig.map.center[1],
        zoom: 14,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      onClick={handleMapClick}
      interactiveLayerIds={['projects-lines', 'projects-polygons']}
    >
      <NavigationControl position="top-right" />

      {/* Line and Polygon projects */}
      <Source id="projects-source" type="geojson" data={projectsGeoJSON}>
        {/* Lines (streets, sewers, etc.) */}
        <Layer
          id="projects-lines"
          type="line"
          filter={['==', ['geometry-type'], 'LineString']}
          paint={{
            'line-color': [
              'match',
              ['get', 'status'],
              'Completed', '#22C55E',
              'In Progress', '#3B82F6',
              'Planning', '#F59E0B',
              '#6B7280'
            ],
            'line-width': [
              'case',
              ['get', 'isSelected'],
              8,
              5
            ],
            'line-opacity': 0.8,
          }}
        />
        {/* Line labels */}
        <Layer
          id="projects-lines-label"
          type="symbol"
          filter={['==', ['geometry-type'], 'LineString']}
          layout={{
            'symbol-placement': 'line-center',
            'text-field': ['get', 'name'],
            'text-size': 11,
            'text-allow-overlap': false,
          }}
          paint={{
            'text-color': '#1F2937',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
          }}
        />

        {/* Polygons (buildings, areas) */}
        <Layer
          id="projects-polygons"
          type="fill"
          filter={['==', ['geometry-type'], 'Polygon']}
          paint={{
            'fill-color': [
              'match',
              ['get', 'status'],
              'Completed', '#22C55E',
              'In Progress', '#3B82F6',
              'Planning', '#F59E0B',
              '#6B7280'
            ],
            'fill-opacity': [
              'case',
              ['get', 'isSelected'],
              0.6,
              0.4
            ],
          }}
        />
        <Layer
          id="projects-polygons-outline"
          type="line"
          filter={['==', ['geometry-type'], 'Polygon']}
          paint={{
            'line-color': [
              'match',
              ['get', 'status'],
              'Completed', '#16A34A',
              'In Progress', '#2563EB',
              'Planning', '#D97706',
              '#4B5563'
            ],
            'line-width': [
              'case',
              ['get', 'isSelected'],
              3,
              2
            ],
          }}
        />
      </Source>

      {/* Point project markers */}
      {pointProjects.map((project) => {
        const isSelected = selectedProject?.id === project.id
        const color = statusColors[project.status] || '#6B7280'
        const coords = project.coordinates as [number, number]

        return (
          <Marker
            key={project.id}
            longitude={coords[0]}
            latitude={coords[1]}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              onProjectSelect(project)
            }}
          >
            <div
              className={`cursor-pointer transition-all ${isSelected ? 'scale-125' : 'hover:scale-110'}`}
              title={project.name}
            >
              {/* Outer ring */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isSelected ? 'ring-4 ring-blue-300' : ''
                }`}
                style={{
                  backgroundColor: color,
                  boxShadow: isSelected ? `0 0 20px ${color}` : `0 2px 8px rgba(0,0,0,0.3)`,
                }}
              >
                <span className="text-lg">{categoryIcons[project.category] || '📋'}</span>
              </div>
            </div>
          </Marker>
        )
      })}
    </Map>
  )
}
