export default function Navbar({ onProductsClick }) {
  return (
    <header className="absolute top-0 left-0 right-0 z-40 px-8 sm:px-12 pt-7">
      <nav className="flex items-center gap-14 sm:gap-20 md:gap-24 text-[12px] sm:text-[13px] tracking-wider font-medium uppercase text-white">
        <a href="#wtf" className="hover:opacity-80 transition-opacity">
          WTF
        </a>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            onProductsClick?.()
          }}
          className="hover:opacity-80 transition-opacity cursor-pointer tracking-wider font-medium uppercase text-white bg-transparent border-0 p-0 text-[12px] sm:text-[13px]"
        >
          PRODUCTS
        </button>
        <a href="#cart" className="hover:opacity-80 transition-opacity">
          CART
        </a>
        <a href="#contact" className="hover:opacity-80 transition-opacity">
          CONTACT
        </a>
      </nav>
    </header>
  )
}
