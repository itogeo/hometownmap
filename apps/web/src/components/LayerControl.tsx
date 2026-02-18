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
  layerOpacity?: { [key: string]: number }
  onOpacityChange?: (layerId: string, opacity: number) => void
}

export default function LayerControl({
  layers,
  visibleLayers,
  onToggleLayer,
  layerConfig,
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
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null)

  // Get layers that are in groups
  const groupedLayerIds = new Set(layerGroups.flatMap(g => g.layers))

  // Get ungrouped layers
  const ungroupedLayers = layers.filter(id => !groupedLayerIds.has(id))

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

  const renderLayerRow = (layerId: string) => {
    const config = layerConfig[layerId]
    if (!config) return null

    const isVisible = visibleLayers.includes(layerId)
    const isExpanded = expandedLayer === layerId
    const color = config.style?.fill || config.style?.stroke || '#6B7280'
    const opacity = layerOpacity[layerId] ?? 100

    return (
      <div key={layerId} className="border-b border-gray-100 last:border-b-0">
        {/* Main row - name is the star */}
        <div
          className="flex items-start gap-2 py-2 px-1 hover:bg-gray-50 cursor-pointer"
          onClick={() => setExpandedLayer(isExpanded ? null : layerId)}
        >
          {/* Color indicator */}
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0 mt-0.5 border"
            style={{
              backgroundColor: isVisible ? color : 'transparent',
              borderColor: color,
              opacity: isVisible ? opacity / 100 : 0.4,
            }}
          />

          {/* Layer name - FULL WIDTH, no truncation */}
          <div className="flex-1 min-w-0">
            <div className={`text-[13px] leading-tight ${
              isVisible ? 'text-gray-900 font-medium' : 'text-gray-400'
            }`}>
              {config.display_name}
            </div>
          </div>

          {/* Toggle checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleLayer(layerId)
            }}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              isVisible
                ? 'bg-blue-600 border-blue-600'
                : 'bg-white border-gray-300 hover:border-gray-400'
            }`}
            aria-label={isVisible ? `Hide ${config.display_name}` : `Show ${config.display_name}`}
          >
            {isVisible && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Expanded: opacity slider */}
        {isExpanded && isVisible && onOpacityChange && (
          <div className="px-6 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 w-10">Opacity</span>
              <input
                type="range"
                min="10"
                max="100"
                value={opacity}
                onChange={(e) => onOpacityChange(layerId, parseInt(e.target.value))}
                className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-[10px] text-gray-500 w-7 text-right">{opacity}%</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Ungrouped layers */}
      {ungroupedLayers.map(renderLayerRow)}

      {/* Layer groups */}
      {layerGroups.map(group => {
        const groupLayers = group.layers.filter(id => layers.includes(id))
        if (groupLayers.length === 0) return null

        const isExpanded = expandedGroups.has(group.id)
        const visibleCount = groupLayers.filter(id => visibleLayers.includes(id)).length

        return (
          <div key={group.id} className="border-t border-gray-200 mt-2 pt-2">
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.id)}
              className="flex items-center gap-2 w-full py-1 text-left"
            >
              <svg
                className={`w-3 h-3 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex-1">
                {group.name}
              </span>
              <span className="text-[10px] text-gray-400">
                {visibleCount}/{groupLayers.length}
              </span>
            </button>

            {/* Group layers */}
            {isExpanded && (
              <div className="mt-1 ml-3 border-l border-gray-100 pl-2">
                {groupLayers.map(renderLayerRow)}
              </div>
            )}
          </div>
        )
      })}

      {ungroupedLayers.length === 0 && layerGroups.length === 0 && (
        <p className="text-[12px] text-gray-400 py-4 text-center">
          No layers available
        </p>
      )}
    </div>
  )
}
