import { MapMode } from '@/types'

interface ModeSelectorProps {
  currentMode: MapMode
  onModeChange: (mode: MapMode) => void
  availableModes: string[]
}

const modeLabels: { [key: string]: string } = {
  resident: 'Property',
  services: 'Services',
  environmental: 'Environment',
  tourism: 'Tourism',
  development: 'Development',
  business: 'Business',
}

export default function ModeSelector({
  currentMode,
  onModeChange,
  availableModes,
}: ModeSelectorProps) {
  return (
    <div className="border-t border-gray-100 bg-gray-50/50">
      <div className="flex items-center gap-1 px-3 py-1.5">
        {availableModes.map((mode) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode as MapMode)}
            className={`
              px-3 py-1 text-xs font-medium rounded
              ${currentMode === mode
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
          >
            {modeLabels[mode] || mode}
          </button>
        ))}
      </div>
    </div>
  )
}
