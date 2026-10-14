import * as THREE from 'three'
import sassyImg from '../assets/imgs/sassy.png'
import blackTeeImg from '../assets/imgs/blacktshirt.png'
import blackHalfSleeveImg from '../assets/imgs-transparent/black-halfsleeve.png'
import blueTeeImg from '../assets/imgs/bluetshirt.png'

// Helper to configure maximum texture sharpness, anisotropic filtering and mipmapping
const configureHighQualityTexture = (tex) => {
  tex.anisotropy = 16
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  return tex
}

// Cached procedural textures and materials to avoid redundant recomputations
let cachedBrushedTexture = null
let cachedCottonNormalMap = null
let cachedDenimNormalMap = null
let cachedFabricRoughnessMap = null
let cachedClothingMaterials = null
let cachedRackMaterials = null

// Procedural micro-brushed metal texture for realistic real-world silver rack
export const createBrushedTexture = () => {
  if (cachedBrushedTexture) return cachedBrushedTexture

  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, 1024, 1024)

  // Batch random scratch paths by shade to eliminate 7,000 individual canvas stroke calls
  ctx.lineWidth = 1.2

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)'
  ctx.beginPath()
  for (let i = 0; i < 3500; i++) {
    const y = Math.random() * 1024
    const len = 40 + Math.random() * 200
    const x = Math.random() * 1024
    ctx.moveTo(x, y)
    ctx.lineTo(x + len, y)
  }
  ctx.stroke()

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.045)'
  ctx.beginPath()
  for (let i = 0; i < 3500; i++) {
    const y = Math.random() * 1024
    const len = 40 + Math.random() * 200
    const x = Math.random() * 1024
    ctx.moveTo(x, y)
    ctx.lineTo(x + len, y)
  }
  ctx.stroke()

  const tex = new THREE.CanvasTexture(canvas)
  tex.repeat.set(4, 4)
  cachedBrushedTexture = configureHighQualityTexture(tex)
  return cachedBrushedTexture
}

// Realistic brushed silver material for rack and polished chrome for wire hangers
export const createRackMaterials = (brushedTexture) => {
  if (cachedRackMaterials) return cachedRackMaterials

  const rackSilverMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xa8adb4),
    metalness: 0.96,
    roughness: 0.18,
    roughnessMap: brushedTexture,
    clearcoat: 0.45,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.5,
  })

  const hangerSilverMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xc0c5cc),
    metalness: 0.98,
    roughness: 0.10,
    clearcoat: 0.65,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.8,
  })

  cachedRackMaterials = { rackSilverMaterial, hangerSilverMaterial }
  return cachedRackMaterials
}

// Subtle fine cotton jersey knit fabric normal map (natural textile micro-weave, no harsh bumpiness)
const createCottonNormalMap = () => {
  if (cachedCottonNormalMap) return cachedCottonNormalMap

  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const imgData = ctx.createImageData(size, size)
  const u32 = new Uint32Array(imgData.data.buffer)

  const height = new Float32Array(size * size)
  const ribTable = new Float32Array(size)
  const loopTable = new Float32Array(size)
  for (let i = 0; i < size; i++) {
    ribTable[i] = (Math.sin((i / size) * Math.PI * 260) * 0.5 + 0.5) * 0.55
    loopTable[i] = (Math.cos((i / size) * Math.PI * 260) * 0.5 + 0.5) * 0.35
  }

  for (let y = 0; y < size; y++) {
    const loopVal = loopTable[y]
    const row = y * size
    for (let x = 0; x < size; x++) {
      const threadNoise = (Math.random() - 0.5) * 0.12
      height[row + x] = ribTable[x] + loopVal + threadNoise
    }
  }

  for (let y = 0; y < size; y++) {
    const row = y * size
    const ym = ((y - 1 + size) % size) * size
    const yp = ((y + 1) % size) * size
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size
      const xp = (x + 1) % size

      const dx = (height[row + xp] - height[row + xm]) * 1.6
      const dy = (height[yp + x] - height[ym + x]) * 1.6

      const len = Math.sqrt(dx * dx + dy * dy + 1.0)
      const nx = Math.round(((-dx / len) * 0.5 + 0.5) * 255)
      const ny = Math.round(((-dy / len) * 0.5 + 0.5) * 255)
      const nz = Math.round(((1.0 / len) * 0.5 + 0.5) * 255)

      u32[row + x] = 0xFF000000 | (nz << 16) | (ny << 8) | nx
    }
  }

  ctx.putImageData(imgData, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.repeat.set(14, 14)
  cachedCottonNormalMap = configureHighQualityTexture(tex)
  return cachedCottonNormalMap
}

