import { useState } from 'react'
import Navbar from './components/Navbar.jsx'
import ModelViewer from './components/ModelViewer.jsx'
import ProductDialer from './components/ProductDialer.jsx'
import GarmentCursorBadge from './components/GarmentCursorBadge.jsx'
import OfferMarquee from './components/OfferMarquee.jsx'

export default function App() {
  const [targetAngle, setTargetAngle] = useState(null)
  const [activeIndex, setActiveIndex] = useState(2) // Default center: Orange Stüssy Tee
  const [hoveredName, setHoveredName] = useState(null)

  const handleSelectProduct = (index, product) => {
    setActiveIndex(index)
    if (product && product.targetAngle !== undefined) {
      setTargetAngle(product.targetAngle)
    }
  }

  return (
    <div className="relative h-screen w-screen bg-black text-white overflow-hidden select-none">
      {/* Top Header Navigation */}
      <Navbar />

      {/* Main Center Area: 3D Clothing Carousel Rack */}
      <main className="relative w-full h-full flex items-center justify-center">
        <ModelViewer
          targetAngle={targetAngle}
          onHoverGarment={setHoveredName}
        />
      </main>

      {/* Bottom Center: Interactive Product Ruler Dialer */}
      <div className="absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
        <ProductDialer
          activeIndex={activeIndex}
          onSelectProduct={handleSelectProduct}
        />
      </div>

      {/* Cursor Follower Card for Front Garments */}
      <GarmentCursorBadge hoveredName={hoveredName} />

      {/* Right Edge: Continuous Infinite Offer Marquee */}
      <OfferMarquee />
    </div>
  )
}
