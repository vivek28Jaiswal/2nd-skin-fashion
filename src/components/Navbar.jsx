export default function Navbar() {
  return (
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
  )
}
