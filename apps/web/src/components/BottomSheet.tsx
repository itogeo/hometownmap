import { useEffect, useRef, useState } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  /** Height as percentage of viewport (default: 50) */
  defaultHeight?: number
  /** Minimum height as percentage (default: 20) */
  minHeight?: number
  /** Maximum height as percentage (default: 85) */
  maxHeight?: number
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  defaultHeight = 50,
  minHeight = 20,
  maxHeight = 85,
}: BottomSheetProps) {
  const [height, setHeight] = useState(defaultHeight)
  const [isDragging, setIsDragging] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const startHeight = useRef(0)

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Reset height when opened
  useEffect(() => {
    if (isOpen) {
      setHeight(defaultHeight)
    }
  }, [isOpen, defaultHeight])

  const handleDragStart = (clientY: number) => {
    setIsDragging(true)
    startY.current = clientY
    startHeight.current = height
  }

  const handleDrag = (clientY: number) => {
    if (!isDragging) return

    const delta = startY.current - clientY
    const deltaPercent = (delta / window.innerHeight) * 100
    const newHeight = Math.min(maxHeight, Math.max(minHeight, startHeight.current + deltaPercent))
    setHeight(newHeight)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    // Snap to close if dragged below minimum
    if (height < minHeight + 5) {
      onClose()
    }
  }

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDrag(e.touches[0].clientY)
  }

  const handleTouchEnd = () => {
    handleDragEnd()
  }

  // Mouse handlers for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientY)
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleDrag(e.clientY)
      }
    }
    const handleMouseUp = () => {
      if (isDragging) {
        handleDragEnd()
      }
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, height])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Backdrop - tap to close */}
      <div
        className="absolute inset-0 bg-black/30 pointer-events-auto"
        onClick={onClose}
        style={{ touchAction: 'none' }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl
                   pointer-events-auto flex flex-col safe-area-bottom"
        style={{
          height: `${height}vh`,
          transition: isDragging ? 'none' : 'height 0.2s ease-out',
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex-shrink-0 pt-3 pb-2 cursor-grab active:cursor-grabbing touch-manipulation"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex-shrink-0 flex items-center justify-between px-4 pb-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full
                         bg-gray-100 hover:bg-gray-200 transition-colors touch-manipulation"
              aria-label="Close"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain smooth-scroll">
          {children}
        </div>
      </div>
    </div>
  )
}
