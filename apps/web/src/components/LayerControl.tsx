import { LayerConfig } from '@/types'
import { useState } from 'react'

interface LayerControlProps {
  layers: string[]
  visibleLayers: string[]
  onToggleLayer: (layerId: string) => void
  layerConfig: { [key: string]: LayerConfig }
  layerOrder: string[]
  onReorderLayer: (layerId: string, direction: 'up' | 'down') => void
}

// Data freshness information - days since last update
const LAYER_DATA_FRESHNESS: Record<string, { lastUpdate: string; frequency: string }> = {
  parcels: { lastUpdate: '2025-02-15', frequency: 'Weekly' },
  public_lands: { lastUpdate: '2025-02-15', frequency: 'Weekly' },
  hydrants: { lastUpdate: '2025-02-10', frequency: 'Quarterly' },
  subdivisions: { lastUpdate: '2025-01-20', frequency: 'Monthly' },
  floodplain: { lastUpdate: '2024-12-01', frequency: 'Yearly' },
  wui: { lastUpdate: '2024-12-01', frequency: 'Yearly' },
  conservation: { lastUpdate: '2025-01-15', frequency: 'Quarterly' },
  firedistricts: { lastUpdate: '2024-12-01', frequency: 'Yearly' },
  schooldistricts: { lastUpdate: '2024-12-01', frequency: 'Yearly' },
}

function getDaysSinceUpdate(dateStr: string): number {
  const lastUpdate = new Date(dateStr)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - lastUpdate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getFreshnessIndicator(layerId: string): { color: string; label: string } | null {
  const info = LAYER_DATA_FRESHNESS[layerId]
  if (!info) return null

  const days = getDaysSinceUpdate(info.lastUpdate)

  if (days <= 7) {
    return { color: '#22C55E', label: 'Updated this week' }
  } else if (days <= 30) {
    return { color: '#EAB308', label: `Updated ${days} days ago` }
  } else {
    return { color: '#94A3B8', label: `Updated ${days} days ago` }
  }
}

export default function LayerControl({
  layers,
  visibleLayers,
  onToggleLayer,
  layerConfig,
  layerOrder,
  onReorderLayer,
}: LayerControlProps) {
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null)
  const displayLayers = layerOrder.filter(id => layers.includes(id))

  return (
    <div className="space-y-1">
      {displayLayers.map((layerId, index) => {
        const config = layerConfig[layerId]
        if (!config) return null

        const isVisible = visibleLayers.includes(layerId)
        const color = config.style?.fill || config.style?.stroke || '#888'
        const freshness = getFreshnessIndicator(layerId)
        const isHovered = hoveredLayer === layerId

        return (
          <div
            key={layerId}
            className="relative flex items-center gap-2 py-1.5 px-1 rounded hover:bg-gray-50 transition-colors"
            onMouseEnter={() => setHoveredLayer(layerId)}
            onMouseLeave={() => setHoveredLayer(null)}
          >
            {/* Reorder buttons */}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => onReorderLayer(layerId, 'up')}
                disabled={index === 0}
                className={`w-5 h-4 flex items-center justify-center rounded text-[10px] transition-colors ${
                  index === 0
                    ? 'text-gray-200 cursor-not-allowed'
                    : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                }`}
                aria-label={`Move ${config.display_name} up`}
                title="Move layer up"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => onReorderLayer(layerId, 'down')}
                disabled={index === displayLayers.length - 1}
                className={`w-5 h-4 flex items-center justify-center rounded text-[10px] transition-colors ${
                  index === displayLayers.length - 1
                    ? 'text-gray-200 cursor-not-allowed'
                    : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                }`}
                aria-label={`Move ${config.display_name} down`}
                title="Move layer down"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Color swatch */}
            <div
              className="w-4 h-4 rounded border-2 flex-shrink-0"
              style={{
                backgroundColor: isVisible ? color : 'transparent',
                borderColor: color,
                opacity: isVisible ? 1 : 0.5,
              }}
              title={`Layer color: ${color}`}
            />

            {/* Layer name and freshness */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[11px] truncate ${isVisible ? 'text-gray-900 font-medium' : 'text-gray-400'}`}
                  title={config.display_name}
                >
                  {config.display_name}
                </span>
                {freshness && (
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: freshness.color }}
                    title={freshness.label}
                  />
                )}
              </div>
              {/* Show freshness info on hover */}
              {isHovered && freshness && (
                <div className="text-[9px] text-gray-400 mt-0.5">
                  {freshness.label}
                </div>
              )}
            </div>

            {/* Toggle switch */}
            <button
              onClick={() => onToggleLayer(layerId)}
              className={`relative w-8 h-5 rounded-full transition-colors flex-shrink-0 ${
                isVisible ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={isVisible}
              aria-label={`Toggle ${config.display_name} layer ${isVisible ? 'off' : 'on'}`}
              title={isVisible ? 'Click to hide layer' : 'Click to show layer'}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  isVisible ? 'translate-x-3.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        )
      })}

      {displayLayers.length === 0 && (
        <p className="text-[11px] text-gray-400 py-3 text-center">
          No layers available for this mode
        </p>
      )}

      {/* Legend help */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 text-[9px] text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>Recent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            <span>This month</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            <span>Older</span>
          </div>
        </div>
      </div>
    </div>
  )
}