// Authentic denim 3x3 twill diagonal weave normal map
const createDenimNormalMap = () => {
  if (cachedDenimNormalMap) return cachedDenimNormalMap

  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const imgData = ctx.createImageData(size, size)
  const u32 = new Uint32Array(imgData.data.buffer)

  const height = new Float32Array(size * size)
  const warpTable = new Float32Array(size)
  const weftTable = new Float32Array(size)
  for (let i = 0; i < size; i++) {
    warpTable[i] = (Math.cos((i / size) * Math.PI * 260) * 0.22 + 0.5) * 0.24
    weftTable[i] = (Math.sin((i / size) * Math.PI * 260) * 0.18 + 0.5) * 0.18
  }
  const diagTable = new Float32Array(size * 2)
  for (let i = 0; i < size * 2; i++) {
    diagTable[i] = (Math.sin((i / size) * Math.PI * 340) * 0.5 + 0.5) * 0.58
  }

  for (let y = 0; y < size; y++) {
    const weftVal = weftTable[y]
    const row = y * size
    for (let x = 0; x < size; x++) {
      const slub = (Math.random() - 0.5) * 0.15
      height[row + x] = diagTable[x + y] + warpTable[x] + weftVal + slub
    }
  }

  for (let y = 0; y < size; y++) {
    const row = y * size
    const ym = ((y - 1 + size) % size) * size
    const yp = ((y + 1) % size) * size
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size
      const xp = (x + 1) % size

      const dx = (height[row + xp] - height[row + xm]) * 1.8
      const dy = (height[yp + x] - height[ym + x]) * 1.8

      const len = Math.sqrt(dx * dx + dy * dy + 1.0)
      const nx = Math.round(((-dx / len) * 0.5 + 0.5) * 255)
      const ny = Math.round(((-dy / len) * 0.5 + 0.5) * 255)
      const nz = Math.round(((1.0 / len) * 0.5 + 0.5) * 255)

      u32[row + x] = 0xFF000000 | (nz << 16) | (ny << 8) | nx
    }
  }

  ctx.putImageData(imgData, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.repeat.set(12, 12)
  cachedDenimNormalMap = configureHighQualityTexture(tex)
  return cachedDenimNormalMap
}

