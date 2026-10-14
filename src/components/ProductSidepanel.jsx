import { useState, useEffect, memo } from 'react'
import { X, Heart, Ruler, Minus, Plus } from '@phosphor-icons/react'
import OfferMarquee from './OfferMarquee.jsx'
import ScrambleText from './ScrambleText.jsx'

function ProductSidepanel({
  isOpen,
  product,
  onClose,
  onToggle,
}) {
  const [selectedSize, setSelectedSize] = useState('XL')
  const [quantity, setQuantity] = useState(1)
  const [activeThumb, setActiveThumb] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)

  // Sync state when product changes
  useEffect(() => {
    if (product) {
      setSelectedSize(product.defaultSize || 'XL')
      setActiveThumb(0)
      setQuantity(1)
    }
  }, [product])

  if (!product) return null

  const thumbnails = product.thumbnails || [product.img, product.img, product.img]
  const sizes = product.sizes || ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL']

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1)
  }

  const handleIncrease = () => {
    setQuantity(quantity + 1)
  }

  return (
    <>
      {/* Optional mobile overlay backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Smooth Parallax Sliding Drawer (50% width on desktop) */}
      <div
        className={`fixed top-0 right-0 h-full z-40 flex will-change-transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-full sm:w-[480px] lg:w-1/2 ${
          isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-24px)] sm:translate-x-[calc(100%-26px)]'
        }`}
      >
        {/* Left Vertical Dividing Strip: The Orange Offer Marquee with toggle arrow */}
        <div
          onClick={onToggle || onClose}
          className="relative h-full w-[24px] sm:w-[26px] shrink-0 bg-[#F15001] cursor-pointer hover:brightness-105 active:brightness-95 transition-all flex justify-center z-50 select-none shadow-[-6px_0_25px_rgba(0,0,0,0.4)] group"
          title={isOpen ? 'Click to close panel' : 'Click to view product'}
        >
          <OfferMarquee />
        </div>

        {/* Right side: Clean E-Commerce Product Details Panel */}
        <div className="flex-1 h-full bg-white text-black overflow-y-auto overflow-x-hidden flex flex-col select-none shadow-2xl relative">
          {/* Top Half: Soft Gray Studio Background (#EEEEEE) with Garment & Thumbnails */}
          <div className="relative w-full h-[54vh] sm:h-[56vh] min-h-[320px] bg-[#EEEEEE] flex items-center justify-center p-6 border-b border-gray-200/60">
            {/* Close CTA Button at Top-Left (Aligned with top thumbnails on Y-axis) */}
            <button
              onClick={onClose}
              className="absolute top-6 left-4 sm:left-6 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-neutral-800 flex items-center justify-center shadow-xs hover:shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95 group"
              aria-label="Close panel"
              title="Close panel"
            >
              <X size={18} weight="bold" className="text-neutral-700 group-hover:text-black transition-colors" />
            </button>

            {/* Main Hero Product Image */}
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={thumbnails[activeThumb] || product.img}
                alt={product.title}
                decoding="async"
                className="max-h-[86%] max-w-[76%] object-contain drop-shadow-sm transition-all duration-300"
              />
            </div>

            {/* Vertical Thumbnail Angle Stack (Top Right, matching mockup) */}
            <div className="absolute right-4 sm:right-6 top-6 flex flex-col gap-3.5 z-10">
              {thumbnails.map((thumb, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveThumb(idx)}
                  className={`w-12 h-12 sm:w-13 sm:h-13 rounded-[4px] overflow-hidden flex items-center justify-center cursor-pointer transition-all ${
                    activeThumb === idx
                      ? 'border border-neutral-800 bg-white/70 shadow-xs opacity-100 scale-105'
                      : 'border border-transparent bg-transparent opacity-75 hover:opacity-100'
                  }`}
                  aria-label={`View angle ${idx + 1}`}
                >
                  <img
                    src={thumb}
                    alt={`Angle ${idx + 1}`}
                    decoding="async"
                    className="w-full h-full object-contain p-0.5"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Half: Crisp White Details Container */}
          <div className="flex-1 bg-white px-6 py-6 sm:px-8 sm:py-7 flex flex-col justify-between gap-6">
            <div>
              {/* Product Title & Wishlist Row */}
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-[22px] sm:text-[25px] font-bold tracking-tight text-neutral-900 leading-tight">
                  <ScrambleText
                    text={product.title}
                    trigger={isOpen}
                    hover={true}
                    duration={0.7}
                    delay={0.12}
                  />
                </h2>

                {/* Heart / Wishlist Button */}
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-[4px] border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    isWishlisted
                      ? 'border-red-200 bg-red-50 text-red-500'
                      : 'border-gray-200 bg-white text-gray-400 hover:border-gray-400 hover:text-black'
                  }`}
                  aria-label="Wishlist"
                >
                  <Heart
                    size={20}
                    weight={isWishlisted ? 'fill' : 'regular'}
                    className={`transition-transform ${isWishlisted ? 'scale-110' : ''}`}
                  />
                </button>
              </div>

              {/* Price Row */}
              <div className="flex items-baseline gap-2.5 mt-2">
                <span className="text-sm sm:text-base text-gray-400 line-through font-normal">
                  {product.mrp}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-[#E00000]">
                  <ScrambleText
                    text={product.price}
                    trigger={isOpen}
                    hover={false}
                    duration={0.5}
                    delay={0.2}
                  />
                </span>
              </div>

              {/* Select Size Section */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] sm:text-xs font-semibold text-neutral-800">
                    Select Size
                  </span>
                  <button className="text-[11px] sm:text-xs font-normal text-neutral-600 underline flex items-center gap-1.5 cursor-pointer hover:text-black transition-colors rounded-[4px] px-1 py-0.5">
                    <Ruler size={15} weight="regular" />
                    Size Guide
                  </button>
                </div>

                <p className="text-[11px] text-neutral-400 mt-1 font-normal">
                  {product.sizeTip || 'Check size chart for better fit'}
                </p>

                {/* Size Pills Grid (XXS, XS, S, M, L, XL, XXL) */}
                <div className="flex flex-wrap gap-2 mt-3.5">
                  {sizes.map((sz) => {
                    const isSelected = selectedSize === sz
                    return (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-[4px] text-xs uppercase flex items-center justify-center cursor-pointer transition-all font-normal ${
                          isSelected
                            ? 'border-2 border-black text-black bg-white shadow-xs'
                            : 'border border-gray-200 text-gray-400 hover:border-gray-400 hover:text-neutral-800'
                        }`}
                      >
                        {sz}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions: Quantity Stepper & Buttons */}
            <div className="mt-auto pt-3">
              {/* Quantity Stepper (Right Aligned above buttons) */}
              <div className="flex justify-end mb-3">
                <div className="inline-flex items-center bg-[#F3F4F6] rounded-[4px] px-3 py-1.5 gap-3">
                  <button
                    onClick={handleDecrease}
                    className="text-gray-500 hover:text-black p-0.5 rounded-[4px] cursor-pointer transition-colors flex items-center justify-center"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={13} weight="bold" />
                  </button>
                  <span className="text-black font-semibold text-xs sm:text-sm min-w-[14px] text-center select-none">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrease}
                    className="text-gray-500 hover:text-black p-0.5 rounded-[4px] cursor-pointer transition-colors flex items-center justify-center"
                    aria-label="Increase quantity"
                  >
                    <Plus size={13} weight="bold" />
                  </button>
                </div>
              </div>

              {/* Action Buttons: BUY IT NOW & ADD TO CART */}
              <div className="flex items-center gap-3">
                <button className="flex-1 bg-black text-white hover:bg-neutral-800 font-semibold tracking-wider uppercase text-xs sm:text-sm py-3.5 px-4 rounded-[4px] transition-colors flex items-center justify-center cursor-pointer shadow-sm active:scale-[0.99]">
                  BUY IT NOW
                </button>
                <button className="flex-1 bg-[#F3F4F6] text-black hover:bg-gray-200 font-semibold tracking-wider uppercase text-xs sm:text-sm py-3.5 px-4 rounded-[4px] transition-colors flex items-center justify-center cursor-pointer active:scale-[0.99]">
                  ADD TO CART
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default memo(ProductSidepanel)
