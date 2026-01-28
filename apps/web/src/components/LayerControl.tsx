import { LayerConfig } from '@/types'

interface LayerControlProps {
  layers: string[]
  visibleLayers: string[]
  onToggleLayer: (layerId: string) => void
  layerConfig: { [key: string]: LayerConfig }
  layerOrder: string[]
  onReorderLayer: (layerId: string, direction: 'up' | 'down') => void
}

export default function LayerControl({
  layers,
  visibleLayers,
  onToggleLayer,
  layerConfig,
  layerOrder,
  onReorderLayer,
}: LayerControlProps) {
  const displayLayers = layerOrder.filter(id => layers.includes(id))

  return (
    <div className="space-y-0.5">
      {displayLayers.map((layerId, index) => {
        const config = layerConfig[layerId]
        if (!config) return null

        const isVisible = visibleLayers.includes(layerId)
        const color = config.style?.fill || config.style?.stroke || '#888'

        return (
          <div
            key={layerId}
            className="flex items-center gap-1.5 py-0.5 text-[11px]"
          >
            {/* Reorder */}
            <div className="flex flex-col text-[8px] text-gray-400 leading-none">
              <button
                onClick={() => onReorderLayer(layerId, 'up')}
                disabled={index === 0}
                className={index === 0 ? 'opacity-20' : 'hover:text-gray-600'}
              >
                ▲
              </button>
              <button
                onClick={() => onReorderLayer(layerId, 'down')}
                disabled={index === displayLayers.length - 1}
                className={index === displayLayers.length - 1 ? 'opacity-20' : 'hover:text-gray-600'}
              >
                ▼
              </button>
            </div>

            {/* Toggle */}
            <button
              onClick={() => onToggleLayer(layerId)}
              className="flex-1 flex items-center gap-1.5 text-left"
            >
              <div
                className="w-2.5 h-2.5 rounded-sm border"
                style={{
                  backgroundColor: isVisible ? color : 'transparent',
                  borderColor: color,
                  opacity: isVisible ? 1 : 0.4,
                }}
              />
              <span className={isVisible ? 'text-gray-900' : 'text-gray-400'}>
                {config.display_name}
              </span>
            </button>
          </div>
        )
      })}

      {displayLayers.length === 0 && (
        <p className="text-[10px] text-gray-400 py-2">No layers</p>
      )}
    </div>
  )
}
