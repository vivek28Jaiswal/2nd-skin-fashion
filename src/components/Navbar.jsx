import { memo } from 'react'

function Navbar({ onProductsClick }) {
  return (
    <header className="absolute top-0 left-0 right-0 z-40 px-5 sm:px-12 pt-5 sm:pt-7">
      <nav className="flex items-center gap-7 xs:gap-8 sm:gap-14 md:gap-20 lg:gap-24 text-[12px] sm:text-[13px] tracking-wider font-medium uppercase text-white">
        <a href="#2ndskin" className="hover:opacity-80 transition-opacity text-[12px] sm:text-[13px] font-medium leading-none">
          2ND SKIN
        </a>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            onProductsClick?.()
          }}
          className="hover:opacity-80 transition-opacity cursor-pointer tracking-wider font-medium uppercase text-white bg-transparent border-0 p-0 text-[12px] sm:text-[13px] leading-none"
        >
          PRODUCTS
        </button>
        <a href="#cart" className="hover:opacity-80 transition-opacity text-[12px] sm:text-[13px] font-medium leading-none">
          CART
        </a>
        <a href="#contact" className="hover:opacity-80 transition-opacity text-[12px] sm:text-[13px] font-medium leading-none">
          CONTACT
        </a>
      </nav>
    </header>
  )
}

export default memo(Navbar)
