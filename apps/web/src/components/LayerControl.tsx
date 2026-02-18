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
}: LayerControlProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    layerGroups.forEach(g => {
      if (g.defaultExpanded) initial.add(g.id)
    })
    return initial
  })

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

  const renderLayerRow = (layerId: string, isNested: boolean = false) => {
    const config = layerConfig[layerId]
    if (!config) return null

    const isVisible = visibleLayers.includes(layerId)
    const color = config.style?.fill || config.style?.stroke || '#6B7280'

    return (
      <div
        key={layerId}
        className={`flex items-center gap-3 py-2 ${isNested ? 'pl-4' : ''}`}
      >
        {/* Color indicator */}
        <div
          className="w-3 h-3 rounded-sm flex-shrink-0 shadow-sm"
          style={{
            backgroundColor: isVisible ? color : '#E5E7EB',
            opacity: isVisible ? 1 : 0.5,
          }}
        />

        {/* Layer name - the star of the show */}
        <span
          className={`flex-1 text-[13px] leading-tight ${
            isVisible ? 'text-gray-900 font-medium' : 'text-gray-400'
          }`}
        >
          {config.display_name}
        </span>

        {/* Simple checkbox toggle */}
        <button
          onClick={() => onToggleLayer(layerId)}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
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
    )
  }

  return (
    <div className="space-y-1">
      {/* Ungrouped layers */}
      {ungroupedLayers.map((layerId) => renderLayerRow(layerId))}

      {/* Layer groups */}
      {layerGroups.map(group => {
        const groupLayers = group.layers.filter(id => layers.includes(id))
        if (groupLayers.length === 0) return null

        const isExpanded = expandedGroups.has(group.id)
        const visibleCount = groupLayers.filter(id => visibleLayers.includes(id)).length

        return (
          <div key={group.id} className="pt-2">
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.id)}
              className="flex items-center gap-2 w-full py-1.5 text-left group"
            >
              <svg
                className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                {group.name}
              </span>
              <span className="text-[11px] text-gray-400 ml-auto">
                {visibleCount > 0 ? `${visibleCount} on` : 'off'}
              </span>
            </button>

            {/* Group layers */}
            {isExpanded && (
              <div className="mt-1 border-l-2 border-gray-100 ml-1.5">
                {groupLayers.map((layerId) => renderLayerRow(layerId, true))}
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