// Micro-textile roughness variation map (soft matte cotton, eliminates plastic reflections)
const createFabricRoughnessMap = () => {
  if (cachedFabricRoughnessMap) return cachedFabricRoughnessMap

  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const imgData = ctx.createImageData(size, size)
  const u32 = new Uint32Array(imgData.data.buffer)
  const len = size * size

  for (let i = 0; i < len; i++) {
    const val = 222 + Math.round((Math.random() - 0.5) * 28) // 0.86 to 0.96 roughness
    u32[i] = 0xFF000000 | (val << 16) | (val << 8) | val
  }

  ctx.putImageData(imgData, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(8, 8)
  cachedFabricRoughnessMap = configureHighQualityTexture(tex)
  return cachedFabricRoughnessMap
}

// High-Resolution 2048x2048 Streetwear T-Shirt Texture Generator
const createHighResTeeTexture = (imageSrc, baseR, baseG, baseB, mode) => {
  const size = 2048
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  const tex = new THREE.CanvasTexture(canvas)
  tex.flipY = false
  tex.colorSpace = THREE.SRGBColorSpace
  configureHighQualityTexture(tex)

  // 1. Base Cotton Fabric with Soft Heather Slub Threading (optimized Uint32Array + LUT)
  const renderBaseFabric = () => {
    const imgData = ctx.createImageData(size, size)
    const u32 = new Uint32Array(imgData.data.buffer)
    const len = size * size

    const slubLUT = new Uint32Array(256)
    for (let s = 0; s < 256; s++) {
      const slub = ((s / 255) - 0.5) * 6
      const r = Math.min(255, Math.max(0, Math.round(baseR + slub)))
      const g = Math.min(255, Math.max(0, Math.round(baseG + slub * 0.35)))
      const b = Math.min(255, Math.max(0, Math.round(baseB + slub * 0.2)))
      slubLUT[s] = 0xFF000000 | (b << 16) | (g << 8) | r
    }

    for (let i = 0; i < len; i++) {
      u32[i] = slubLUT[(Math.random() * 256) | 0]
    }
    ctx.putImageData(imgData, 0, 0)

    // 2. Realistic Clothing Construction: Double-needle Bottom Hem & Sleeve Stitches
    const drawStitchLine = (x1, y1, x2, y2, color, shadowColor, width = 2.4) => {
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(x1, y1 + 1.2)
      ctx.lineTo(x2, y2 + 1.2)
      ctx.strokeStyle = shadowColor
      ctx.lineWidth = width
      ctx.setLineDash([8, 4])
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.setLineDash([8, 4])
      ctx.stroke()
      ctx.restore()
    }

    const seamColor = `rgba(${Math.max(0, baseR - 16)}, ${Math.max(0, baseG - 16)}, ${Math.max(0, baseB - 16)}, 0.80)`
    const shadowColor = 'rgba(0, 0, 0, 0.40)'

    // Double-needle bottom hem stitching
    drawStitchLine(120, 1980, 1928, 1980, seamColor, shadowColor, 2.6)
    drawStitchLine(120, 1996, 1928, 1996, seamColor, shadowColor, 2.6)

    // Sleeve edge double stitching
    drawStitchLine(60, 1100, 320, 1100, seamColor, shadowColor, 2.2)
    drawStitchLine(60, 1114, 320, 1114, seamColor, shadowColor, 2.2)
    drawStitchLine(1728, 1100, 1988, 1100, seamColor, shadowColor, 2.2)
    drawStitchLine(1728, 1114, 1988, 1114, seamColor, shadowColor, 2.2)

    tex.needsUpdate = true
  }

  renderBaseFabric()

  // 3. Load & Composite Printed Graphic Artwork at 2048 Resolution
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const temp = document.createElement('canvas')
    temp.width = size
    temp.height = size
    const tctx = temp.getContext('2d')
    tctx.imageSmoothingEnabled = true
    tctx.imageSmoothingQuality = 'high'
    tctx.drawImage(img, 0, 0, size, size)
    const srcData = tctx.getImageData(0, 0, size, size).data

    // Determine target region to process to avoid scanning millions of untouched pixels
    let startY = 0, endY = size, startX = 0, endX = size
    if (mode === 'blackStussy') {
      startX = Math.floor(0.26 * size)
      endX = Math.ceil(0.74 * size)
      startY = Math.floor(0.28 * size)
      endY = Math.ceil(0.64 * size)
    } else if (mode === 'blackY3') {
      startX = Math.floor(0.25 * size)
      endX = Math.ceil(0.75 * size)
      startY = Math.floor(0.26 * size)
      endY = Math.ceil(0.78 * size)
    } else if (mode === 'blueGraffiti') {
      startX = Math.floor(0.18 * size)
      endX = Math.ceil(0.82 * size)
      startY = Math.floor(0.54 * size)
      endY = Math.ceil(0.90 * size)
    }

    const rw = endX - startX
    const rh = endY - startY
    const outImgData = ctx.getImageData(startX, startY, rw, rh)
    const out = outImgData.data

    for (let y = startY; y < endY; y++) {
      const rowOffsetSrc = y * size
      const rowOffsetDst = (y - startY) * rw
      const normY = y / size

      for (let x = startX; x < endX; x++) {
        const srcIdx = (rowOffsetSrc + x) * 4
        const sA = srcData[srcIdx + 3]
        if (sA <= 25) continue

        const dstIdx = (rowOffsetDst + (x - startX)) * 4
        const sR = srcData[srcIdx]
        const sG = srcData[srcIdx + 1]
        const sB = srcData[srcIdx + 2]
        const brightness = sR * 0.299 + sG * 0.587 + sB * 0.114
        const normX = x / size

        let printR = out[dstIdx]
        let printG = out[dstIdx + 1]
        let printB = out[dstIdx + 2]

        if (mode === 'orangeStussy') {
          if (brightness < 135) {
            const inkAlpha = Math.min(1.0, (135 - brightness) / 70)
            const inkNoise = (Math.random() - 0.5) * 4
            printR = Math.round(printR * (1 - inkAlpha) + (12 + inkNoise) * inkAlpha)
            printG = Math.round(printG * (1 - inkAlpha) + (12 + inkNoise) * inkAlpha)
            printB = Math.round(printB * (1 - inkAlpha) + (12 + inkNoise) * inkAlpha)
          }
        } else if (mode === 'blackStussy') {
          if (brightness > 80) {
            const inkAlpha = Math.min(1.0, (brightness - 80) / 65)
            const inkNoise = (Math.random() - 0.5) * 4
            printR = Math.round(printR * (1 - inkAlpha) + (232 + inkNoise) * inkAlpha)
            printG = Math.round(printG * (1 - inkAlpha) + (230 + inkNoise) * inkAlpha)
            printB = Math.round(printB * (1 - inkAlpha) + (226 + inkNoise) * inkAlpha)
          }
        } else if (mode === 'blackY3') {
          if (brightness > 75) {
            const inkAlpha = Math.min(1.0, (brightness - 75) / 65)
            const printLuma = Math.min(232, brightness * 1.05)
            printR = Math.round(printR * (1 - inkAlpha) + printLuma * inkAlpha)
            printG = Math.round(printG * (1 - inkAlpha) + (printLuma * 0.99) * inkAlpha)
            printB = Math.round(printB * (1 - inkAlpha) + (printLuma * 0.97) * inkAlpha)
          }
        } else if (mode === 'blueGraffiti') {
          if (sR > 120 && sG > 110 && sB < 120) {
            const inkAlpha = Math.min(1.0, (sR + sG - sB * 2) / 180)
            printR = Math.round(printR * (1 - inkAlpha) + 248 * inkAlpha)
            printG = Math.round(printG * (1 - inkAlpha) + 208 * inkAlpha)
            printB = Math.round(printB * (1 - inkAlpha) + 16 * inkAlpha)
          }
        }

        out[dstIdx] = printR
        out[dstIdx + 1] = printG
        out[dstIdx + 2] = printB
      }
    }

    ctx.putImageData(outImgData, startX, startY)
    tex.needsUpdate = true
  }
  img.src = imageSrc
  return tex
}

