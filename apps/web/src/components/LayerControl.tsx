import { LayerConfig, LayerGroup } from '@/types'
import { useState } from 'react'

interface LayerControlProps {
  layers: string[]
  visibleLayers: string[]
  onToggleLayer: (layerId: string) => void
  layerConfig: { [key: string]: LayerConfig }
  layerOrder: string[]
  onReorderLayer: (layerId: string, direction: 'up' | 'down') => void
  layerGroups?: LayerGroup[]
}

export default function LayerControl({
  layers,
  visibleLayers,
  onToggleLayer,
  layerConfig,
  layerOrder,
  onReorderLayer,
  layerGroups = [],
}: LayerControlProps) {
  // Track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    layerGroups.forEach(g => {
      if (g.defaultExpanded) initial.add(g.id)
    })
    return initial
  })

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

  const toggleAllInGroup = (group: LayerGroup) => {
    const groupLayers = group.layers.filter(id => layers.includes(id))
    const allVisible = groupLayers.every(id => visibleLayers.includes(id))

    // Toggle all off if all visible, otherwise toggle all on
    groupLayers.forEach(layerId => {
      const isVisible = visibleLayers.includes(layerId)
      if (allVisible && isVisible) {
        onToggleLayer(layerId)
      } else if (!allVisible && !isVisible) {
        onToggleLayer(layerId)
      }
    })
  }

  const renderLayerRow = (layerId: string, index: number, totalCount: number) => {
    const config = layerConfig[layerId]
    if (!config) return null

    const isVisible = visibleLayers.includes(layerId)
    const color = config.style?.fill || config.style?.stroke || '#888'

    return (
      <div
        key={layerId}
        className="flex items-center gap-2 py-1 px-1 rounded hover:bg-gray-50"
      >
        {/* Color swatch */}
        <div
          className="w-3 h-3 rounded flex-shrink-0"
          style={{
            backgroundColor: isVisible ? color : 'transparent',
            border: `2px solid ${color}`,
            opacity: isVisible ? 1 : 0.4,
          }}
        />

        {/* Layer name */}
        <span
          className={`flex-1 text-[11px] truncate ${isVisible ? 'text-gray-800' : 'text-gray-400'}`}
        >
          {config.display_name}
        </span>

        {/* Toggle switch */}
        <button
          onClick={() => onToggleLayer(layerId)}
          className={`relative w-7 h-4 rounded-full transition-colors flex-shrink-0 ${
            isVisible ? 'bg-blue-500' : 'bg-gray-300'
          }`}
          role="switch"
          aria-checked={isVisible}
        >
          <span
            className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
              isVisible ? 'translate-x-3.5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Render ungrouped layers first */}
      {ungroupedLayers.length > 0 && (
        <div className="space-y-0.5">
          {ungroupedLayers.map((layerId, index) =>
            renderLayerRow(layerId, index, ungroupedLayers.length)
          )}
        </div>
      )}

      {/* Render layer groups */}
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
              <div className="px-2 py-1 space-y-0.5 border-t border-gray-100">
                {groupLayers.map((layerId, index) =>
                  renderLayerRow(layerId, index, groupLayers.length)
                )}
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
    </div>
  )
}
