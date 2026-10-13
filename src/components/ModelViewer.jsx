import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import sassyImg from '../assets/imgs/sassy.png'

export default function ModelViewer() {
  const containerRef = useRef(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scene setup
    const scene = new THREE.Scene()

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    // Studio Environment for realistic metallic silver reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    const roomEnv = new RoomEnvironment()
    const envTexture = pmremGenerator.fromScene(roomEnv).texture
    scene.environment = envTexture
    if ('environmentIntensity' in scene) {
      scene.environmentIntensity = 1.1
    }

    // Procedural micro-brushed metal texture for realistic real-world silver look
    const createBrushedTexture = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#808080'
      ctx.fillRect(0, 0, 512, 512)
      for (let i = 0; i < 3500; i++) {
        const y = Math.random() * 512
        const len = 20 + Math.random() * 100
        const x = Math.random() * 512
        const shade = Math.random() > 0.5 ? 255 : 0
        ctx.strokeStyle = `rgba(${shade}, ${shade}, ${shade}, 0.04)`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + len, y)
        ctx.stroke()
      }
      const tex = new THREE.CanvasTexture(canvas)
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(4, 4)
      return tex
    }

    const brushedTexture = createBrushedTexture()

    // Realistic brushed silver material for rack
    const rackSilverMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xa5aab0),
      metalness: 0.96,
      roughness: 0.20,
      roughnessMap: brushedTexture,
      clearcoat: 0.4,
      clearcoatRoughness: 0.15,
      envMapIntensity: 1.6,
    })

    // Realistic polished chrome / silver wire material for hangers
    const hangerSilverMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xbcc1c8),
      metalness: 0.98,
      roughness: 0.12,
      clearcoat: 0.6,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.8,
    })

    // Balanced studio lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.6)
    dirLight1.position.set(5, 12, 8)
    scene.add(dirLight1)

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight2.position.set(-6, 6, -5)
    scene.add(dirLight2)

    // Rim light to highlight silver metal tube silhouettes
    const rimLight = new THREE.DirectionalLight(0xddeeff, 1.2)
    rimLight.position.set(0, 8, -8)
    scene.add(rimLight)

    // Load Model
    const loader = new GLTFLoader()

    // Generate authentic cotton knit fabric normal map
    const createCottonNormalMap = () => {
      const size = 512
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      const imgData = ctx.createImageData(size, size)
      const d = imgData.data

      // Create cotton jersey knit height grid (vertical ribs + knit loop structure)
      const height = new Float32Array(size * size)
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const rib = Math.sin((x / size) * Math.PI * 120) * 0.5 + 0.5
          const loop = Math.cos((y / size) * Math.PI * 120) * 0.5 + 0.5
          const threadNoise = (Math.random() - 0.5) * 0.22
          height[y * size + x] = rib * 0.55 + loop * 0.25 + threadNoise
        }
      }

      // Convert height to tangent-space normal map using Sobel gradient
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4
          const ym = (y - 1 + size) % size
          const yp = (y + 1) % size
          const xm = (x - 1 + size) % size
          const xp = (x + 1) % size

          const dx = (height[y * size + xp] - height[y * size + xm]) * 2.2
          const dy = (height[yp * size + x] - height[ym * size + x]) * 2.2

          const len = Math.sqrt(dx * dx + dy * dy + 1.0)
          const nx = (-dx / len) * 0.5 + 0.5
          const ny = (-dy / len) * 0.5 + 0.5
          const nz = (1.0 / len) * 0.5 + 0.5

          d[idx] = Math.round(nx * 255)
          d[idx + 1] = Math.round(ny * 255)
          d[idx + 2] = Math.round(nz * 255)
          d[idx + 3] = 255
        }
      }

      ctx.putImageData(imgData, 0, 0)
      const tex = new THREE.CanvasTexture(canvas)
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(18, 18)
      return tex
    }

    const cottonNormalMap = createCottonNormalMap()

    // Build seamless canvas texture with deep dark streetwear orange & solid pitch-black Stüssy print
    const teeCanvas = document.createElement('canvas')
    teeCanvas.width = 1024
    teeCanvas.height = 1024
    const teeCtx = teeCanvas.getContext('2d')
    const teeCanvasTex = new THREE.CanvasTexture(teeCanvas)
    teeCanvasTex.flipY = false
    teeCanvasTex.colorSpace = THREE.SRGBColorSpace

    // Realistic cotton fabric material (zero plastic shine, soft fiber sheen, visible cloth weave)
    const featuredTeeMaterial = new THREE.MeshPhysicalMaterial({
      map: teeCanvasTex,
      normalMap: cottonNormalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.96, // 100% matte cotton cloth - eliminates plastic sheen
      metalness: 0.0,
      clearcoat: 0.0, // Strictly NO clearcoat (which causes plastic look)
      sheen: 1.0, // Microfiber cloth sheen scattering
      sheenColor: new THREE.Color(0xb53502), // Warm fiber fuzz scattering
      sheenRoughness: 0.8,
    })

    const shirtImg = new Image()
    shirtImg.crossOrigin = 'anonymous'
    shirtImg.onload = () => {
      // 1. Draw source image onto temp canvas to extract print and color
      const tempC = document.createElement('canvas')
      tempC.width = 1024
      tempC.height = 1024
      const tempCtx = tempC.getContext('2d')
      tempCtx.drawImage(shirtImg, 0, 0, 1024, 1024)
      const srcData = tempCtx.getImageData(0, 0, 1024, 1024).data

      // Deep dark streetwear orange base color (warm burnt streetwear orange)
      const darkOrangeR = 198
      const darkOrangeG = 52
      const darkOrangeB = 4

      // 2. Base orange fabric with subtle cotton yarn variation
      teeCtx.fillStyle = `rgb(${darkOrangeR}, ${darkOrangeG}, ${darkOrangeB})`
      teeCtx.fillRect(0, 0, 1024, 1024)

      const outImgData = teeCtx.getImageData(0, 0, 1024, 1024)
      const out = outImgData.data

      for (let i = 0; i < out.length; i += 4) {
        // Subtle micro-heather cotton thread variance
        const thread = (Math.random() - 0.5) * 10
        let r = Math.min(255, Math.max(0, darkOrangeR + thread))
        let g = Math.min(255, Math.max(0, darkOrangeG + thread * 0.35))
        let b = Math.min(255, Math.max(0, darkOrangeB + thread * 0.15))

        const srcR = srcData[i]
        const srcG = srcData[i + 1]
        const srcB = srcData[i + 2]
        const srcA = srcData[i + 3]

        // Detect black artwork / graphic print from source
        const saturation = Math.max(srcR, srcG, srcB) - Math.min(srcR, srcG, srcB)
        const brightness = srcR * 0.299 + srcG * 0.587 + srcB * 0.114

        let inkStrength = 0
        if (srcA > 30) {
          if (brightness < 60) {
            // Full solid jet black ink
            inkStrength = 1.0
          } else if (brightness < 140 && saturation < 85) {
            // Anti-aliased black edge
            inkStrength = Math.min(1.0, Math.max(0, (140 - brightness) / 80))
          }
        }

        if (inkStrength > 0) {
          // Solid pitch black ink (#080808)
          const inkR = 8
          const inkG = 8
          const inkB = 8
          r = Math.round(r * (1 - inkStrength) + inkR * inkStrength)
          g = Math.round(g * (1 - inkStrength) + inkG * inkStrength)
          b = Math.round(b * (1 - inkStrength) + inkB * inkStrength)
        }

        out[i] = r
        out[i + 1] = g
        out[i + 2] = b
        out[i + 3] = 255
      }

      teeCtx.putImageData(outImgData, 0, 0)
      teeCanvasTex.needsUpdate = true
    }
    shirtImg.src = sassyImg

    loader.load(
      '/models/rack.glb',
      (gltf) => {
        const model = gltf.scene

        // Apply realistic silver materials to rack and hangers; keep clothes as matte fabric
        model.traverse((child) => {
          if (child.isMesh) {
            const name = (child.name || '').toLowerCase()
            const parentName = (child.parent?.name || '').toLowerCase()
            const isRack =
              name.startsWith('line') ||
              name.startsWith('circle') ||
              parentName.startsWith('line') ||
              parentName.startsWith('circle')
            const isHanger =
              name.startsWith('percha') || parentName.startsWith('percha')

            if (isRack) {
              child.material = rackSilverMaterial
            } else if (isHanger) {
              child.material = hangerSilverMaterial
            } else if (
              name.includes('camiseta pie052') ||
              parentName.includes('group067') ||
              name.includes('052')
            ) {
              child.material = featuredTeeMaterial
            } else {
              // Ensure clothes remain authentic matte fabric cloth (not reflective metal)
              child.material = child.material.clone()
              child.material.metalness = 0.0
              child.material.roughness = 0.92
              child.material.color = new THREE.Color(0x383b40)
            }
          }
        })

        // Center and normalize size
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())

        // Group wrapper for perfect centered rotation and scale
        const group = new THREE.Group()
        model.position.x = -center.x
        model.position.y = -center.y + (size.y * 0.08)
        model.position.z = -center.z
        group.add(model)

        // Scale down ("chhota kr dena")
        const scale = 0.70
        group.scale.set(scale, scale, scale)

        // Rotation matching reference
        group.rotation.y = -Math.PI * 0.25 // -45 degrees

        // Position model down slightly ("thoda sa niche")
        group.position.y = -size.y * 0.15
        scene.add(group)

        // Set camera position and target chosen by user
        camera.position.set(1.62, 53.13, 247.46)
        camera.lookAt(0, -11.8, 0)

        setLoading(false)
      },
      undefined,
      (error) => {
        console.error('Error loading 3D model:', error)
        setLoading(false)
      }
    )

    // Resize handler
    const handleResize = () => {
      if (!container) return
      const width = container.clientWidth
      const height = container.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)

    // Render loop (static locked view)
    let animationFrameId
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none">
      {loading && (
        <div className="absolute text-xs tracking-widest uppercase text-white/50 animate-pulse pointer-events-none">
          Loading Model...
        </div>
      )}
      <div ref={containerRef} className="w-full h-full pointer-events-none" />
    </div>
  )
}
