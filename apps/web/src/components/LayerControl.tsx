import { LayerConfig } from '@/types'

interface LayerControlProps {
  layers: string[]
  visibleLayers: string[]
  onToggleLayer: (layerId: string) => void
  layerConfig: { [key: string]: LayerConfig }
  allLayers?: string[]
}

export default function LayerControl({
  layers,
  visibleLayers,
  onToggleLayer,
  layerConfig,
  allLayers,
}: LayerControlProps) {
  // Use allLayers if provided, otherwise use layers from mode
  const displayLayers = allLayers || layers

  return (
    <div>
      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Map Layers
      </h3>
      <div className="space-y-2">
        {displayLayers.map((layerId) => {
          const config = layerConfig[layerId]
          if (!config) return null

          const isVisible = visibleLayers.includes(layerId)
          const fillColor = config.style?.fill || '#3388ff'
          const strokeColor = config.style?.stroke || fillColor

          return (
            <label
              key={layerId}
              className="flex items-center gap-2 cursor-pointer group p-1.5 rounded hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => onToggleLayer(layerId)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              {/* Color swatch */}
              <div
                className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                style={{
                  backgroundColor: fillColor,
                  opacity: config.style?.['fill-opacity'] || 0.3,
                  borderColor: strokeColor,
                  borderWidth: '2px'
                }}
              />
              <span
                className={`text-sm flex-1 ${
                  isVisible
                    ? 'text-gray-800 font-medium'
                    : 'text-gray-500 group-hover:text-gray-700'
                }`}
              >
                {config.display_name}
              </span>
            </label>
          )
        })}
      </div>

      {displayLayers.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          No layers available for this mode
        </p>
      )}
    </div>
  )
}
