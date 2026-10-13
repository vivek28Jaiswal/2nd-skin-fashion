import { useRef, useEffect } from 'react'
import gsap from 'gsap'

const MARQUEE_UNIT = '10% OFF ON FIRST ORDER ~ '
const MARQUEE_CONTENT = MARQUEE_UNIT.repeat(20)

export default function OfferMarquee() {
  const marqueeRef = useRef(null)

  useEffect(() => {
    let marqueeTween
    if (marqueeRef.current) {
      marqueeTween = gsap.to(marqueeRef.current, {
        yPercent: -50,
        repeat: -1,
        ease: 'none',
        duration: 28,
      })
    }

    return () => {
      if (marqueeTween) marqueeTween.kill()
    }
  }, [])

  return (
    <aside className="fixed top-0 right-0 h-full w-[24px] sm:w-[26px] bg-[#F15001] z-50 overflow-hidden flex justify-center">
      <div
        ref={marqueeRef}
        className="flex flex-col will-change-transform select-none"
      >
        <div className="vertical-marquee text-white text-[9.5px] sm:text-[10px] tracking-[0.20em] uppercase font-medium whitespace-nowrap py-1">
          {MARQUEE_CONTENT}
        </div>
        <div
          className="vertical-marquee text-white text-[9.5px] sm:text-[10px] tracking-[0.20em] uppercase font-medium whitespace-nowrap py-1"
          aria-hidden="true"
        >
          {MARQUEE_CONTENT}
        </div>
      </div>
    </aside>
  )
}
