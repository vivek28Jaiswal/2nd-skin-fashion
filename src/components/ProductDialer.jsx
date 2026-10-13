import { useState, useRef, useEffect, useCallback } from 'react'
import blueTshirtImg from '../assets/imgs-transparent/blue-tshirt.png'
import blackSweatshirtImg from '../assets/imgs-transparent/black-swirt-shirt.png'
import centerTshirtImg from '../assets/imgs-transparent/center-thsirt.png'
import pantsJeansImg from '../assets/imgs-transparent/pants-jeans.png'
import blackHalfSleeveImg from '../assets/imgs-transparent/black-halfsleeve.png'

const PRODUCTS = [
  {
    id: 'blue-tshirt',
    name: 'blue graffiti streetwear tee',
    img: blueTshirtImg,
    targetAngle: Math.PI * 0.45,
  },
  {
    id: 'black-sweatshirt',
    name: 'stüssy black classic crew',
    img: blackSweatshirtImg,
    targetAngle: Math.PI * 0.15,
  },
  {
    id: 'center-tshirt',
    name: 'lucky boxy-fit t-shirt',
    img: centerTshirtImg,
    targetAngle: -Math.PI * 0.25,
  },
  {
    id: 'pants-jeans',
    name: 'vintage wide-leg baggy denim',
    img: pantsJeansImg,
    targetAngle: -Math.PI * 0.70,
  },
  {
    id: 'black-halfsleeve',
    name: 'y-3 graphic half-sleeve',
    img: blackHalfSleeveImg,
    targetAngle: -Math.PI * 1.05,
  },
]

const NUM_PRODUCTS = PRODUCTS.length // 5

// Compact spacing between items
const ITEM_WIDTH = 68 // Spacing between product images

// Ruler tick dimensions: 8 tick intervals per product (8 * 8.5px = 68px)
const TICK_INTERVAL = 8.5
const NUM_TICKS = 57 // Symmetric ticks from -28 to +28 (center is at index 28)

