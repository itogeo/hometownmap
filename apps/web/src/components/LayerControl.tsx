import { LayerConfig, LayerGroup } from '@/types'
import { useState, useCallback } from 'react'

interface LayerControlProps {
  layers: string[]
  visibleLayers: string[]
  onToggleLayer: (layerId: string) => void
  layerConfig: { [key: string]: LayerConfig }
  layerOrder: string[]
  onReorderLayer: (layerId: string, direction: 'up' | 'down') => void
  layerGroups?: LayerGroup[]
  layerOpacity?: { [key: string]: number }
  onOpacityChange?: (layerId: string, opacity: number) => void
}

// Preset view configurations
const PRESETS = [
  { id: 'flood_risk', name: 'Flood Risk', icon: '💧', layers: ['floodplain_100yr', 'floodplain_500yr', 'fema_flood', 'parcels', 'cities'] },
  { id: 'development', name: 'Development', icon: '🏗️', layers: ['parcels', 'building_permits', 'projects', 'subdivisions', 'cities'] },
  { id: 'zoning', name: 'Zoning', icon: '📋', layers: ['zoning', 'parcels', 'cities'] },
  { id: 'infrastructure', name: 'Infrastructure', icon: '🔧', layers: ['water_supply', 'wastewater', 'hydrants', 'cities'] },
]

