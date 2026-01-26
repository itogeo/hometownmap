import { useState } from 'react'
import { LayerConfig } from '@/types'

interface LayerControlProps {
  layers: string[]
  visibleLayers: string[]
  onToggleLayer: (layerId: string) => void
  layerConfig: { [key: string]: LayerConfig }
  allLayers?: string[]
  onReorderLayers?: (newOrder: string[]) => void
}

export default function LayerControl({
  layers,
  visibleLayers,
  onToggleLayer,
  layerConfig,
  allLayers,
  onReorderLayers,
}: LayerControlProps) {
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null)
  const [layerOrder, setLayerOrder] = useState<string[]>(allLayers || layers)

  // Update layer order when allLayers changes
  const displayLayers = layerOrder.filter(id => (allLayers || layers).includes(id))

  const handleDragStart = (e: React.DragEvent, layerId: string) => {
    setDraggedLayer(layerId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, layerId: string) => {
    e.preventDefault()
    if (!draggedLayer || draggedLayer === layerId) return

    const newOrder = [...layerOrder]
    const dragIndex = newOrder.indexOf(draggedLayer)
    const hoverIndex = newOrder.indexOf(layerId)

    if (dragIndex !== -1 && hoverIndex !== -1) {
      newOrder.splice(dragIndex, 1)
      newOrder.splice(hoverIndex, 0, draggedLayer)
      setLayerOrder(newOrder)
    }
  }

  const handleDragEnd = () => {
    setDraggedLayer(null)
    if (onReorderLayers) {
      onReorderLayers(layerOrder)
    }
  }

  return (
    <div>
      <h3 className="font-semibold text-xs text-gray-700 mb-1.5 flex items-center gap-1">
        <span>🗺️</span> Layers
      </h3>
      <div className="space-y-0.5">
        {displayLayers.map((layerId) => {
          const config = layerConfig[layerId]
          if (!config) return null

          const isVisible = visibleLayers.includes(layerId)
          const fillColor = config.style?.fill || '#3388ff'
          const isDragging = draggedLayer === layerId

          return (
            <label
              key={layerId}
              draggable
              onDragStart={(e) => handleDragStart(e, layerId)}
              onDragOver={(e) => handleDragOver(e, layerId)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-1.5 cursor-pointer p-1 rounded text-xs transition-all ${
                isDragging ? 'opacity-50 bg-blue-100' : 'hover:bg-gray-50'
              }`}
            >
              {/* Drag handle */}
              <span className="text-gray-300 cursor-grab active:cursor-grabbing text-[10px]">⋮⋮</span>
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => onToggleLayer(layerId)}
                className="w-3 h-3 text-blue-600 rounded focus:ring-1 focus:ring-blue-500"
              />
              {/* Color dot */}
              <div
                className="w-2.5 h-2.5 rounded-full border shrink-0"
                style={{
                  backgroundColor: fillColor,
                  borderColor: config.style?.stroke || fillColor,
                }}
              />
              <span className={`truncate ${isVisible ? 'text-gray-800' : 'text-gray-400'}`}>
                {config.display_name}
              </span>
            </label>
          )
        })}
      </div>

      {displayLayers.length === 0 && (
        <p className="text-xs text-gray-400 italic">No layers</p>
      )}
    </div>
  )
}
