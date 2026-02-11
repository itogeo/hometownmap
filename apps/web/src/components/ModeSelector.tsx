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
    <div className="border-t border-tf-stone-200 bg-tf-stone-50/50">
      <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto">
        {availableModes.map((mode) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode as MapMode)}
            className={`
              px-3 py-1 text-xs font-medium rounded whitespace-nowrap
              ${currentMode === mode
                ? 'bg-tf-river-600 text-white'
                : 'text-tf-stone-600 hover:text-tf-river-700 hover:bg-tf-stone-100'
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
