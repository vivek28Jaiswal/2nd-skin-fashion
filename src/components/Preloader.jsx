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
  pantsJeans,
  blueTee,
  blackCrew,
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

  // 1. Continuous, independent garment loop running at 85ms per frame (~12 fps)
  // Decoupled completely from % progress: cycles through all clothes multiple times
  // and ONLY stops when 100% is reached.
  useEffect(() => {
    const interval = setInterval(() => {
      if (isStoppedRef.current) return
      setCurrentImgIndex((prev) => (prev + 1) % PRELOADER_PRODUCTS.length)
    }, 85)

    return () => clearInterval(interval)
  }, [])

  // 2. Smooth percentage count from 0% to 100% over 3.2 seconds
  useEffect(() => {
    const tween = gsap.to(progressRef.current, {
      value: 100,
      duration: 3.2,
      ease: 'power1.out',
      onUpdate: () => {
        // If 3D model is still downloading on slower connections, pause smoothly near 96%
        if (!isModelReadyRef.current && progressRef.current.value > 96) {
          progressRef.current.value = 96
        }
        setPercent(Math.floor(progressRef.current.value))
      },
      onComplete: () => {
        const triggerCurtain = () => {
          setPercent(100)
          isStoppedRef.current = true
          setCurrentImgIndex(0) // Settle on the iconic orange hero tee
          // Trigger the pre-warmed velvet curtain immediately
          setIsCurtainActive(true)
        }

        if (isModelReadyRef.current) {
          triggerCurtain()
        } else {
          // Poll until 3D homesec is ready
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

  // Called when the Velvet Curtain has fully swept across and covered the screen
  const handleCurtainCovered = () => {
    // Hide black preloader screen behind the curtain
    // 3D homesec is already preloaded and ready to be revealed
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
          {/* Center: Looping Product Garment Image (All pre-rendered in DOM for zero-latency cycling) */}
          <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 pointer-events-none">
            {PRELOADER_PRODUCTS.map((imgSrc, idx) => (
              <img
                key={idx}
                src={imgSrc}
                alt={`Garment preview ${idx}`}
                className={`absolute max-w-full max-h-full object-contain drop-shadow-sm select-none will-change-transform ${
                  currentImgIndex === idx
                    ? 'opacity-100 z-10 visible'
                    : 'opacity-0 z-0 invisible'
                }`}
                loading="eager"
              />
            ))}
          </div>

          {/* Bottom Right: Clean Modern Percentage Counter matching reference image */}
          <div className="absolute bottom-8 right-8 sm:bottom-12 sm:right-12 pointer-events-none text-right">
            <span className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white font-sans tabular-nums select-none">
              {percent}%
            </span>
          </div>
        </div>
      )}

      {/* Codrops Velvet Curtain Stage Transition */}
      <VelvetCurtain
        color="#ff4d1c"
        isActive={isCurtainActive}
        onCovered={handleCurtainCovered}
        onComplete={handleCurtainComplete}
      />
    </>
  )
}
