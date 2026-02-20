import { MapMode } from '@/types'

interface ModeSelectorProps {
  currentMode: MapMode
  onModeChange: (mode: MapMode) => void
  availableModes: string[]
  accentColor?: string
}

const modeInfo: { [key: string]: { label: string; desc: string } } = {
  property: { label: 'Property', desc: 'Parcels, ownership & permits' },
  planning: { label: 'Planning', desc: 'Zoning & future land use' },
  hazards: { label: 'Hazards', desc: 'Flood zones & fire risk' },
  explore: { label: 'Explore', desc: 'Parks & attractions' },
  business: { label: 'Business', desc: 'Local businesses' },
}

const modeOrder = ['property', 'planning', 'hazards', 'explore', 'business']

export default function ModeSelector({
  currentMode,
  onModeChange,
  availableModes,
  accentColor,
}: ModeSelectorProps) {
  const sortedModes = [...new Set(availableModes)]
    .sort((a, b) => {
      const aIndex = modeOrder.indexOf(a)
      const bIndex = modeOrder.indexOf(b)
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
    })

  return (
    <div className="bg-gray-50 border-t border-gray-200">
      <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto">
        {sortedModes.map((mode) => {
          const info = modeInfo[mode] || { label: mode, desc: '' }
          const isActive = currentMode === mode

          return (
            <button
              key={mode}
              onClick={() => onModeChange(mode as MapMode)}
              className={`
                px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap
                transition-all duration-150
                ${isActive
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200'
                }
              `}
              style={isActive ? { backgroundColor: accentColor || '#2563EB' } : undefined}
              title={info.desc}
            >
              {info.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
