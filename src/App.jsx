import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import ModelViewer from './components/ModelViewer.jsx'
import ProductDialer from './components/ProductDialer.jsx'

export default function App() {
  const [targetAngle, setTargetAngle] = useState(null)
  const [activeIndex, setActiveIndex] = useState(2) // Default center: Orange Stüssy Tee
  const [hoveredName, setHoveredName] = useState(null)

  const marqueeRef = useRef(null)
  const headerRef = useRef(null)
  const dialerWrapperRef = useRef(null)
  const asideRef = useRef(null)
  const badgeWrapperRef = useRef(null)
  const cardInnerRef = useRef(null)
  const mousePosRef = useRef({ x: -9999, y: -9999 })

  const handleSelectProduct = (index, product) => {
    setActiveIndex(index)
    if (product && product.targetAngle !== undefined) {
      setTargetAngle(product.targetAngle)
    }
  }

  // Interactive Cursor Follower (Directly attached right below cursor, zero drift, never freezes)
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

  // GSAP: Seamless Infinite Vertical Marquee & Page Entrance Animations
  useEffect(() => {
    // 1. Seamless Infinite Vertical Marquee Loop
    let marqueeTween
    if (marqueeRef.current) {
      marqueeTween = gsap.to(marqueeRef.current, {
        yPercent: -50,
        repeat: -1,
        ease: 'none',
        duration: 16,
      })
    }

    // 2. Entrance Stagger for Header Nav Links
    if (headerRef.current) {
      const links = headerRef.current.querySelectorAll('a')
      gsap.fromTo(
        links,
        { y: -16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 0.1 }
      )
    }

    // 3. Aside Marquee Strip Entrance
    if (asideRef.current) {
      gsap.fromTo(
        asideRef.current,
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 1.0, ease: 'power3.out', delay: 0.2 }
      )
    }

    // 4. Bottom Dialer Entrance
    if (dialerWrapperRef.current) {
      gsap.fromTo(
        dialerWrapperRef.current,
        { y: 35, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', delay: 0.35 }
      )
    }

    return () => {
      if (marqueeTween) marqueeTween.kill()
    }
  }, [])

  return (
    <div className="relative h-screen w-screen bg-black text-white overflow-hidden select-none">
      {/* Top Navigation */}
      <header
        ref={headerRef}
        className="absolute top-0 left-0 right-0 z-40 px-8 sm:px-12 pt-7"
      >
        <nav className="flex items-center gap-14 sm:gap-20 md:gap-24 text-[12px] sm:text-[13px] tracking-wider font-medium uppercase text-white">
          <a href="#wtf" className="hover:opacity-80 transition-opacity">
            WTF
          </a>
          <a href="#products" className="hover:opacity-80 transition-opacity">
            PRODUCTS
          </a>
          <a href="#cart" className="hover:opacity-80 transition-opacity">
            CART
          </a>
          <a href="#contact" className="hover:opacity-80 transition-opacity">
            CONTACT
          </a>
        </nav>
      </header>

      {/* Main Center Area (Hero Section with 3D Clothing Rack Model) */}
      <main className="relative w-full h-full flex items-center justify-center">
        <ModelViewer
          targetAngle={targetAngle}
          onHoverGarment={setHoveredName}
        />
      </main>

      {/* Bottom Center: Interactive Product Dialer */}
      <div
        ref={dialerWrapperRef}
        className="absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center"
      >
        <ProductDialer
          activeIndex={activeIndex}
          onSelectProduct={handleSelectProduct}
        />
      </div>

      {/* Interactive Cursor Follower Badge (exact match with user reference screenshot) */}
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

      {/* Right Side: Offer Marquee Strip (Background #F15001, seamless GSAP infinite loop) */}
      <aside
        ref={asideRef}
        className="fixed top-0 right-0 h-full w-[24px] sm:w-[26px] bg-[#F15001] z-50 overflow-hidden flex items-center justify-center"
      >
        <div
          ref={marqueeRef}
          className="flex flex-col will-change-transform select-none"
        >
          <div className="vertical-marquee text-white text-[9.5px] sm:text-[10px] tracking-[0.20em] uppercase font-medium whitespace-nowrap py-4">
            10% OFF ON FIRST ORDER ~ 10% OFF ON FIRST ORDER ~ 10% OFF ON FIRST ORDER ~ 10% OFF ON FIRST ORDER ~ 10% OFF ON FIRST ORDER ~ 10% OFF ON FIRST ORDER ~
          </div>
          <div className="vertical-marquee text-white text-[9.5px] sm:text-[10px] tracking-[0.20em] uppercase font-medium whitespace-nowrap py-4">
            10% OFF ON FIRST ORDER ~ 10% OFF ON FIRST ORDER ~ 10% OFF ON FIRST ORDER ~ 10% OFF ON FIRST ORDER ~ 10% OFF ON FIRST ORDER ~ 10% OFF ON FIRST ORDER ~
          </div>
        </div>
      </aside>
    </div>
  )
}
