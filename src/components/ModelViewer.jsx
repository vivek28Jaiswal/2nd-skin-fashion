import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import sassyImg from '../assets/imgs/sassy.png'
import blackTeeImg from '../assets/imgs/blacktshirt.png'
import blackHalfSleeveImg from '../assets/imgs/blacktshirt-halfsleeve.png'
import blueTeeImg from '../assets/imgs/bluetshirt.png'
import jeans1Img from '../assets/imgs/jeans1.png'
import jeans2Img from '../assets/imgs/jeans2.png'
import jeans3Img from '../assets/imgs/jeans3.png'

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
    renderer.toneMappingExposure = 1.05
    renderer.outputColorSpace = THREE.SRGBColorSpace
    // Physically Accurate Soft Dynamic Shadow Mapping
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
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

    // Balanced studio lighting with physically accurate soft shadow projection
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55)
    scene.add(ambientLight)

    // Key directional light with high-res soft shadow map
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.7)
    dirLight1.position.set(22, 38, 28)
    dirLight1.castShadow = true
    dirLight1.shadow.mapSize.width = 2048
    dirLight1.shadow.mapSize.height = 2048
    dirLight1.shadow.camera.near = 5
    dirLight1.shadow.camera.far = 130
    const shadowDist = 48
    dirLight1.shadow.camera.left = -shadowDist
    dirLight1.shadow.camera.right = shadowDist
    dirLight1.shadow.camera.top = shadowDist
    dirLight1.shadow.camera.bottom = -shadowDist
    dirLight1.shadow.bias = -0.00035
    dirLight1.shadow.normalBias = 0.02
    dirLight1.shadow.radius = 2.2
    scene.add(dirLight1)

    // Fill directional light with soft shadow mapping
    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.85)
    dirLight2.position.set(-24, 22, -18)
    dirLight2.castShadow = true
    dirLight2.shadow.mapSize.width = 1024
    dirLight2.shadow.mapSize.height = 1024
    dirLight2.shadow.camera.near = 5
    dirLight2.shadow.camera.far = 110
    dirLight2.shadow.camera.left = -shadowDist
    dirLight2.shadow.camera.right = shadowDist
    dirLight2.shadow.camera.top = shadowDist
    dirLight2.shadow.camera.bottom = -shadowDist
    dirLight2.shadow.bias = -0.00035
    dirLight2.shadow.normalBias = 0.02
    dirLight2.shadow.radius = 3.2
    scene.add(dirLight2)

    // Rim light to highlight silver metal tube silhouettes and fabric contours
    const rimLight = new THREE.DirectionalLight(0xddeeff, 1.25)
    rimLight.position.set(0, 16, -26)
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

    // Generate authentic denim diagonal 3x3 twill weave normal map
    const createDenimNormalMap = () => {
      const size = 512
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      const imgData = ctx.createImageData(size, size)
      const d = imgData.data

      const height = new Float32Array(size * size)
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const diag = Math.sin(((x + y) / size) * Math.PI * 180) * 0.5 + 0.5
          const warp = Math.cos((x / size) * Math.PI * 140) * 0.3 + 0.5
          const weft = Math.sin((y / size) * Math.PI * 140) * 0.2 + 0.5
          const threadNoise = (Math.random() - 0.5) * 0.28
          height[y * size + x] = diag * 0.55 + warp * 0.25 + weft * 0.15 + threadNoise
        }
      }

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4
          const ym = (y - 1 + size) % size
          const yp = (y + 1) % size
          const xm = (x - 1 + size) % size
          const xp = (x + 1) % size

          const dx = (height[y * size + xp] - height[y * size + xm]) * 2.5
          const dy = (height[yp * size + x] - height[ym * size + x]) * 2.5

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
      tex.repeat.set(16, 16)
      return tex
    }

    const denimNormalMap = createDenimNormalMap()

    // Helper to generate Streetwear T-Shirt Canvas Textures with authentic graphics
    const createTeeTexture = (imageSrc, baseR, baseG, baseB, mode) => {
      const canvas = document.createElement('canvas')
      canvas.width = 1024
      canvas.height = 1024
      const ctx = canvas.getContext('2d')
      const tex = new THREE.CanvasTexture(canvas)
      tex.flipY = false
      tex.colorSpace = THREE.SRGBColorSpace

      // Render pristine base fabric with subtle heather thread variations
      const renderBase = () => {
        const outImgData = ctx.createImageData(1024, 1024)
        const out = outImgData.data
        for (let i = 0; i < out.length; i += 4) {
          const thread = (Math.random() - 0.5) * 8
          out[i] = Math.min(255, Math.max(0, baseR + thread))
          out[i + 1] = Math.min(255, Math.max(0, baseG + thread * 0.35))
          out[i + 2] = Math.min(255, Math.max(0, baseB + thread * 0.2))
          out[i + 3] = 255
        }
        ctx.putImageData(outImgData, 0, 0)
      }

      renderBase()

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const temp = document.createElement('canvas')
        temp.width = 1024
        temp.height = 1024
        const tctx = temp.getContext('2d')
        tctx.drawImage(img, 0, 0, 1024, 1024)
        const srcData = tctx.getImageData(0, 0, 1024, 1024).data

        // 100% pure fabric canvas without ANY studio backdrop
        const outImgData = ctx.createImageData(1024, 1024)
        const out = outImgData.data

        for (let y = 0; y < 1024; y++) {
          const normY = y / 1024
          for (let x = 0; x < 1024; x++) {
            const normX = x / 1024
            const i = (y * 1024 + x) * 4

            const thread = (Math.random() - 0.5) * 8
            let r = Math.min(255, Math.max(0, baseR + thread))
            let g = Math.min(255, Math.max(0, baseG + thread * 0.35))
            let b = Math.min(255, Math.max(0, baseB + thread * 0.2))

            const sR = srcData[i]
            const sG = srcData[i + 1]
            const sB = srcData[i + 2]
            const sA = srcData[i + 3]
            const brightness = sR * 0.299 + sG * 0.587 + sB * 0.114
            const saturation = Math.max(sR, sG, sB) - Math.min(sR, sG, sB)

            if (mode === 'orangeStussy') {
              // Centered black Stüssy script. White background is completely ignored.
              if (sA > 30) {
                if (brightness < 60) {
                  r = 8; g = 8; b = 8
                } else if (brightness < 140 && saturation < 85) {
                  const strength = Math.min(1.0, (140 - brightness) / 80)
                  r = Math.round(r * (1 - strength) + 8 * strength)
                  g = Math.round(g * (1 - strength) + 8 * strength)
                  b = Math.round(b * (1 - strength) + 8 * strength)
                }
              }
            } else if (mode === 'blackStussy') {
              // White Stüssy logo in center chest [normX: 0.28..0.72, normY: 0.30..0.62].
              // Outside this area, pure black cotton. Studio light-grey backdrop is completely excluded.
              const inGraphicRegion =
                normX >= 0.28 && normX <= 0.72 && normY >= 0.30 && normY <= 0.62
              if (inGraphicRegion && sA > 30 && brightness > 90) {
                const strength = Math.min(1.0, (brightness - 90) / 75)
                r = Math.round(r * (1 - strength) + 246 * strength)
                g = Math.round(g * (1 - strength) + 246 * strength)
                b = Math.round(b * (1 - strength) + 246 * strength)
              }
            } else if (mode === 'blackY3') {
              // White/grey Yohji Yamamoto Adidas artwork in center [normX: 0.27..0.73, normY: 0.28..0.76].
              // Outside this area, pure black cotton. Studio white backdrop is completely excluded.
              const inGraphicRegion =
                normX >= 0.27 && normX <= 0.73 && normY >= 0.28 && normY <= 0.76
              if (inGraphicRegion && sA > 30 && brightness > 85) {
                const strength = Math.min(1.0, (brightness - 85) / 75)
                const printLuma = Math.min(242, brightness * 1.08)
                r = Math.round(r * (1 - strength) + printLuma * strength)
                g = Math.round(g * (1 - strength) + printLuma * strength)
                b = Math.round(b * (1 - strength) + printLuma * strength)
              }
            } else if (mode === 'blueGraffiti') {
              // Yellow graffiti tag located at lower back [normX: 0.20..0.80, normY: 0.58..0.88].
              // Outside this area, pure royal blue cotton. Studio white backdrop is completely ignored.
              const inGraphicRegion =
                normX >= 0.20 && normX <= 0.80 && normY >= 0.58 && normY <= 0.88
              const isYellow =
                inGraphicRegion && sA > 30 && sR > 130 && sG > 120 && sB < 115
              if (isYellow) {
                const strength = Math.min(1.0, (sR + sG - sB * 2) / 200)
                r = Math.round(r * (1 - strength) + 252 * strength)
                g = Math.round(g * (1 - strength) + 218 * strength)
                b = Math.round(b * (1 - strength) + 16 * strength)
              }
            }

            out[i] = r
            out[i + 1] = g
            out[i + 2] = b
            out[i + 3] = 255
          }
        }

        ctx.putImageData(outImgData, 0, 0)
        tex.needsUpdate = true
      }
      img.src = imageSrc
      return tex
    }

    // Procedural Generator for Luxury Streetwear Baggy Jeans Textures
    const createStylishBaggyJeansTexture = ({
      baseR,
      baseG,
      baseB,
      fadeR,
      fadeG,
      fadeB,
      stitchColor,
      rivetColor,
      buttonColor,
      leatherPatchColor,
    }) => {
      const size = 1024
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      const tex = new THREE.CanvasTexture(canvas)
      tex.flipY = false
      tex.colorSpace = THREE.SRGBColorSpace

      // 1. Generate Authentic Denim Twill Cloth with Baggy Thigh Fades & Whiskers
      const imgData = ctx.createImageData(size, size)
      const d = imgData.data

      for (let y = 0; y < size; y++) {
        // Vertical fading curve: strongest across mid-thigh and knee drape (y: 100 to 700)
        let vFade = 0
        if (y > 90 && y < 720) {
          vFade = Math.sin(((y - 90) / 630) * Math.PI)
        }

        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4

          // Distance to center of left baggy leg (x ~ 275) and right baggy leg (x ~ 750)
          const dLeft = Math.abs(x - 275) / 195
          const dRight = Math.abs(x - 750) / 195
          const legDist = Math.min(dLeft, dRight)
          const horizWash = Math.max(0, 1 - legDist * legDist)

          // Radial Whiskering / Creasing pattern near hips/crotch (y: 90..290)
          let whisker = 0
          if (y > 80 && y < 300) {
            const relX = Math.abs(x - 512)
            const relY = y - 80
            const angle = Math.atan2(relY, relX)
            whisker = Math.sin(angle * 13 + relX * 0.045) * 0.16
            whisker *= Math.max(0, 1 - Math.abs(y - 180) / 110)
          }

          // Combined stonewash intensity
          const washIntensity = Math.min(1.0, Math.max(0, vFade * horizWash * 0.88 + whisker))

          // Authentic 3x3 diagonal twill weave micro-structure
          const twill = Math.sin(((x * 1.4 + y) / size) * Math.PI * 250) * 8.0
          const weft = Math.cos((y / size) * Math.PI * 250) * 4.0
          const slubNoise = (Math.random() - 0.5) * 11

          // Interpolate between base dark denim and faded stonewash highlight
          let r = baseR * (1 - washIntensity) + fadeR * washIntensity + twill + slubNoise
          let g = baseG * (1 - washIntensity) + fadeG * washIntensity + twill * 0.8 + slubNoise * 0.8
          let b = baseB * (1 - washIntensity) + fadeB * washIntensity + twill * 0.6 + slubNoise * 0.6

          // Crotch and inner leg crease shading (around center x = 512)
          if (Math.abs(x - 512) < 24 && y > 160) {
            const shadow = 1 - (1 - Math.abs(x - 512) / 24) * 0.38
            r *= shadow
            g *= shadow
            b *= shadow
          }

          // Waistband fold shadow at y = 72
          if (y >= 70 && y <= 76) {
            r *= 0.72
            g *= 0.72
            b *= 0.72
          }

          d[idx] = Math.max(0, Math.min(255, Math.round(r)))
          d[idx + 1] = Math.max(0, Math.min(255, Math.round(g)))
          d[idx + 2] = Math.max(0, Math.min(255, Math.round(b)))
          d[idx + 3] = 255
        }
      }

      ctx.putImageData(imgData, 0, 0)

      // 2. Vector Artwork: Seams, Stitches, Pockets, Rivets, Belt Loops & Hardware
      const drawStitchLine = (x1, y1, x2, y2, lineWidth = 1.8) => {
        // Shadow for tactile thread relief
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(x1, y1 + 1)
        ctx.lineTo(x2, y2 + 1)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.lineWidth = lineWidth
        ctx.setLineDash([6, 3])
        ctx.stroke()
        // Thread
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = stitchColor
        ctx.lineWidth = lineWidth
        ctx.setLineDash([6, 3])
        ctx.stroke()
        ctx.restore()
      }

      // Outer Side Seams (Heavy Flat-Felled Double Stitch down left & right)
      drawStitchLine(32, 74, 32, 960)
      drawStitchLine(40, 74, 40, 960)
      drawStitchLine(984, 74, 984, 960)
      drawStitchLine(992, 74, 992, 960)

      // Inseam Center Division (Double-needle stitch separating wide baggy legs)
      drawStitchLine(506, 175, 506, 960)
      drawStitchLine(518, 175, 518, 960)

      // Waistband Double Topstitching across full top (y: 14 and y: 64)
      drawStitchLine(20, 14, 1004, 14, 2.0)
      drawStitchLine(20, 64, 1004, 64, 2.0)

      // 5 Heavy Baggy Belt Loops
      const loopXPositions = [75, 285, 512, 740, 945]
      loopXPositions.forEach((lx) => {
        ctx.save()
        ctx.fillStyle = `rgb(${Math.max(0, baseR - 12)}, ${Math.max(0, baseG - 12)}, ${Math.max(0, baseB - 12)})`
        ctx.fillRect(lx - 9, 8, 18, 58)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
        ctx.fillRect(lx - 9, 8, 2, 58)
        ctx.fillRect(lx + 7, 8, 2, 58)
        ctx.fillStyle = stitchColor
        ctx.fillRect(lx - 7, 10, 14, 3)
        ctx.fillRect(lx - 7, 62, 14, 3)
        ctx.restore()
      })

      // Back Waistband Leather Brand Patch (Right side)
      ctx.save()
      ctx.fillStyle = leatherPatchColor
      ctx.fillRect(815, 12, 105, 50)
      ctx.strokeStyle = '#c89e5a'
      ctx.lineWidth = 1.2
      ctx.setLineDash([4, 2])
      ctx.strokeRect(818, 15, 99, 44)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('WTF DENIM', 867, 36)
      ctx.font = '7px sans-serif'
      ctx.fillText('BAGGY FIT ~ 1994', 867, 48)
      ctx.restore()

      // Center Front Fly (Iconic Curved J-Stitch)
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(512, 72)
      ctx.lineTo(512, 140)
      ctx.bezierCurveTo(512, 175, 455, 170, 450, 135)
      ctx.lineTo(450, 72)
      ctx.strokeStyle = stitchColor
      ctx.lineWidth = 2.0
      ctx.setLineDash([6, 3])
      ctx.stroke()
      ctx.fillStyle = stitchColor
      ctx.fillRect(507, 172, 10, 3.5)
      ctx.restore()

      // Curved Front Pockets (Left & Right)
      const drawCurvedPocket = (isLeft) => {
        ctx.save()
        ctx.beginPath()
        if (isLeft) {
          ctx.moveTo(90, 72)
          ctx.quadraticCurveTo(80, 160, 36, 230)
        } else {
          ctx.moveTo(934, 72)
          ctx.quadraticCurveTo(944, 160, 988, 230)
        }
        ctx.strokeStyle = stitchColor
        ctx.lineWidth = 2.0
        ctx.setLineDash([6, 3])
        ctx.stroke()
        ctx.restore()
      }
      drawCurvedPocket(true)
      drawCurvedPocket(false)

      // Coin Pocket (Inside Right Pocket)
      drawStitchLine(770, 100, 865, 100, 1.8)
      drawStitchLine(770, 106, 865, 106, 1.8)

      // Rivets (Metallic Dome Studs with 3D Highlight)
      const drawRivet = (rx, ry) => {
        ctx.save()
        const grad = ctx.createRadialGradient(rx - 1.5, ry - 1.5, 1, rx, ry, 5.5)
        grad.addColorStop(0, '#ffffff')
        grad.addColorStop(0.3, rivetColor)
        grad.addColorStop(1, '#1b1b1b')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(rx, ry, 5.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.beginPath()
        ctx.arc(rx, ry, 1.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      drawRivet(90, 74)
      drawRivet(36, 228)
      drawRivet(934, 74)
      drawRivet(988, 228)
      drawRivet(770, 102)
      drawRivet(865, 102)

      // Center Metal Shank Button on Waistband
      ctx.save()
      const bx = 512
      const by = 38
      const bGrad = ctx.createRadialGradient(bx - 3, by - 3, 2, bx, by, 14)
      bGrad.addColorStop(0, '#ffffff')
      bGrad.addColorStop(0.35, buttonColor)
      bGrad.addColorStop(1, '#202020')
      ctx.fillStyle = bGrad
      ctx.beginPath()
      ctx.arc(bx, by, 13, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(bx, by, 8.5, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
      ctx.beginPath()
      ctx.arc(bx, by, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Baggy Streetwear Carpenter Utility Detail on Side (Hammer Loop on left leg)
      ctx.save()
      ctx.fillStyle = `rgb(${Math.max(0, baseR - 12)}, ${Math.max(0, baseG - 12)}, ${Math.max(0, baseB - 12)})`
      ctx.fillRect(42, 430, 42, 14)
      ctx.strokeStyle = stitchColor
      ctx.lineWidth = 1.2
      ctx.setLineDash([4, 2])
      ctx.strokeRect(42, 430, 42, 14)
      ctx.fillStyle = stitchColor
      ctx.fillRect(42, 430, 4, 14)
      ctx.fillRect(80, 430, 4, 14)
      ctx.restore()

      // Bottom Cuffs (Folded Heavy Hem with Chain-Stitching & Roping Effect)
      ctx.save()
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'
      ctx.fillRect(20, 960, 984, 64)
      drawStitchLine(20, 964, 1004, 964, 2.2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)'
      ctx.lineWidth = 2.0
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(20, 1020)
      ctx.lineTo(1004, 1020)
      ctx.stroke()
      ctx.restore()

      tex.needsUpdate = true
      return tex
    }

    // 4 Streetwear T-Shirt Materials
    const orangeTeeTex = createTeeTexture(sassyImg, 198, 52, 4, 'orangeStussy')
    const blackStussyTex = createTeeTexture(blackTeeImg, 16, 17, 19, 'blackStussy')
    const blackY3Tex = createTeeTexture(blackHalfSleeveImg, 18, 19, 21, 'blackY3')
    const blueGraffitiTex = createTeeTexture(blueTeeImg, 24, 65, 173, 'blueGraffiti')

    const orangeTeeMaterial = new THREE.MeshPhysicalMaterial({
      map: orangeTeeTex,
      normalMap: cottonNormalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.96,
      metalness: 0.0,
      clearcoat: 0.0,
      sheen: 1.0,
      sheenColor: new THREE.Color(0xb53502),
      sheenRoughness: 0.8,
    })

    const blackStussyMaterial = new THREE.MeshPhysicalMaterial({
      map: blackStussyTex,
      normalMap: cottonNormalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.96,
      metalness: 0.0,
      clearcoat: 0.0,
      sheen: 0.4,
      sheenColor: new THREE.Color(0x222224),
      sheenRoughness: 0.8,
    })

    const blackY3Material = new THREE.MeshPhysicalMaterial({
      map: blackY3Tex,
      normalMap: cottonNormalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.96,
      metalness: 0.0,
      clearcoat: 0.0,
      sheen: 0.4,
      sheenColor: new THREE.Color(0x222224),
      sheenRoughness: 0.8,
    })

    const blueTeeMaterial = new THREE.MeshPhysicalMaterial({
      map: blueGraffitiTex,
      normalMap: cottonNormalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.96,
      metalness: 0.0,
      clearcoat: 0.0,
      sheen: 0.9,
      sheenColor: new THREE.Color(0x1d4ed8),
      sheenRoughness: 0.8,
    })

    // 3 Distinct Designer Baggy Streetwear Denim Editions
    // Edition 1: 90s Vintage Stonewash Baggy Indigo Denim
    const jeans1Tex = createStylishBaggyJeansTexture({
      baseR: 36,
      baseG: 56,
      baseB: 88,
      fadeR: 112,
      fadeG: 148,
      fadeB: 188,
      stitchColor: '#d99b38',
      rivetColor: '#c8963e',
      buttonColor: '#d4af37',
      leatherPatchColor: '#6d4522',
    })

    // Edition 2: Y2K Sun-Bleached Ice Blue Skater Baggy Denim
    const jeans2Tex = createStylishBaggyJeansTexture({
      baseR: 78,
      baseG: 110,
      baseB: 144,
      fadeR: 168,
      fadeG: 198,
      fadeB: 230,
      stitchColor: '#c98836',
      rivetColor: '#b0b5be',
      buttonColor: '#b8bdc6',
      leatherPatchColor: '#8a5c34',
    })

    // Edition 3: Washed Raw Charcoal Black Baggy Denim
    const jeans3Tex = createStylishBaggyJeansTexture({
      baseR: 26,
      baseG: 27,
      baseB: 30,
      fadeR: 64,
      fadeG: 68,
      fadeB: 74,
      stitchColor: '#989ca6',
      rivetColor: '#686c75',
      buttonColor: '#7a7e88',
      leatherPatchColor: '#2b2927',
    })

    const jeans1Material = new THREE.MeshPhysicalMaterial({
      map: jeans1Tex,
      normalMap: denimNormalMap,
      normalScale: new THREE.Vector2(1.1, 1.1),
      roughness: 0.92,
      metalness: 0.0,
      clearcoat: 0.0,
      sheen: 0.75,
      sheenColor: new THREE.Color(0x93c5fd),
      sheenRoughness: 0.75,
    })

    const jeans2Material = new THREE.MeshPhysicalMaterial({
      map: jeans2Tex,
      normalMap: denimNormalMap,
      normalScale: new THREE.Vector2(1.1, 1.1),
      roughness: 0.92,
      metalness: 0.0,
      clearcoat: 0.0,
      sheen: 0.75,
      sheenColor: new THREE.Color(0xbfdbfe),
      sheenRoughness: 0.75,
    })

    const jeans3Material = new THREE.MeshPhysicalMaterial({
      map: jeans3Tex,
      normalMap: denimNormalMap,
      normalScale: new THREE.Vector2(1.1, 1.1),
      roughness: 0.94,
      metalness: 0.0,
      clearcoat: 0.0,
      sheen: 0.5,
      sheenColor: new THREE.Color(0x374151),
      sheenRoughness: 0.75,
    })

    // Distribution mapping for T-Shirts across carousel
    const getTeeMaterial = (name, parentName) => {
      const id = `${name} ${parentName}`.toLowerCase()
      // Orange Stüssy Featured Tee
      if (id.includes('052') || id.includes('048') || id.includes('044')) return orangeTeeMaterial
      // Black Stüssy Signature Tee
      if (id.includes('051') || id.includes('047') || id.includes('043')) return blackStussyMaterial
      // Blue Graffiti Streetwear Tee
      if (id.includes('050') || id.includes('046') || id.includes('042')) return blueTeeMaterial
      // Black Y-3 Adidas Streetwear Tee
      return blackY3Material
    }

    // Distribution mapping for Jeans across carousel
    const getJeansMaterial = (name, parentName) => {
      const id = `${name} ${parentName}`.toLowerCase()
      // Light Vintage Wash Blue Denim
      if (id.includes('020') || id.includes('023') || id.includes('026')) return jeans1Material
      // Medium Indigo Stone-Wash Denim
      if (id.includes('021') || id.includes('024') || id.includes('027')) return jeans2Material
      // Washed Charcoal Black Denim
      return jeans3Material
    }

    // Physics and interaction state
    let isDragging = false
    let dragMode = null // 'ring' | 'garment' | 'carousel'
    let lastPointerX = 0
    let lastPointerY = 0
    let spinVelocity = 0
    let prevCarouselRotY = 0
    let prevCarouselVelocityY = 0
    let lastTime = performance.now()

    const carouselGroup = new THREE.Group()
    carouselGroup.name = 'rotating_carousel'

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    const interactiveObjects = []
    const garmentsPhysicsList = []

    // GPU Vertex Shader Cloth Deformer (Lag, Traveling Ripples, Sleeve Flutter & Collision Compression)
    const applyClothShader = (material, isTee, bounds, paramsUniform) => {
      const boundsUniform = {
        value: new THREE.Vector4(bounds.min.y, bounds.max.y, bounds.min.x, bounds.max.x),
      }

      const patchVertexShader = (shader) => {
        shader.uniforms.uClothParams = paramsUniform
        shader.uniforms.uClothBounds = boundsUniform
        shader.uniforms.uGarmentType = { value: isTee ? 1.0 : 2.0 }

        shader.vertexShader = `
          uniform vec4 uClothParams;
          uniform vec4 uClothBounds;
          uniform float uGarmentType;
        ` + shader.vertexShader

        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>

          float clothH = max(1.0, uClothBounds.y - uClothBounds.x);
          float normY = clamp((uClothBounds.y - position.y) / clothH, 0.0, 1.0);

          // Parabolic fabric lag bend (anchored at hanger top, flexible towards lower hem)
          float bendWeight = pow(normY, 1.6);
          float lagDisp = uClothParams.x * bendWeight * 1.8;

          // Traveling dynamic ripples, folds and creases
          float wavePhase = normY * 8.0 - uClothParams.z * 3.5;
          float crossPhase = position.x * 0.08;
          float foldWave = sin(wavePhase + crossPhase) * cos(normY * 4.0);
          float wrinkleDisp = foldWave * uClothParams.y * bendWeight * 1.4;

          // Compression ripples when colliding with neighbouring garments
          float compWave = sin(normY * 16.0) * sin(position.x * 0.15) * uClothParams.w * bendWeight * 1.5;

          // Sleeve flexibility and aerodynamic flare for t-shirts
          if (uGarmentType < 1.5) {
            float halfW = max(1.0, (uClothBounds.w - uClothBounds.z) * 0.5);
            float relX = abs(position.x) / halfW;
            if (relX > 0.52 && normY < 0.65) {
              float sWeight = (relX - 0.52) * 2.0;
              transformed.x += sin(uClothParams.z * 4.0 + normY * 3.0) * uClothParams.y * sWeight * 1.0;
            }
          }

          // Apply fabric deformation along normal and tangent
          transformed.z += (lagDisp + wrinkleDisp + compWave);
          `
        )
      }

      material.onBeforeCompile = patchVertexShader
    }

    loader.load(
      '/models/rack.glb',
      (gltf) => {
        const model = gltf.scene

        // Apply realistic materials across rack, hangers, and all clothes designs with shadow support
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true

            const name = (child.name || '').toLowerCase()
            const parentName = (child.parent?.name || '').toLowerCase()
            const isRack =
              name.startsWith('line') ||
              name.startsWith('circle') ||
              parentName.startsWith('line') ||
              parentName.startsWith('circle')
            const isHanger =
              name.startsWith('percha') || parentName.startsWith('percha')
            const isShirt =
              name.includes('camiseta') ||
              parentName.includes('group02') ||
              (parentName.startsWith('group0') &&
                parseInt(parentName.replace(/\D/g, ''), 10) <= 67)
            const isJeans =
              name.includes('plane') ||
              (parentName.startsWith('group0') &&
                parseInt(parentName.replace(/\D/g, ''), 10) >= 68)

            if (isRack) {
              child.material = rackSilverMaterial
            } else if (isHanger) {
              child.material = hangerSilverMaterial
            } else if (isShirt) {
              child.material = getTeeMaterial(name, parentName).clone()
            } else if (isJeans) {
              child.material = getJeansMaterial(name, parentName).clone()
            } else {
              child.material = child.material.clone()
              child.material.metalness = 0.0
              child.material.roughness = 0.92
              child.material.color = new THREE.Color(0x383b40)
            }
          }
        })

        // Measure original model bounds
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const minY = box.min.y
        const totalHeight = size.y

        // Main group wrapper for centered rotation and scale
        const group = new THREE.Group()
        model.position.x = -center.x
        model.position.y = -center.y + size.y * 0.08
        model.position.z = -center.z
        group.add(model)

        // Scale and initial angle (strictly preserved from user specification)
        const scale = 0.70
        group.scale.set(scale, scale, scale)
        group.rotation.y = -Math.PI * 0.25 // -45 degrees
        group.position.y = -size.y * 0.15
        scene.add(group)

        // Update matrices so world positions are completely resolved
        scene.updateMatrixWorld(true)

        // Find the exact geometric center of the top circular metal ring
        const ringObject =
          model.getObjectByName('Circle001_1_0') ||
          model.getObjectByName('Circle001')
        const ringBox = new THREE.Box3().setFromObject(ringObject)
        const ringWorldCenter = ringBox.getCenter(new THREE.Vector3())
        const ringLocalCenter = group.worldToLocal(ringWorldCenter.clone())

        // Place rotating carousel group precisely at the center axis of the circular ring
        carouselGroup.position.set(ringLocalCenter.x, 0, ringLocalCenter.z)
        group.add(carouselGroup)
        group.updateMatrixWorld(true)

        // Separate rotating carousel from stationary base stand
        // In rack.glb, rootNode contains Line030..Line036, Circle001, and Group027..Group076
        const rootNode = model.getObjectByName('RootNode') || model
        const itemsToMove = []

        rootNode.children.forEach((child) => {
          const name = (child.name || '').toLowerCase()
          const isRing = name.startsWith('circle')
          const isClothingGroup = name.startsWith('group0')
          const childBox = new THREE.Box3().setFromObject(child)
          const isTopSpoke =
            name.startsWith('line') && childBox.min.y > minY + totalHeight * 0.55

          if (isRing || isClothingGroup || isTopSpoke) {
            itemsToMove.push(child)
          }
        })

        // Attach upper assembly directly to carouselGroup while preserving exact world transform
        itemsToMove.forEach((child) => {
          carouselGroup.attach(child)
        })

        // Setup physical compound pendulum and cloth physics for each garment
        itemsToMove.forEach((child) => {
          const name = (child.name || '').toLowerCase()
          if (!name.startsWith('group0')) return

          const basePosition = child.position.clone()
          const baseQuaternion = child.quaternion.clone()

          // Radial and Tangential directional vectors from carousel center to garment hook
          const radialDir = new THREE.Vector3(basePosition.x, 0, basePosition.z).normalize()
          const tangentDir = new THREE.Vector3(-radialDir.z, 0, radialDir.x).normalize()
          let angleOnRing = Math.atan2(basePosition.z, basePosition.x)
          if (angleOnRing < 0) angleOnRing += Math.PI * 2
          const radius = Math.sqrt(basePosition.x * basePosition.x + basePosition.z * basePosition.z)

          // Locate cloth meshes inside this clothing group
          let clothMeshes = []
          let isShirt = false
          child.traverse((c) => {
            if (c.isMesh) {
              const cName = (c.name || '').toLowerCase()
              if (cName.includes('camiseta') || cName.includes('plane')) {
                clothMeshes.push(c)
                if (cName.includes('camiseta')) isShirt = true
              }
            }
          })

          const paramsUniform = { value: new THREE.Vector4(0, 0, 0, 0) }
          clothMeshes.forEach((cm) => {
            cm.geometry.computeBoundingBox()
            const bounds = cm.geometry.boundingBox || new THREE.Box3(new THREE.Vector3(-15, -40, -15), new THREE.Vector3(15, 40, 15))
            applyClothShader(cm.material, isShirt, bounds, paramsUniform)
          })

          garmentsPhysicsList.push({
            name: child.name,
            group: child,
            basePosition: basePosition,
            baseQuaternion: baseQuaternion,
            radialDir: radialDir,
            tangentDir: tangentDir,
            angleOnRing: angleOnRing,
            radius: radius,
            isTee: isShirt,
            // Realistic Physical Properties
            // Denim Jeans: heavier mass, deeper momentum, higher stiffness
            // T-Shirts: lightweight, higher air draft reactivity, flexible sleeves
            mass: isShirt ? 0.22 : 0.70,
            length: isShirt ? 32.0 : 44.0,
            damping: isShirt ? 0.948 : 0.968,
            stiffness: isShirt ? 36.0 : 48.0,
            // Dynamic State
            angle: 0.0,
            velocity: 0.0,
            accel: 0.0,
            radialTilt: 0.0,
            radialVel: 0.0,
            radialAccel: 0.0,
            compression: 0.0,
            clothParams: paramsUniform,
          })
        })

        // Sort garments circularly around the rack to establish neighbouring cloth collision topology
        garmentsPhysicsList.sort((a, b) => a.angleOnRing - b.angleOnRing)
        const numG = garmentsPhysicsList.length
        for (let i = 0; i < numG; i++) {
          const leftIdx = (i - 1 + numG) % numG
          const rightIdx = (i + 1) % numG
          garmentsPhysicsList[i].leftIdx = leftIdx
          garmentsPhysicsList[i].rightIdx = rightIdx

          let dLeft = garmentsPhysicsList[i].angleOnRing - garmentsPhysicsList[leftIdx].angleOnRing
          if (dLeft <= 0) dLeft += Math.PI * 2
          let dRight = garmentsPhysicsList[rightIdx].angleOnRing - garmentsPhysicsList[i].angleOnRing
          if (dRight <= 0) dRight += Math.PI * 2

          garmentsPhysicsList[i].restDistLeft = dLeft * garmentsPhysicsList[i].radius
          garmentsPhysicsList[i].restDistRight = dRight * garmentsPhysicsList[i].radius
        }

        // Find interactive objects for raycasting
        carouselGroup.traverse((child) => {
          if (child.isMesh) {
            interactiveObjects.push(child)
          }
        })

        // Set camera position and target (strictly preserved)
        camera.position.set(1.62, 53.13, 247.46)
        camera.lookAt(0, -11.8, 0)

        prevCarouselRotY = carouselGroup.rotation.y
        lastTime = performance.now()
        setLoading(false)
      },
      undefined,
      (error) => {
        console.error('Error loading 3D model:', error)
        setLoading(false)
      }
    )

    // Pointer Interaction Handlers
    const updateMouseCoords = (e) => {
      const rect = container.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }

    const onPointerDown = (e) => {
      updateMouseCoords(e)
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(interactiveObjects, true)

      if (hits.length > 0) {
        dragMode = 'carousel'
      } else {
        dragMode = 'carousel'
      }

      isDragging = true
      lastPointerX = e.clientX
      lastPointerY = e.clientY
      spinVelocity = 0
      container.style.cursor = 'grabbing'
    }

    const onPointerMove = (e) => {
      updateMouseCoords(e)

      if (isDragging) {
        const deltaX = e.clientX - lastPointerX
        lastPointerX = e.clientX
        lastPointerY = e.clientY

        // Responsive, smooth rotation of upper carousel around its exact center axis
        const speed = 0.007
        carouselGroup.rotation.y += deltaX * speed
        spinVelocity = deltaX * speed
      } else {
        // Hover state cursor detection
        raycaster.setFromCamera(mouse, camera)
        const hits = raycaster.intersectObjects(interactiveObjects, true)
        if (hits.length > 0) {
          container.style.cursor = 'grab'
        } else {
          container.style.cursor = 'default'
        }
      }
    }

    const onPointerUp = () => {
      isDragging = false
      dragMode = null

      // Check current hover to restore appropriate cursor
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(interactiveObjects, true)
      container.style.cursor = hits.length > 0 ? 'grab' : 'default'
    }

    // Touch & Mouse listeners on container and window
    container.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)

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

    // Physics-driven render loop (Inertia, Cloth Simulation, Collisions & Soft Shadows)
    let animationFrameId
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      const currentTime = performance.now()
      const dt = Math.min((currentTime - lastTime) / 1000, 0.04)
      lastTime = currentTime

      // Natural rotational inertia and gradual ball-bearing friction deceleration
      if (!isDragging) {
        if (Math.abs(spinVelocity) > 0.00005) {
          carouselGroup.rotation.y += spinVelocity
          spinVelocity *= 0.948 // Smooth physical bearing damping
        } else {
          spinVelocity = 0
        }
      }

      // Compute carousel rotational acceleration and velocity with physical hand-drag limits
      const currentCarouselRotY = carouselGroup.rotation.y
      const rawCarouselVelY = (currentCarouselRotY - prevCarouselRotY) / Math.max(0.0001, dt)
      const carouselVelY = Math.max(-10.0, Math.min(10.0, rawCarouselVelY))
      const rawCarouselAccY = (carouselVelY - prevCarouselVelocityY) / Math.max(0.0001, dt)
      const carouselAccY = Math.max(-14.0, Math.min(14.0, rawCarouselAccY))
      prevCarouselRotY = currentCarouselRotY
      prevCarouselVelocityY = carouselVelY

      // Fixed-timestep substeps for stable Verlet / Symplectic Euler Cloth Simulation
      if (garmentsPhysicsList.length > 0) {
        const subSteps = 3
        const subDt = dt / subSteps

        for (let s = 0; s < subSteps; s++) {
          // 1. Compute forces, cloth inertia & neighbour collisions
          for (let i = 0; i < garmentsPhysicsList.length; i++) {
            const g = garmentsPhysicsList[i]
            if (!g) continue
            const leftG = garmentsPhysicsList[g.leftIdx]
            const rightG = garmentsPhysicsList[g.rightIdx]
            if (!leftG || !rightG) continue

            // Inertial torque: lagging behind carousel rotational acceleration
            const inertialTorque = Math.max(-3.5, Math.min(3.5, carouselAccY * 0.35))

            // Centrifugal outward force
            const centrifugalForce = Math.min(2.5, carouselVelY * carouselVelY * 0.022)

            // Gravity compound pendulum restoring torque
            const gravityTorque = -g.stiffness * Math.sin(g.angle)

            // Aerodynamic drag opposing velocity relative to rotating air
            const relVel = g.velocity + carouselVelY * 0.35
            const dragTorque = -0.5 * (g.isTee ? 2.4 : 1.2) * relVel * Math.abs(relVel)

            // Cloth-to-cloth collision detection between neighbouring garments
            const hContact = g.length * 0.65
            const distLeft = g.restDistLeft + hContact * (g.angle - leftG.angle)
            const distRight = g.restDistRight + hContact * (rightG.angle - g.angle)

            // Contact thickness threshold
            const threshLeft = (g.isTee ? 6.5 : 8.0) + (leftG.isTee ? 6.5 : 8.0)
            const threshRight = (g.isTee ? 6.5 : 8.0) + (rightG.isTee ? 6.5 : 8.0)

            let collTorqueLeft = 0
            let collTorqueRight = 0
            let compLeft = 0
            let compRight = 0

            if (distLeft < threshLeft) {
              const pen = Math.max(0.0, threshLeft - distLeft)
              compLeft = Math.min(4.0, pen)
              const relV = leftG.velocity - g.velocity
              const fContact = 35.0 * compLeft + 4.0 * relV
              collTorqueLeft = Math.max(0, Math.min(20.0, fContact / g.mass))
            }

            if (distRight < threshRight) {
              const pen = Math.max(0.0, threshRight - distRight)
              compRight = Math.min(4.0, pen)
              const relV = rightG.velocity - g.velocity
              const fContact = 35.0 * compRight + 4.0 * relV
              collTorqueRight = Math.max(0, Math.min(20.0, fContact / g.mass))
            }

            g.compression = compLeft + compRight

            // Net tangential angular acceleration
            const totalTorque =
              gravityTorque +
              inertialTorque +
              dragTorque +
              (collTorqueLeft - collTorqueRight)

            g.accel = Math.max(-40.0, Math.min(40.0, totalTorque / g.mass))

            // Radial tilt acceleration (centrifugal flare vs gravity restoring)
            g.radialAccel = (centrifugalForce - g.stiffness * 1.5 * g.radialTilt) / g.mass
          }

          // 2. Symplectic Euler integration
          for (let i = 0; i < garmentsPhysicsList.length; i++) {
            const g = garmentsPhysicsList[i]
            g.velocity = Math.max(-3.5, Math.min(3.5, (g.velocity + g.accel * subDt) * g.damping))
            g.angle += g.velocity * subDt
            g.angle = Math.max(-0.45, Math.min(0.45, g.angle))

            g.radialVel = Math.max(-2.5, Math.min(2.5, (g.radialVel + g.radialAccel * subDt) * g.damping))
            g.radialTilt += g.radialVel * subDt
            g.radialTilt = Math.max(0.0, Math.min(0.25, g.radialTilt))
          }
        }

        // 3. Apply physical orientations and GPU vertex shader deformations
        const simTime = currentTime * 0.001
        for (let i = 0; i < garmentsPhysicsList.length; i++) {
          const g = garmentsPhysicsList[i]
          if (!g || !g.group || !g.baseQuaternion) continue

          // Smooth physical swing around radial axis & centrifugal flare
          const qSwing = new THREE.Quaternion().setFromAxisAngle(g.radialDir, g.angle)
          const qFlare = new THREE.Quaternion().setFromAxisAngle(g.tangentDir, g.radialTilt)
          g.group.quaternion.copy(qSwing).multiply(qFlare).multiply(g.baseQuaternion)
          g.group.position.copy(g.basePosition)

          // Update GPU vertex shader uniforms
          if (g.clothParams) {
            // x: lag curvature bend, y: dynamic ripple fold amplitude, z: time, w: collision compression
            g.clothParams.value.set(
              g.angle * (g.isTee ? 0.25 : 0.15) + g.velocity * 0.08,
              Math.min(0.18, Math.abs(g.velocity) * (g.isTee ? 0.25 : 0.12) + 0.02),
              simTime,
              Math.min(0.25, g.compression * 0.04)
            )
          }
        }
      }

      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      container.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      className="relative w-full h-full flex items-center justify-center select-none"
      style={{ touchAction: 'none' }}
    >
      {loading && (
        <div className="absolute text-xs tracking-widest uppercase text-white/50 animate-pulse pointer-events-none">
          Loading Model...
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />
    </div>
  )
}
