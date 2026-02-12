import { MapMode } from '@/types'

interface ModeSelectorProps {
  currentMode: MapMode
  onModeChange: (mode: MapMode) => void
  availableModes: string[]
}

const modeInfo: { [key: string]: { label: string; desc: string } } = {
  resident: {
    label: 'Resident',
    desc: 'Property, services & parks'
  },
  services: {
    label: 'Services',
    desc: 'Water, sewer & districts'
  },
  environmental: {
    label: 'Hazards',
    desc: 'Flood zones & fire risk'
  },
  tourism: {
    label: 'Explore',
    desc: 'Places to visit'
  },
  development: {
    label: 'Development',
    desc: 'Permits & projects'
  },
  business: {
    label: 'Business',
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
          const info = modeInfo[mode] || { label: mode, desc: '' }
          return (
            <button
              key={mode}
              onClick={() => onModeChange(mode as MapMode)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap
                transition-colors
                ${currentMode === mode
                  ? 'bg-tf-river-600 text-white shadow-sm'
                  : 'text-tf-stone-600 hover:text-tf-river-700 hover:bg-tf-stone-100'
                }
              `}
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