// High-Resolution 2048x2048 Designer Denim Texture Generator (rich, authentic washes; no washed-out white legs)
const createHighResJeansTexture = ({
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
  const size = 2048
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  const tex = new THREE.CanvasTexture(canvas)
  tex.flipY = false
  tex.colorSpace = THREE.SRGBColorSpace
  configureHighQualityTexture(tex)

  // 1. High-Density Denim Slub Twill with Controlled Natural Stone Wash (optimized Uint32Array + LUT)
  const imgData = ctx.createImageData(size, size)
  const u32 = new Uint32Array(imgData.data.buffer)

  const twillLUT = new Float32Array(2048)
  for (let k = 0; k < 2048; k++) {
    twillLUT[k] = Math.sin((k / 2048) * Math.PI * 2) * 3.5
  }
  const noiseLUT = new Float32Array(256)
  for (let k = 0; k < 256; k++) {
    noiseLUT[k] = (Math.random() - 0.5) * 5.0
  }

  const diffR = fadeR - baseR
  const diffG = fadeG - baseG
  const diffB = fadeB - baseB

  for (let y = 0; y < size; y++) {
    const isWaistband = y >= 138 && y <= 154
    const isUpperLap = y > 220 && y < 520
    const yWeight = isUpperLap ? Math.max(0, 1 - Math.abs(y - 360) / 160) * 0.15 : 0
    const relY = y - 220
    const rowOffset = y * size
    const checkCrotch = y > 280

    for (let x = 0; x < size; x++) {
      const phase = (((x * 1.4 + y) * 240 / size) % 1)
      const lutIdx = (phase < 0 ? (phase + 1) * 2048 : phase * 2048) | 0
      const twill = twillLUT[lutIdx & 2047]
      const slubNoise = noiseLUT[(Math.random() * 256) | 0]

      let microCrease = 0
      if (isUpperLap) {
        const relX = Math.abs(x - 1024)
        const angle = Math.atan2(relY, relX)
        microCrease = Math.max(0, Math.sin(angle * 10 + relX * 0.02) * yWeight)
      }

      let r = baseR + diffR * microCrease + twill + slubNoise
      let g = baseG + diffG * microCrease + twill * 0.8 + slubNoise * 0.8
      let b = baseB + diffB * microCrease + twill * 0.6 + slubNoise * 0.6

      if (checkCrotch) {
        const distFromCenter = Math.abs(x - 1024)
        if (distFromCenter < 56) {
          const shadow = 1 - (1 - distFromCenter / 56) * 0.40
          r *= shadow
          g *= shadow
          b *= shadow
        }
      }

      if (isWaistband) {
        r *= 0.70
        g *= 0.70
        b *= 0.70
      }

      const clampR = r < 0 ? 0 : r > 255 ? 255 : (r + 0.5) | 0
      const clampG = g < 0 ? 0 : g > 255 ? 255 : (g + 0.5) | 0
      const clampB = b < 0 ? 0 : b > 255 ? 255 : (b + 0.5) | 0

      u32[rowOffset + x] = 0xFF000000 | (clampB << 16) | (clampG << 8) | clampR
    }
  }

  ctx.putImageData(imgData, 0, 0)

  // 2. Vector Stitches, Pockets, Rivets, Leather Patch & Metal Hardware at 2048 Res
  const drawStitchLine = (x1, y1, x2, y2, lineWidth = 2.8) => {
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x1, y1 + 1.5)
    ctx.lineTo(x2, y2 + 1.5)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)'
    ctx.lineWidth = lineWidth
    ctx.setLineDash([7, 4])
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = stitchColor
    ctx.lineWidth = lineWidth
    ctx.setLineDash([7, 4])
    ctx.stroke()
    ctx.restore()
  }

  // Double-stitch waistband
  drawStitchLine(40, 52, 2008, 52, 3.2)
  drawStitchLine(40, 138, 2008, 138, 3.2)

  // Double-stitch center fly seam
  drawStitchLine(1024, 140, 1024, 760, 3.0)
  drawStitchLine(1036, 140, 1036, 760, 3.0)
  ctx.save()
  ctx.beginPath()
  ctx.arc(1024, 760, 68, 0, Math.PI * 0.5)
  ctx.strokeStyle = stitchColor
  ctx.lineWidth = 3.0
  ctx.setLineDash([7, 4])
  ctx.stroke()
  ctx.restore()

  // Genuine Leather Jacron Brand Patch at Back Right Waistband
  ctx.save()
  ctx.fillStyle = leatherPatchColor
  ctx.fillRect(1660, 48, 300, 84)
  ctx.strokeStyle = '#221508'
  ctx.lineWidth = 2.0
  ctx.strokeRect(1660, 48, 300, 84)
  ctx.strokeStyle = stitchColor
  ctx.lineWidth = 2.2
  ctx.setLineDash([6, 3])
  ctx.strokeRect(1664, 52, 292, 76)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.font = 'bold 24px sans-serif'
  ctx.fillText('2ND SKIN DENIM CO.', 1700, 86)
  ctx.font = '14px sans-serif'
  ctx.fillText('LOT 001 · BAGGY FIT · 14.5 OZ', 1680, 112)
  ctx.restore()

  // Front Curved Pockets
  const drawCurvedPocket = (isLeft) => {
    ctx.save()
    const sx = isLeft ? 140 : 1908
    const ex = isLeft ? 640 : 1408
    ctx.beginPath()
    ctx.moveTo(sx, 140)
    ctx.quadraticCurveTo(isLeft ? 380 : 1668, 440, ex, 140)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.40)'
    ctx.lineWidth = 3.0
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(sx, 140)
    ctx.quadraticCurveTo(isLeft ? 380 : 1668, 440, ex, 140)
    ctx.strokeStyle = stitchColor
    ctx.lineWidth = 3.0
    ctx.setLineDash([7, 4])
    ctx.stroke()
    ctx.restore()
  }
  drawCurvedPocket(true)
  drawCurvedPocket(false)

  // Coin Pocket
  drawStitchLine(1540, 200, 1730, 200, 2.6)
  drawStitchLine(1540, 212, 1730, 212, 2.6)

  // Antique Metal Hardware (Copper / Brass Rivets, no blown-out white)
  const drawRivet = (rx, ry) => {
    ctx.save()
    const grad = ctx.createRadialGradient(rx - 2, ry - 2, 1, rx, ry, 9)
    grad.addColorStop(0, '#e8c078')
    grad.addColorStop(0.5, rivetColor)
    grad.addColorStop(1, '#1e1a14')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(rx, ry, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
    ctx.beginPath()
    ctx.arc(rx, ry, 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  drawRivet(180, 148)
  drawRivet(72, 456)
  drawRivet(1868, 148)
  drawRivet(1976, 456)
  drawRivet(1540, 204)
  drawRivet(1730, 204)

  // Center Waistband Embossed Metal Shank Button
  ctx.save()
  const bx = 1024
  const by = 76
  const bGrad = ctx.createRadialGradient(bx - 3, by - 3, 2, bx, by, 22)
  bGrad.addColorStop(0, '#f0d890')
  bGrad.addColorStop(0.45, buttonColor)
  bGrad.addColorStop(1, '#181614')
  ctx.fillStyle = bGrad
  ctx.beginPath()
  ctx.arc(bx, by, 22, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)'
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.arc(bx, by, 15, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
  ctx.beginPath()
  ctx.arc(bx, by, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Baggy Carpenter Utility Loop on Left Leg
  ctx.save()
  ctx.fillStyle = `rgb(${Math.max(0, baseR - 12)}, ${Math.max(0, baseG - 12)}, ${Math.max(0, baseB - 12)})`
  ctx.fillRect(84, 860, 84, 28)
  ctx.strokeStyle = stitchColor
  ctx.lineWidth = 2.0
  ctx.setLineDash([6, 3])
  ctx.strokeRect(84, 860, 84, 28)
  ctx.restore()

  // Bottom Cuffs with Chain Stitching & Roping Effect
  ctx.save()
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'
  ctx.fillRect(40, 1920, 1968, 128)
  drawStitchLine(40, 1928, 2008, 1928, 3.2)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)'
  ctx.lineWidth = 2.8
  ctx.setLineDash([7, 4])
  ctx.beginPath()
  ctx.moveTo(40, 2038)
  ctx.lineTo(2008, 2038)
  ctx.stroke()
  ctx.restore()

  tex.needsUpdate = true
  return tex
}

// Master Factory for Authentic PBR Cotton & Denim Materials
export const createClothingMaterials = () => {
  if (cachedClothingMaterials) return cachedClothingMaterials

  const cottonNormalMap = createCottonNormalMap()
  const denimNormalMap = createDenimNormalMap()
  const fabricRoughnessMap = createFabricRoughnessMap()

  // 1. Streetwear T-Shirt High-Res Textures (Calibrated deep, natural fabric dyes)
  const orangeTeeTex = createHighResTeeTexture(sassyImg, 196, 58, 6, 'orangeStussy')
  const blackStussyTex = createHighResTeeTexture(blackTeeImg, 16, 17, 19, 'blackStussy')
  const blackY3Tex = createHighResTeeTexture(blackHalfSleeveImg, 13, 14, 16, 'blackY3')
  const blueGraffitiTex = createHighResTeeTexture(blueTeeImg, 14, 46, 130, 'blueGraffiti')

  // Physically accurate Cotton Knit PBR Materials (pure matte diffuse, zero plastic sheen, zero milky white haze)
  const orangeTeeMaterial = new THREE.MeshStandardMaterial({
    map: orangeTeeTex,
    normalMap: cottonNormalMap,
    normalScale: new THREE.Vector2(0.24, 0.24),
    roughnessMap: fabricRoughnessMap,
    roughness: 0.88,
    metalness: 0.0,
    envMapIntensity: 0.0,
  })

  const blackStussyMaterial = new THREE.MeshStandardMaterial({
    map: blackStussyTex,
    normalMap: cottonNormalMap,
    normalScale: new THREE.Vector2(0.24, 0.24),
    roughnessMap: fabricRoughnessMap,
    roughness: 0.88,
    metalness: 0.0,
    envMapIntensity: 0.0,
  })

  const blackY3Material = new THREE.MeshStandardMaterial({
    map: blackY3Tex,
    normalMap: cottonNormalMap,
    normalScale: new THREE.Vector2(0.24, 0.24),
    roughnessMap: fabricRoughnessMap,
    roughness: 0.88,
    metalness: 0.0,
    envMapIntensity: 0.0,
  })

  const blueTeeMaterial = new THREE.MeshStandardMaterial({
    map: blueGraffitiTex,
    normalMap: cottonNormalMap,
    normalScale: new THREE.Vector2(0.24, 0.24),
    roughnessMap: fabricRoughnessMap,
    roughness: 0.88,
    metalness: 0.0,
    envMapIntensity: 0.0,
  })

  // 2. High-Res Designer Denim Textures (Natural indigo & selvedge dyes)
  const jeans1Tex = createHighResJeansTexture({
    baseR: 16,
    baseG: 26,
    baseB: 48,
    fadeR: 24,
    fadeG: 38,
    fadeB: 64,
    stitchColor: '#c48624',
    rivetColor: '#b48232',
    buttonColor: '#c49c2c',
    leatherPatchColor: '#583216',
  })

  const jeans2Tex = createHighResJeansTexture({
    baseR: 24,
    baseG: 44,
    baseB: 76,
    fadeR: 36,
    fadeG: 58,
    fadeB: 94,
    stitchColor: '#ac9056',
    rivetColor: '#969aa2',
    buttonColor: '#a2a7b0',
    leatherPatchColor: '#684022',
  })

  const jeans3Tex = createHighResJeansTexture({
    baseR: 18,
    baseG: 19,
    baseB: 21,
    fadeR: 26,
    fadeG: 27,
    fadeB: 30,
    stitchColor: '#6a6e78',
    rivetColor: '#545860',
    buttonColor: '#666a72',
    leatherPatchColor: '#201e1c',
  })

  // Physically accurate Denim Twill PBR Materials (tactile diagonal grain, matte textile)
  const jeans1Material = new THREE.MeshStandardMaterial({
    map: jeans1Tex,
    normalMap: denimNormalMap,
    normalScale: new THREE.Vector2(0.28, 0.28),
    roughnessMap: fabricRoughnessMap,
    roughness: 0.86,
    metalness: 0.0,
    envMapIntensity: 0.0,
  })

  const jeans2Material = new THREE.MeshStandardMaterial({
    map: jeans2Tex,
    normalMap: denimNormalMap,
    normalScale: new THREE.Vector2(0.28, 0.28),
    roughnessMap: fabricRoughnessMap,
    roughness: 0.86,
    metalness: 0.0,
    envMapIntensity: 0.0,
  })

  const jeans3Material = new THREE.MeshStandardMaterial({
    map: jeans3Tex,
    normalMap: denimNormalMap,
    normalScale: new THREE.Vector2(0.28, 0.28),
    roughnessMap: fabricRoughnessMap,
    roughness: 0.88,
    metalness: 0.0,
    envMapIntensity: 0.0,
  })

  const getTeeMaterial = (name, parentName) => {
    const id = `${name} ${parentName}`.toLowerCase()
    if (id.includes('052') || id.includes('048') || id.includes('044')) return orangeTeeMaterial
    if (id.includes('051') || id.includes('047') || id.includes('043')) return blackStussyMaterial
    if (id.includes('050') || id.includes('046') || id.includes('042')) return blueTeeMaterial
    return blackY3Material
  }

  const getJeansMaterial = (name, parentName) => {
    const id = `${name} ${parentName}`.toLowerCase()
    if (id.includes('020') || id.includes('023') || id.includes('026')) return jeans1Material
    if (id.includes('021') || id.includes('024') || id.includes('027')) return jeans2Material
    return jeans3Material
  }

  cachedClothingMaterials = { getTeeMaterial, getJeansMaterial }
  return cachedClothingMaterials
}
