import { useState } from 'react'
import ModelViewer from './components/ModelViewer.jsx'
import ProductDialer from './components/ProductDialer.jsx'

export default function App() {
  const [targetAngle, setTargetAngle] = useState(null)
  const [activeIndex, setActiveIndex] = useState(2) // Default center: Orange Stüssy Tee

  const handleSelectProduct = (index, product) => {
    setActiveIndex(index)
    if (product && product.targetAngle !== undefined) {
      setTargetAngle(product.targetAngle)
    }
  }

  return (
    <div className="relative h-screen w-screen bg-black text-white overflow-hidden select-none">
      {/* Top Navigation */}
      <header className="absolute top-0 left-0 right-0 z-40 px-8 sm:px-12 pt-7">
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
        <ModelViewer targetAngle={targetAngle} />
      </main>

      {/* Bottom Center: Interactive Product Dialer with Ruler Scrubber */}
      <div className="absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-40">
        <ProductDialer
          activeIndex={activeIndex}
          onSelectProduct={handleSelectProduct}
        />
      </div>

      {/* Right Side: Offer Marquee Strip (Background #F15001, static structure) */}
      <aside className="fixed top-0 right-0 h-full w-[24px] sm:w-[26px] bg-[#F15001] z-50 overflow-hidden flex flex-col items-center">
        <div className="vertical-marquee text-white text-[9.5px] sm:text-[10px] tracking-[0.18em] uppercase font-medium select-none whitespace-nowrap pt-1">
          10% OFF ON FIRST ORDER ~ 10% OFF ON FIRST ORDER ~ 10% OFF ON FIRST ORDER ~ 10% OFF ON FIRST ORDER ~ 10% OFF ON FIRST ORDER ~ 10% OFF ON FIRST ORDER ~ 10% OFF ON FIRST ORDER ~ 10% OFF ON FIRST ORDER ~ 10% OFF ON FIRST ORDER ~ 10% OFF ON FIRST ORDER
        </div>
      </aside>
    </div>
  )
}
