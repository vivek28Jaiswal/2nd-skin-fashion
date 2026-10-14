import { useState } from 'react'
import Navbar from './components/Navbar.jsx'
import ModelViewer from './components/ModelViewer.jsx'
import ProductDialer from './components/ProductDialer.jsx'
import GarmentCursorBadge from './components/GarmentCursorBadge.jsx'
import ProductSidepanel from './components/ProductSidepanel.jsx'
import { PRODUCTS } from './data/products.js'

export default function App() {
  const [targetAngle, setTargetAngle] = useState(null)
  const [activeIndex, setActiveIndex] = useState(2) // Default center: Orange Stüssy Tee
  const [hoveredName, setHoveredName] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[2]) // Default: Lucky Boxy-Fit T-Shirt
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [spinTrigger, setSpinTrigger] = useState(0)

  // Triggered when customer clicks "PRODUCTS" in the top navbar
  const handleProductsClick = () => {
    setSpinTrigger((prev) => prev + 1)
    setIsPanelOpen(false)
  }

  // Triggered when customer clicks any garment directly on the 3D rack
  const handleSelectGarmentFromRack = (garmentName) => {
    if (!garmentName) return
    const found = PRODUCTS.find(
      (p) => p.name.toLowerCase() === garmentName.toLowerCase()
    )
    if (found) {
      const idx = PRODUCTS.indexOf(found)
      setActiveIndex(idx)
      setSelectedProduct(found)
      if (found.targetAngle !== undefined) {
        setTargetAngle(found.targetAngle)
      }
      setIsPanelOpen(true)
    }
  }

  // Triggered when customer clicks or scrolls the bottom product ruler dialer
  const handleSelectProductFromDialer = (index, product) => {
    setActiveIndex(index)
    if (product) {
      setSelectedProduct(product)
      if (product.targetAngle !== undefined) {
        setTargetAngle(product.targetAngle)
      }
      setIsPanelOpen(true)
    }
  }

  const handleClosePanel = () => {
    setIsPanelOpen(false)
  }

  const handleTogglePanel = () => {
    setIsPanelOpen((prev) => !prev)
  }

  return (
    <div className="relative h-screen w-screen bg-black text-white overflow-hidden select-none flex">
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
          />
        </main>

        {/* Bottom Center: Interactive Product Ruler Dialer */}
        <div className="absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-auto">
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
