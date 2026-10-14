import { useState, useCallback } from 'react'
import Navbar from './components/Navbar.jsx'
import ModelViewer from './components/ModelViewer.jsx'
import ProductDialer from './components/ProductDialer.jsx'
import GarmentCursorBadge from './components/GarmentCursorBadge.jsx'
import ProductSidepanel from './components/ProductSidepanel.jsx'
import Preloader from './components/Preloader.jsx'
import { PRODUCTS } from './data/products.js'

export default function App() {
  const [isPreloaderDone, setIsPreloaderDone] = useState(false)
  const [isModelReady, setIsModelReady] = useState(false)
  const [targetAngle, setTargetAngle] = useState(null)
  const [activeIndex, setActiveIndex] = useState(2) // Default center: Orange Stüssy Tee
  const [hoveredName, setHoveredName] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[2]) // Default: Lucky Boxy-Fit T-Shirt
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [spinTrigger, setSpinTrigger] = useState(0)

  // Triggered when customer clicks "PRODUCTS" in the top navbar
  const handleProductsClick = useCallback(() => {
    setSpinTrigger((prev) => prev + 1)
    setIsPanelOpen(false)
  }, [])

  // Triggered when customer clicks any garment directly on the 3D rack
  const handleSelectGarmentFromRack = useCallback((garmentName) => {
    if (!garmentName) return
    const nameLower = garmentName.toLowerCase().trim()
    let found = PRODUCTS.find(
      (p) => p.name.toLowerCase() === nameLower
    )
    // Fallback: match any denim / jeans / pants variant
    if (!found && (nameLower.includes('denim') || nameLower.includes('jean') || nameLower.includes('pant') || nameLower.includes('baggy'))) {
      found = PRODUCTS.find((p) => p.id === 'pants-jeans' || p.name.toLowerCase().includes('denim'))
    }
    // Fallback: match any tee / shirt
    if (!found && (nameLower.includes('tee') || nameLower.includes('shirt'))) {
      found = PRODUCTS.find((p) => p.id === 'center-tshirt')
    }
    // Fallback: partial name match or default fallback
    if (!found) {
      found = PRODUCTS.find((p) => p.name.toLowerCase().includes(nameLower) || nameLower.includes(p.name.toLowerCase())) || PRODUCTS[2]
    }
    if (found) {
      const idx = PRODUCTS.indexOf(found)
      if (idx !== -1) setActiveIndex(idx)
      setSelectedProduct(found)
      if (found.targetAngle !== undefined) {
        setTargetAngle(found.targetAngle)
      }
      setIsPanelOpen(true)
    }
  }, [])

  // Triggered when customer clicks or scrolls the bottom product ruler dialer
  const handleSelectProductFromDialer = useCallback((index, product) => {
    setActiveIndex(index)
    if (product) {
      setSelectedProduct(product)
      if (product.targetAngle !== undefined) {
        setTargetAngle(product.targetAngle)
      }
      // On phone / responsive screens (< 1024px), keep panel closed during dialer navigation;
      // sidepanel only opens when customer directly clicks a garment on the rack.
      const isResponsive = typeof window !== 'undefined' && window.innerWidth < 1024
      if (!isResponsive) {
        setIsPanelOpen(true)
      }
    }
  }, [])

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false)
  }, [])

  const handleTogglePanel = useCallback(() => {
    setIsPanelOpen((prev) => !prev)
  }, [])

  const handleModelReady = useCallback(() => {
    setIsModelReady(true)
  }, [])

  const handlePreloaderComplete = useCallback(() => {
    setIsPreloaderDone(true)
  }, [])

  return (
    <div className="relative h-full h-[100dvh] w-full w-screen bg-black text-white overflow-hidden select-none flex">
      {/* Full Interaction Blocker while Preloader / Velvet Curtain is active */}
      {!isPreloaderDone && (
        <div
          className="fixed inset-0 z-[70] cursor-wait select-none"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        />
      )}

      {/* Interactive Velvet Preloader */}
      {!isPreloaderDone && (
        <Preloader
          isModelReady={isModelReady}
          onPreloaderComplete={handlePreloaderComplete}
        />
      )}

      {/* Top Header Navigation */}
      <Navbar onProductsClick={handleProductsClick} />

      {/* Main 3D Rack & Interactive Scene Area */}
      <div
        className={`relative h-full flex flex-col items-center justify-center transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
          isPanelOpen
            ? 'w-full lg:w-1/2'
            : 'w-full'
        }`}
      >
        <main className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <ModelViewer
            targetAngle={targetAngle}
            onHoverGarment={setHoveredName}
            onSelectGarment={handleSelectGarmentFromRack}
            isPanelOpen={isPanelOpen}
            spinTrigger={spinTrigger}
            onModelReady={handleModelReady}
            isInteractive={isPreloaderDone}
          />
        </main>

        {/* Bottom Center: Interactive Product Ruler Dialer with iOS safe-area support */}
        <div className="absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-7 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-auto">
          <ProductDialer
            activeIndex={activeIndex}
            onSelectProduct={handleSelectProductFromDialer}
          />
        </div>
      </div>

      {/* Cursor Follower Card for Front Garments (only when panel is not hovered) */}
      {!isPanelOpen && <GarmentCursorBadge hoveredName={hoveredName} />}

      {/* Right Drawer: Smooth Parallax Product Details Sidepanel with Offer Marquee Edge */}
      <ProductSidepanel
        isOpen={isPanelOpen}
        product={selectedProduct}
        onClose={handleClosePanel}
        onToggle={handleTogglePanel}
      />
    </div>
  )
}
