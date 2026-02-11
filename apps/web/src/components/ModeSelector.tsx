import { MapMode } from '@/types'

interface ModeSelectorProps {
  currentMode: MapMode
  onModeChange: (mode: MapMode) => void
  availableModes: string[]
}

const modeInfo: { [key: string]: { label: string; icon: string; desc: string } } = {
  resident: {
    label: 'My Area',
    icon: '🏠',
    desc: 'Property, services & parks'
  },
  services: {
    label: 'Utilities',
    icon: '💧',
    desc: 'Water, sewer & districts'
  },
  environmental: {
    label: 'Hazards',
    icon: '⚠️',
    desc: 'Flood zones & fire risk'
  },
  tourism: {
    label: 'Explore',
    icon: '🗺️',
    desc: 'Places to visit'
  },
  development: {
    label: 'Building',
    icon: '🏗️',
    desc: 'Permits & zoning'
  },
  business: {
    label: 'Business',
    icon: '🏪',
    desc: 'Local businesses'
  },
}

// Order modes by resident priority
const modeOrder = ['resident', 'services', 'environmental', 'development', 'tourism', 'business']

export default function ModeSelector({
  currentMode,
  onModeChange,
  availableModes,
}: ModeSelectorProps) {
  // Sort available modes by priority order
  const sortedModes = [...availableModes].sort((a, b) => {
    const aIndex = modeOrder.indexOf(a)
    const bIndex = modeOrder.indexOf(b)
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
  })

  return (
    <div className="border-t border-tf-stone-200 bg-tf-stone-50/50">
      <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto">
        {sortedModes.map((mode) => {
          const info = modeInfo[mode] || { label: mode, icon: '📍', desc: '' }
          return (
            <button
              key={mode}
              onClick={() => onModeChange(mode as MapMode)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap
                transition-colors
                ${currentMode === mode
                  ? 'bg-tf-river-600 text-white shadow-sm'
                  : 'text-tf-stone-600 hover:text-tf-river-700 hover:bg-tf-stone-100'
                }
              `}
              title={info.desc}
            >
              <span className="text-sm">{info.icon}</span>
              <span>{info.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
