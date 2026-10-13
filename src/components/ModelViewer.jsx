import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

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
    renderer.toneMappingExposure = 1.2
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    // Studio Environment for realistic metallic silver reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    const roomEnv = new RoomEnvironment()
    const envTexture = pmremGenerator.fromScene(roomEnv).texture
    scene.environment = envTexture
    if ('environmentIntensity' in scene) {
      scene.environmentIntensity = 1.3
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
      color: new THREE.Color(0x9fa4aa),
      metalness: 0.96,
      roughness: 0.20,
      roughnessMap: brushedTexture,
      clearcoat: 0.4,
      clearcoatRoughness: 0.15,
      envMapIntensity: 1.6,
    })

    // Realistic polished chrome / silver wire material for hangers
    const hangerSilverMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xb0b5bc),
      metalness: 0.98,
      roughness: 0.12,
      clearcoat: 0.6,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.8,
    })

    // Balanced studio lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight)

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8)
    dirLight1.position.set(5, 12, 8)
    scene.add(dirLight1)

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.9)
    dirLight2.position.set(-6, 6, -5)
    scene.add(dirLight2)

    // Rim light to highlight silver metal tube silhouettes
    const rimLight = new THREE.DirectionalLight(0xddeeff, 1.4)
    rimLight.position.set(0, 8, -8)
    scene.add(rimLight)

    // Load Model
    const loader = new GLTFLoader()

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
