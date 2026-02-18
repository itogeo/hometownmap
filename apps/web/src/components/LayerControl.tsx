import { LayerConfig, LayerGroup } from '@/types'
import { useState, useCallback } from 'react'
import Link from 'next/link'

interface ExtendedLayerGroup extends LayerGroup {
  locked?: boolean
  lockMessage?: string
}

interface ExtendedLayerConfig extends LayerConfig {
  data_freshness?: string
  locked?: boolean
  lockMessage?: string
}

interface LayerControlProps {
  layers: string[]
  visibleLayers: string[]
  onToggleLayer: (layerId: string) => void
  layerConfig: { [key: string]: ExtendedLayerConfig }
  layerOrder: string[]
  onReorderLayer: (layerId: string, direction: 'up' | 'down') => void
  layerGroups?: ExtendedLayerGroup[]
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

  const toggleAllInGroup = (group: ExtendedLayerGroup) => {
    if (group.locked) return // Don't toggle locked groups

    const groupLayers = group.layers.filter(id => layers.includes(id) && !layerConfig[id]?.locked)
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
    // Turn off all current layers (except locked)
    visibleLayers.forEach(layerId => {
      if (!preset.layers.includes(layerId) && !layerConfig[layerId]?.locked) {
        onToggleLayer(layerId)
      }
    })
    // Turn on preset layers (except locked)
    preset.layers.forEach(layerId => {
      if (!visibleLayers.includes(layerId) && layers.includes(layerId) && !layerConfig[layerId]?.locked) {
        onToggleLayer(layerId)
      }
    })
    setShowPresets(false)
  }

  const handleDragStart = useCallback((layerId: string, config: ExtendedLayerConfig) => {
    if (config.locked) return
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
    const config = layerConfig[layerId] as ExtendedLayerConfig
    if (!config) return null

    const isLocked = config.locked
    const isVisible = visibleLayers.includes(layerId)
    const isExpanded = expandedLayers.has(layerId)
    const color = config.style?.fill || config.style?.stroke || '#888'
    const opacity = layerOpacity[layerId] ?? 100
    const hasDescription = !!config.description

    return (
      <div
        key={layerId}
        className={`border-b border-gray-50 last:border-b-0 ${draggedLayer === layerId ? 'opacity-50' : ''} ${isLocked ? 'opacity-60' : ''}`}
        draggable={!isLocked}
        onDragStart={() => handleDragStart(layerId, config)}
        onDragOver={(e) => handleDragOver(e, layerId)}
        onDragEnd={handleDragEnd}
      >
        <div className={`flex items-center gap-2 py-1.5 px-1 ${isLocked ? 'bg-gray-50' : 'hover:bg-gray-50 cursor-move'}`}>
          {/* Drag handle or lock icon */}
          {isLocked ? (
            <div className="text-gray-400 flex-shrink-0" title={config.lockMessage || 'Available with City Partnership'}>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1C9.79 1 8 2.79 8 5v3H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2h-2V5c0-2.21-1.79-4-4-4zm0 2c1.1 0 2 .9 2 2v3h-4V5c0-1.1.9-2 2-2zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
              </svg>
            </div>
          ) : (
            <div className="text-gray-300 hover:text-gray-500 flex-shrink-0">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
              </svg>
            </div>
          )}

          {/* Color swatch / legend key */}
          <div
            className="w-4 h-4 rounded flex-shrink-0 border"
            style={{
              backgroundColor: isVisible && !isLocked ? color : 'transparent',
              borderColor: color,
              opacity: isVisible && !isLocked ? opacity / 100 : 0.3,
            }}
          />

          {/* Layer name */}
          <span
            className={`flex-1 text-[11px] truncate ${isLocked ? 'cursor-default' : 'cursor-pointer'} ${
              isLocked ? 'text-gray-400 italic' : isVisible ? 'text-gray-800' : 'text-gray-400'
            }`}
            onClick={() => !isLocked && toggleLayerExpanded(layerId)}
          >
            {config.display_name}
            {isLocked && <span className="ml-1 text-[9px]">🔒</span>}
          </span>

          {/* Data freshness badge */}
          {config.data_freshness && !isLocked && (
            <span className="text-[8px] px-1 py-0.5 bg-gray-100 text-gray-500 rounded flex-shrink-0" title="Data freshness">
              {config.data_freshness}
            </span>
          )}

          {/* Info icon */}
          {hasDescription && !isLocked && (
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

          {/* Toggle switch or lock indicator */}
          {isLocked ? (
            <Link
              href="/partnership"
              className="text-[8px] text-blue-600 hover:text-blue-800 hover:underline flex-shrink-0"
            >
              Unlock
            </Link>
          ) : (
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
          )}
        </div>

        {/* Expanded details */}
        {isExpanded && !isLocked && (
          <div className="px-2 pb-2 pt-1 bg-gray-50 text-[10px]">
            {config.description && (
              <p className="text-gray-600 mb-2">{config.description}</p>
            )}

            {/* Data freshness in detail */}
            {config.data_freshness && (
              <div className="flex items-center gap-1 mb-2 text-gray-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Data: {config.data_freshness}</span>
              </div>
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
              const matchingLayers = preset.layers.filter(l => layers.includes(l) && !layerConfig[l]?.locked)
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
        const isLocked = group.locked
        const unlockedLayers = groupLayers.filter(id => !layerConfig[id]?.locked)
        const visibleCount = unlockedLayers.filter(id => visibleLayers.includes(id)).length
        const allVisible = unlockedLayers.length > 0 && visibleCount === unlockedLayers.length

        return (
          <div key={group.id} className={`border rounded-lg overflow-hidden ${isLocked ? 'border-gray-300 bg-gray-50' : 'border-gray-200'}`}>
            {/* Group header */}
            <div className={`flex items-center gap-2 px-2 py-1.5 ${isLocked ? 'bg-gray-100' : 'bg-gray-50'}`}>
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
                <span className={`text-[11px] font-medium ${isLocked ? 'text-gray-500' : 'text-gray-700'}`}>
                  {group.name}
                  {isLocked && <span className="ml-1">🔒</span>}
                </span>
                {!isLocked && (
                  <span className="text-[10px] text-gray-400">
                    ({visibleCount}/{unlockedLayers.length})
                  </span>
                )}
              </button>

              {/* Toggle all button or lock message */}
              {isLocked ? (
                <Link
                  href="/partnership"
                  className="text-[9px] text-blue-600 hover:text-blue-800 hover:underline flex-shrink-0"
                >
                  {group.lockMessage || 'Available with City Partnership'}
                </Link>
              ) : (
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
              )}
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