export default function ProductDialer({ onSelectProduct, activeIndex: externalIndex, onHoverProduct }) {
  // Continuous unbounded virtual position for seamless infinite loop (starts at 2 = Orange Tee)
  const [virtualPos, setVirtualPos] = useState(externalIndex !== undefined ? externalIndex : 2)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const dragStartRef = useRef({ startX: 0, lastX: 0, velocity: 0, time: 0 })
  const containerRef = useRef(null)
  const animFrameRef = useRef(null)

  // Floating continuous position
  const currentPos = virtualPos - dragOffset / ITEM_WIDTH

  // Normalized active index (0..4)
  const normalizedActiveIndex = ((Math.round(currentPos) % NUM_PRODUCTS) + NUM_PRODUCTS) % NUM_PRODUCTS

  // Sync external index if provided from outside
  useEffect(() => {
    if (externalIndex !== undefined) {
      const currentNorm = ((Math.round(virtualPos) % NUM_PRODUCTS) + NUM_PRODUCTS) % NUM_PRODUCTS
      if (externalIndex !== currentNorm) {
        const diff = externalIndex - currentNorm
        setVirtualPos((prev) => prev + diff)
      }
    }
  }, [externalIndex])

  // Animate / Snap to target slot with jelly bounce
  const snapToSlot = useCallback(
    (targetSlot) => {
      setIsDragging(false)
      setDragOffset(0)
      setVirtualPos(targetSlot)

      const norm = ((targetSlot % NUM_PRODUCTS) + NUM_PRODUCTS) % NUM_PRODUCTS
      if (onSelectProduct) {
        onSelectProduct(norm, PRODUCTS[norm])
      }
    },
    [onSelectProduct]
  )

  // Pointer Down - ONLY initiates on active drag
  const onPointerDown = (e) => {
    // Only drag with primary mouse button
    if (e.button !== undefined && e.button !== 0) return

    const startX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0
    dragStartRef.current = {
      startX,
      lastX: startX,
      velocity: 0,
      time: performance.now(),
      hasMoved: false,
    }

    setIsDragging(true)

    const onPointerMove = (ev) => {
      // Safety: If mouse button is released or not down, cancel drag immediately
      if (ev.buttons !== undefined && ev.buttons === 0) {
        onPointerUp(ev)
        return
      }

      const clientX = ev.clientX ?? (ev.touches && ev.touches[0]?.clientX) ?? 0
      const now = performance.now()
      const dt = Math.max(1, now - dragStartRef.current.time)
      const dx = clientX - dragStartRef.current.startX
      const frameDx = clientX - dragStartRef.current.lastX

      if (Math.abs(dx) > 3) {
        dragStartRef.current.hasMoved = true
      }

      dragStartRef.current.velocity = (frameDx / dt) * 1000
      dragStartRef.current.lastX = clientX
      dragStartRef.current.time = now

      setDragOffset(dx)
    }

    const onPointerUp = (ev) => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)

      setIsDragging(false)

      const vel = dragStartRef.current.velocity || 0
      const hasMoved = dragStartRef.current.hasMoved
      const clientX = ev.clientX ?? dragStartRef.current.lastX
      const finalDx = clientX - dragStartRef.current.startX

      if (hasMoved) {
        const baseSlot = Math.round(virtualPos - finalDx / ITEM_WIDTH)
        const velShift = Math.max(-1, Math.min(1, Math.round((vel * 0.035) / ITEM_WIDTH)))
        const targetSlot = baseSlot - velShift
        snapToSlot(targetSlot)
      } else {
        setDragOffset(0)
      }
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  // Generate EXACTLY 5 visible slots around currentPos (-2, -1, 0, +1, +2)
  const centerSlotInt = Math.round(currentPos)
  const visibleSlots = []
  for (let s = centerSlotInt - 2; s <= centerSlotInt + 2; s++) {
    const prodIdx = ((s % NUM_PRODUCTS) + NUM_PRODUCTS) % NUM_PRODUCTS
    const dist = Math.abs(s - currentPos)
    const xPos = (s - currentPos) * ITEM_WIDTH
    visibleSlots.push({
      slot: s,
      prod: PRODUCTS[prodIdx],
      prodIdx,
      dist,
      xPos,
    })
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center select-none"
      style={{ touchAction: 'none' }}
      onPointerDown={onPointerDown}
    >
      {/* 1. Infinite Products Carousel Row (EXACTLY 5 images visible, rest hidden) */}
      <div className="relative w-[312px] h-[72px] sm:h-[80px] flex items-end justify-center overflow-hidden cursor-grab active:cursor-grabbing pb-1">
        {visibleSlots.map(({ slot, prod, prodIdx, dist, xPos }) => {
          // Center element:
          // - slightly larger (scale 1.08)
          // - animated slightly upward (translateY: -11px)
          // - full opacity 1.0
          // Side elements:
          // - smaller (scale: 0.82 at 1 dist, 0.70 at 2 dist)
          // - baseline (translateY: 0px)
          // - dimmed opacity: 0.35 at 1 dist, 0.15 at 2 dist, 0 beyond
          const factor = Math.max(0, 1 - dist)
          const translateY = -factor * 11
          const scale = dist <= 1 ? 0.82 + factor * 0.26 : Math.max(0.68, 0.82 - (dist - 1) * 0.14)

          let opacity = 0
          if (dist < 1) {
            opacity = 0.35 + (1 - dist) * 0.65
          } else if (dist <= 2) {
            opacity = 0.15 + (2 - dist) * 0.20
          } else {
            opacity = 0
          }

          return (
            <div
              key={slot}
              onClick={(e) => {
                e.stopPropagation()
                snapToSlot(slot)
              }}
              onPointerEnter={() => {
                if (!isDragging && onHoverProduct) {
                  onHoverProduct(prod.name)
                }
              }}
              onPointerLeave={() => {
                if (onHoverProduct) {
                  onHoverProduct(null)
                }
              }}
              style={{
                position: 'absolute',
                left: '50%',
                transform: `translateX(calc(-50% + ${xPos}px)) translateY(${translateY}px) scale(${scale})`,
                opacity: opacity,
                // Subtle, minor jelly spring transition (0.38s with 6% micro-overshoot)
                transition: isDragging
                  ? 'none'
                  : 'transform 0.38s cubic-bezier(0.2, 1.06, 0.35, 1), opacity 0.28s ease',
              }}
              className="flex flex-col items-center justify-end cursor-pointer"
            >
              {/* Compact Image Container (w-11 h-11 to w-13 h-13) with NO background gradient */}
              <div className="w-11 h-11 sm:w-13 sm:h-13 flex items-center justify-center">
                <img
                  src={prod.img}
                  alt={prod.name}
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* 2. Interactive Line Dialer (Exact width and alignment matching the 5 images row) */}
      <div
        className="relative flex items-center justify-center w-[312px] h-8 overflow-hidden cursor-grab active:cursor-grabbing mt-1.5"
        style={{
          maskImage:
            'linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)',
        }}
      >
        <div
          className="flex items-center gap-[7px] will-change-transform"
          style={{
            transform: `translateX(${(dragOffset % ITEM_WIDTH)}px)`,
            // Subtle, minor jelly spring transition
            transition: isDragging ? 'none' : 'transform 0.38s cubic-bezier(0.2, 1.06, 0.35, 1)',
          }}
        >
          {Array.from({ length: NUM_TICKS }).map((_, i) => {
            const centerIdx = Math.floor(NUM_TICKS / 2) // 28
            const currentOffset = dragOffset % ITEM_WIDTH
            // The screen X position of this tick relative to the fixed physical center of the dialer
            const screenX = (i - centerIdx) * TICK_INTERVAL + currentOffset
            const dist = Math.abs(screenX)

            let height = 12
            let opacity = 0.28

            // Lines grow dynamically as they pass through the fixed center zone!
            if (dist < 32) {
              const factor = Math.cos((dist / 32) * (Math.PI / 2))
              const curved = Math.pow(factor, 1.8)
              height = 12 + curved * 14 // 12px up to 26px peak
              opacity = 0.28 + curved * 0.72 // 0.28 up to 1.0 peak
            }

            return (
              <div
                key={i}
                style={{
                  height: `${height}px`,
                  opacity: opacity,
                  transition: isDragging
                    ? 'none'
                    : 'height 0.38s cubic-bezier(0.2, 1.06, 0.35, 1), opacity 0.38s cubic-bezier(0.2, 1.06, 0.35, 1)',
                }}
                className="w-[1.5px] bg-white rounded-full flex-shrink-0"
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
