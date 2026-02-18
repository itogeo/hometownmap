import { useState, useRef, useEffect } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  defaultHeight?: number // percentage of viewport height
  minHeight?: number // percentage of viewport height
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  defaultHeight = 50,
  minHeight = 20,
}: BottomSheetProps) {
  const [height, setHeight] = useState(defaultHeight)
  const [isDragging, setIsDragging] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)

  useEffect(() => {
    if (isOpen) {
      setHeight(defaultHeight)
    }
  }, [isOpen, defaultHeight])

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true)
    dragStartY.current = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragStartHeight.current = height
  }

  const handleDrag = (e: TouchEvent | MouseEvent) => {
    if (!isDragging) return

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const deltaY = dragStartY.current - clientY
    const deltaPercent = (deltaY / window.innerHeight) * 100
    const newHeight = Math.max(minHeight, Math.min(90, dragStartHeight.current + deltaPercent))

    // If dragged down past minimum, close the sheet
    if (newHeight < minHeight) {
      onClose()
      setIsDragging(false)
      return
    }

    setHeight(newHeight)
  }

  const handleDragEnd = () => {
    setIsDragging(false)

    // Snap to default or close if below threshold
    if (height < minHeight + 10) {
      onClose()
    }
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDrag)
      document.addEventListener('mouseup', handleDragEnd)
      document.addEventListener('touchmove', handleDrag)
      document.addEventListener('touchend', handleDragEnd)

      return () => {
        document.removeEventListener('mousemove', handleDrag)
        document.removeEventListener('mouseup', handleDragEnd)
        document.removeEventListener('touchmove', handleDrag)
        document.removeEventListener('touchend', handleDragEnd)
      }
    }
  }, [isDragging, height])

  if (!isOpen) return null

  return (
    <div
      ref={sheetRef}
      className="fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-2xl shadow-2xl
                 transition-transform duration-200 ease-out"
      style={{
        height: `${height}vh`,
        transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
      }}
    >
      {/* Drag handle */}
      <div
        className="flex items-center justify-center py-3 cursor-grab active:cursor-grabbing touch-manipulation"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
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

      {/* Content */}
      <div
        className="overflow-y-auto -webkit-overflow-scrolling-touch"
        style={{ height: `calc(100% - 60px)` }}
      >
        {children}
      </div>
    </div>
  )
}