export default function LayerControl({
  layers,
  visibleLayers,
  onToggleLayer,
  layerConfig,
  layerOrder,
  onReorderLayer,
  layerGroups = [],
  layerOpacity = {},
  onOpacityChange,
}: LayerControlProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    layerGroups.forEach(g => {
      if (g.defaultExpanded) initial.add(g.id)
    })
    return initial
  })
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set())
  const [showPresets, setShowPresets] = useState(false)
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null)

  // Get layers that are in groups
  const groupedLayerIds = new Set(layerGroups.flatMap(g => g.layers))

  // Get ungrouped layers (layers not in any group)
  const ungroupedLayers = layerOrder.filter(id =>
    layers.includes(id) && !groupedLayerIds.has(id)
  )

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const toggleLayerExpanded = (layerId: string) => {
    setExpandedLayers(prev => {
      const next = new Set(prev)
      if (next.has(layerId)) {
        next.delete(layerId)
      } else {
        next.add(layerId)
      }
      return next
    })
  }

  const toggleAllInGroup = (group: LayerGroup) => {
    const groupLayers = group.layers.filter(id => layers.includes(id))
    const allVisible = groupLayers.every(id => visibleLayers.includes(id))

    groupLayers.forEach(layerId => {
      const isVisible = visibleLayers.includes(layerId)
      if (allVisible && isVisible) {
        onToggleLayer(layerId)
      } else if (!allVisible && !isVisible) {
        onToggleLayer(layerId)
      }
    })
  }

  const applyPreset = (preset: typeof PRESETS[0]) => {
    // Turn off all current layers
    visibleLayers.forEach(layerId => {
      if (!preset.layers.includes(layerId)) {
        onToggleLayer(layerId)
      }
    })
    // Turn on preset layers
    preset.layers.forEach(layerId => {
      if (!visibleLayers.includes(layerId) && layers.includes(layerId)) {
        onToggleLayer(layerId)
      }
    })
    setShowPresets(false)
  }

  const handleDragStart = useCallback((layerId: string) => {
    setDraggedLayer(layerId)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault()
    if (draggedLayer && draggedLayer !== targetLayerId) {
      const draggedIndex = layerOrder.indexOf(draggedLayer)
      const targetIndex = layerOrder.indexOf(targetLayerId)
      if (draggedIndex < targetIndex) {
        onReorderLayer(draggedLayer, 'down')
      } else {
        onReorderLayer(draggedLayer, 'up')
      }
    }
  }, [draggedLayer, layerOrder, onReorderLayer])

  const handleDragEnd = useCallback(() => {
    setDraggedLayer(null)
  }, [])

  const renderLayerRow = (layerId: string) => {
    const config = layerConfig[layerId]
    if (!config) return null

    const isVisible = visibleLayers.includes(layerId)
    const isExpanded = expandedLayers.has(layerId)
    const color = config.style?.fill || config.style?.stroke || '#888'
    const opacity = layerOpacity[layerId] ?? 100
    const hasDescription = !!config.description

    return (
      <div
        key={layerId}
        className={`border-b border-gray-50 last:border-b-0 ${draggedLayer === layerId ? 'opacity-50' : ''}`}
        draggable
        onDragStart={() => handleDragStart(layerId)}
        onDragOver={(e) => handleDragOver(e, layerId)}
        onDragEnd={handleDragEnd}
      >
        <div className="flex items-center gap-2 py-1.5 px-1 hover:bg-gray-50 cursor-move">
          {/* Drag handle */}
          <div className="text-gray-300 hover:text-gray-500 flex-shrink-0">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
            </svg>
          </div>

          {/* Color swatch / legend key */}
          <div
            className="w-4 h-4 rounded flex-shrink-0 border"
            style={{
              backgroundColor: isVisible ? color : 'transparent',
              borderColor: color,
              opacity: isVisible ? opacity / 100 : 0.3,
            }}
          />

          {/* Layer name */}
          <span
            className={`flex-1 text-[11px] truncate cursor-pointer ${isVisible ? 'text-gray-800' : 'text-gray-400'}`}
            onClick={() => toggleLayerExpanded(layerId)}
          >
            {config.display_name}
          </span>

          {/* Info icon */}
          {hasDescription && (
            <button
              onClick={() => toggleLayerExpanded(layerId)}
              className="text-gray-300 hover:text-gray-500 flex-shrink-0 p-0.5"
              title={config.description}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}

          {/* Toggle switch */}
          <button
            onClick={() => onToggleLayer(layerId)}
            className={`relative w-8 h-4 rounded-full transition-colors flex-shrink-0 ${
              isVisible ? 'bg-blue-500' : 'bg-gray-300'
            }`}
            role="switch"
            aria-checked={isVisible}
          >
            <span
              className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
                isVisible ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="px-2 pb-2 pt-1 bg-gray-50 text-[10px]">
            {config.description && (
              <p className="text-gray-600 mb-2">{config.description}</p>
            )}

            {/* Opacity slider */}
            {onOpacityChange && isVisible && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-500 w-12">Opacity</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={(e) => onOpacityChange(layerId, parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-gray-600 w-8 text-right">{opacity}%</span>
              </div>
            )}

            {/* Source info */}
            <div className="flex items-center justify-between text-gray-400">
              <span>Source: {config.source}</span>
              {config.minzoom && <span>Min zoom: {config.minzoom}</span>}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Preset Views */}
      <div className="border-b border-gray-100 pb-2">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center justify-between w-full text-[11px] font-medium text-gray-600 hover:text-gray-800 py-1"
        >
          <span>Quick Views</span>
          <svg
            className={`w-3 h-3 transition-transform ${showPresets ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showPresets && (
          <div className="grid grid-cols-2 gap-1 mt-1">
            {PRESETS.map(preset => {
              const matchingLayers = preset.layers.filter(l => layers.includes(l))
              if (matchingLayers.length === 0) return null

              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded transition-colors"
                >
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Ungrouped layers */}
      {ungroupedLayers.length > 0 && (
        <div className="space-y-0">
          {ungroupedLayers.map((layerId) => renderLayerRow(layerId))}
        </div>
      )}

      {/* Layer groups */}
      {layerGroups.map(group => {
        const groupLayers = group.layers.filter(id => layers.includes(id))
        if (groupLayers.length === 0) return null

        const isExpanded = expandedGroups.has(group.id)
        const visibleCount = groupLayers.filter(id => visibleLayers.includes(id)).length
        const allVisible = visibleCount === groupLayers.length

        return (
          <div key={group.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Group header */}
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50">
              <button
                onClick={() => toggleGroup(group.id)}
                className="flex items-center gap-1.5 flex-1 text-left"
              >
                <svg
                  className={`w-3 h-3 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-[11px] font-medium text-gray-700">
                  {group.name}
                </span>
                <span className="text-[10px] text-gray-400">
                  ({visibleCount}/{groupLayers.length})
                </span>
              </button>

              {/* Toggle all button */}
              <button
                onClick={() => toggleAllInGroup(group)}
                className={`relative w-7 h-4 rounded-full transition-colors flex-shrink-0 ${
                  allVisible ? 'bg-blue-500' : visibleCount > 0 ? 'bg-blue-300' : 'bg-gray-300'
                }`}
                title={allVisible ? 'Hide all' : 'Show all'}
              >
                <span
                  className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
                    allVisible ? 'translate-x-3.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Group layers */}
            {isExpanded && (
              <div className="border-t border-gray-100">
                {groupLayers.map((layerId) => renderLayerRow(layerId))}
              </div>
            )}
          </div>
        )
      })}

      {ungroupedLayers.length === 0 && layerGroups.length === 0 && (
        <p className="text-[11px] text-gray-400 py-3 text-center">
          No layers available
        </p>
      )}

      {/* Legend note */}
      <div className="pt-2 border-t border-gray-100">
        <p className="text-[9px] text-gray-400 text-center">
          Drag layers to reorder. Click name for details.
        </p>
      </div>
    </div>
  )
}
