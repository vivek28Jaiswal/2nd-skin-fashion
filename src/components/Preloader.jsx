import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import orangeTee from '../assets/imgs-transparent/center-thsirt.png'
import blueTee from '../assets/imgs-transparent/blue-tshirt.png'
import blackCrew from '../assets/imgs-transparent/black-swirt-shirt.png'
import pantsJeans from '../assets/imgs-transparent/pants-jeans.png'
import blackHalfSleeve from '../assets/imgs-transparent/black-halfsleeve.png'
import VelvetCurtain from './VelvetCurtain.jsx'

const PRELOADER_PRODUCTS = [
  orangeTee,
  blueTee,
  blackCrew,
  pantsJeans,
  blackHalfSleeve,
]

export default function Preloader({ isModelReady = true, onPreloaderComplete }) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0)
  const [percent, setPercent] = useState(0)
  const [isCurtainActive, setIsCurtainActive] = useState(false)
  const [isPreloaderVisible, setIsPreloaderVisible] = useState(true)

  const progressRef = useRef({ value: 0 })
  const isStoppedRef = useRef(false)
  const isModelReadyRef = useRef(isModelReady)

  useEffect(() => {
    isModelReadyRef.current = isModelReady
  }, [isModelReady])

  // 1. Continuous image cycling loop - completely independent of percentage.
  // Stops immediately when 100% is reached.
  useEffect(() => {
    const interval = setInterval(() => {
      if (isStoppedRef.current) return
      setCurrentImgIndex((prev) => (prev + 1) % PRELOADER_PRODUCTS.length)
    }, 125)

    return () => clearInterval(interval)
  }, []) // Empty dependency array ensures smooth, uninterrupted rotation

  // 2. Smooth percentage count from 0% to 100% synchronized with behind-the-scenes 3D preloading
  useEffect(() => {
    const tween = gsap.to(progressRef.current, {
      value: 100,
      duration: 2.2,
      ease: 'power2.out',
      onUpdate: () => {
        // If 3D model is still downloading/compiling on slower devices, pause smoothly at 96%
        if (!isModelReadyRef.current && progressRef.current.value > 96) {
          progressRef.current.value = 96
        }
        setPercent(Math.floor(progressRef.current.value))
      },
      onComplete: () => {
        const triggerCurtain = () => {
          setPercent(100)
          isStoppedRef.current = true
          // Immediately activate the pre-warmed Velvet Curtain transition without delay
          setIsCurtainActive(true)
        }

        if (isModelReadyRef.current) {
          triggerCurtain()
        } else {
          // Poll until 3D homesec is fully ready
          const pollTimer = setInterval(() => {
            if (isModelReadyRef.current) {
              clearInterval(pollTimer)
              triggerCurtain()
            }
          }, 30)
        }
      },
    })

    return () => {
      tween.kill()
    }
  }, [])

  // Called when the Velvet Curtain has fully swept across and covered the entire screen
  const handleCurtainCovered = () => {
    // Unmount the black preloader screen behind the curtain
    // Leaving the fully preloaded 3D homesec ready to be revealed
    setIsPreloaderVisible(false)
  }

  // Called when the Velvet Curtain has pulled back to the right and revealed homesec
  const handleCurtainComplete = () => {
    onPreloaderComplete?.()
  }

  return (
    <>
      {/* Preloader Screen Overlay */}
      {isPreloaderVisible && (
        <div className="fixed inset-0 z-50 bg-[#000000] flex items-center justify-center select-none overflow-hidden">
          {/* Center: Looping Product Garment Image */}
          <div className="flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 pointer-events-none">
            <img
              src={PRELOADER_PRODUCTS[currentImgIndex]}
              alt="Loading garment preview"
              className="max-w-full max-h-full object-contain drop-shadow-sm select-none will-change-transform"
            />
          </div>

          {/* Bottom Right: Clean Modern Percentage Counter matching reference image */}
          <div className="absolute bottom-8 right-8 sm:bottom-12 sm:right-12 pointer-events-none text-right">
            <span className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white font-sans tabular-nums select-none">
              {percent}%
            </span>
          </div>
        </div>
      )}

      {/* Codrops Velvet Curtain Stage Transition (pre-warmed WebGL canvas) */}
      <VelvetCurtain
        color="#ff4d1c"
        isActive={isCurtainActive}
        onCovered={handleCurtainCovered}
        onComplete={handleCurtainComplete}
      />
    </>
  )
}
