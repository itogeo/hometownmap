import { LayerConfig } from '@/types'

interface LayerControlProps {
  layers: string[]
  visibleLayers: string[]
  onToggleLayer: (layerId: string) => void
  layerConfig: { [key: string]: LayerConfig }
}

export default function LayerControl({
  layers,
  visibleLayers,
  onToggleLayer,
  layerConfig,
}: LayerControlProps) {
  return (
    <div>
      <h3 className="font-bold text-gray-800 mb-3">Map Layers</h3>
      <div className="space-y-2">
        {layers.map((layerId) => {
          const config = layerConfig[layerId]
          if (!config) return null

          const isVisible = visibleLayers.includes(layerId)

          return (
            <label
              key={layerId}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => onToggleLayer(layerId)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span
                className={`text-sm ${
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

      {layers.length === 0 && (
        <p className="text-sm text-gray-500">
          No layers available for this mode
        </p>
      )}
    </div>
  )
}
