import { useRef, useEffect } from 'react'
import gsap from 'gsap'

export default function GarmentCursorBadge({ hoveredName }) {
  const badgeWrapperRef = useRef(null)
  const cardInnerRef = useRef(null)
  const mousePosRef = useRef({ x: -9999, y: -9999 })

  // Interactive Cursor Follower (Directly attached right below cursor tip, zero drift, never freezes)
  useEffect(() => {
    const handlePointerMove = (e) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY }
      if (badgeWrapperRef.current) {
        // Direct translate3d update directly below the pointer hand cursor tip
        badgeWrapperRef.current.style.transform = `translate3d(${e.clientX - 6}px, ${e.clientY + 22}px, 0)`
      }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [])

  // Smooth pop-in / pop-out right at cursor when hovering a garment
  useEffect(() => {
    if (!cardInnerRef.current) return

    if (hoveredName) {
      // Position the wrapper right at the cursor immediately before animating in
      if (badgeWrapperRef.current && mousePosRef.current.x > 0) {
        badgeWrapperRef.current.style.transform = `translate3d(${mousePosRef.current.x - 6}px, ${mousePosRef.current.y + 22}px, 0)`
      }

      gsap.killTweensOf(cardInnerRef.current)
      gsap.fromTo(
        cardInnerRef.current,
        { opacity: 0, scale: 0.88, y: -3 },
        { opacity: 1, scale: 1, y: 0, duration: 0.16, ease: 'power2.out' }
      )
    } else {
      gsap.killTweensOf(cardInnerRef.current)
      gsap.to(cardInnerRef.current, {
        opacity: 0,
        scale: 0.88,
        y: -3,
        duration: 0.12,
        ease: 'power2.in',
      })
    }
  }, [hoveredName])

  return (
    <div
      ref={badgeWrapperRef}
      className="fixed top-0 left-0 z-50 pointer-events-none will-change-transform select-none"
      style={{
        transform: 'translate3d(-9999px, -9999px, 0)',
      }}
    >
      <div
        ref={cardInnerRef}
        className="bg-white text-black text-[13px] font-normal tracking-tight px-4 py-2 whitespace-nowrap rounded-none shadow-none leading-none flex items-center justify-center opacity-0 scale-90"
      >
        {hoveredName}
      </div>
    </div>
  )
}
