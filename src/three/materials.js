import * as THREE from 'three'
import sassyImg from '../assets/imgs/sassy.png'
import blackTeeImg from '../assets/imgs/blacktshirt.png'
import blackHalfSleeveImg from '../assets/imgs-transparent/black-halfsleeve.png'
import blueTeeImg from '../assets/imgs/bluetshirt.png'

// Procedural micro-brushed metal texture for realistic real-world silver look
export const createBrushedTexture = () => {
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

// Realistic brushed silver material for rack and polished chrome for hangers
export const createRackMaterials = (brushedTexture) => {
  const rackSilverMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xa5aab0),
    metalness: 0.96,
    roughness: 0.20,
    roughnessMap: brushedTexture,
    clearcoat: 0.4,
    clearcoatRoughness: 0.15,
    envMapIntensity: 1.6,
  })

  const hangerSilverMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xbcc1c8),
    metalness: 0.98,
    roughness: 0.12,
    clearcoat: 0.6,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.8,
  })

  return { rackSilverMaterial, hangerSilverMaterial }
}

// Generate authentic cotton knit fabric normal map
const createCottonNormalMap = () => {
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
      const rib = Math.sin((x / size) * Math.PI * 120) * 0.5 + 0.5
      const loop = Math.cos((y / size) * Math.PI * 120) * 0.5 + 0.5
      const threadNoise = (Math.random() - 0.5) * 0.22
      height[y * size + x] = rib * 0.55 + loop * 0.25 + threadNoise
    }
  }

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

// Helper to generate Streetwear T-Shirt Canvas Textures with authentic graphics
const createTeeTexture = (imageSrc, baseR, baseG, baseB, mode) => {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')
  const tex = new THREE.CanvasTexture(canvas)
  tex.flipY = false
  tex.colorSpace = THREE.SRGBColorSpace

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
          const inGraphicRegion =
            normX >= 0.28 && normX <= 0.72 && normY >= 0.30 && normY <= 0.62
          if (inGraphicRegion && sA > 30 && brightness > 90) {
            const strength = Math.min(1.0, (brightness - 90) / 75)
            r = Math.round(r * (1 - strength) + 246 * strength)
            g = Math.round(g * (1 - strength) + 246 * strength)
            b = Math.round(b * (1 - strength) + 246 * strength)
          }
        } else if (mode === 'blackY3') {
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

  const imgData = ctx.createImageData(size, size)
  const d = imgData.data

  for (let y = 0; y < size; y++) {
    let vFade = 0
    if (y > 90 && y < 720) {
      vFade = Math.sin(((y - 90) / 630) * Math.PI)
    }

    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4

      const dLeft = Math.abs(x - 275) / 195
      const dRight = Math.abs(x - 750) / 195
      const legDist = Math.min(dLeft, dRight)
      const horizWash = Math.max(0, 1 - legDist * legDist)

      let whisker = 0
      if (y > 80 && y < 300) {
        const relX = Math.abs(x - 512)
        const relY = y - 80
        const angle = Math.atan2(relY, relX)
        whisker = Math.sin(angle * 13 + relX * 0.045) * 0.16
        whisker *= Math.max(0, 1 - Math.abs(y - 180) / 110)
      }

      const washIntensity = Math.min(1.0, Math.max(0, vFade * horizWash * 0.88 + whisker))

      const twill = Math.sin(((x * 1.4 + y) / size) * Math.PI * 250) * 8.0
      const weft = Math.cos((y / size) * Math.PI * 250) * 4.0
      const slubNoise = (Math.random() - 0.5) * 11

      let r = baseR * (1 - washIntensity) + fadeR * washIntensity + twill + slubNoise
      let g = baseG * (1 - washIntensity) + fadeG * washIntensity + twill * 0.8 + slubNoise * 0.8
      let b = baseB * (1 - washIntensity) + fadeB * washIntensity + twill * 0.6 + slubNoise * 0.6

      if (Math.abs(x - 512) < 24 && y > 160) {
        const shadow = 1 - (1 - Math.abs(x - 512) / 24) * 0.38
        r *= shadow
        g *= shadow
        b *= shadow
      }

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

  const drawStitchLine = (x1, y1, x2, y2, lineWidth = 1.8) => {
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x1, y1 + 1)
    ctx.lineTo(x2, y2 + 1)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)'
    ctx.lineWidth = lineWidth
    ctx.setLineDash([6, 3])
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = stitchColor
    ctx.lineWidth = lineWidth
    ctx.setLineDash([6, 3])
    ctx.stroke()
    ctx.restore()
  }

  drawStitchLine(32, 74, 32, 960)
  drawStitchLine(40, 74, 40, 960)
  drawStitchLine(984, 74, 984, 960)
  drawStitchLine(992, 74, 992, 960)

  drawStitchLine(506, 175, 506, 960)
  drawStitchLine(518, 175, 518, 960)

  drawStitchLine(20, 14, 1004, 14, 2.0)
  drawStitchLine(20, 64, 1004, 64, 2.0)

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

  drawStitchLine(770, 100, 865, 100, 1.8)
  drawStitchLine(770, 106, 865, 106, 1.8)

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

// Factory for all authentic cotton and denim clothing materials
export const createClothingMaterials = () => {
  const cottonNormalMap = createCottonNormalMap()
  const denimNormalMap = createDenimNormalMap()

  const orangeTeeTex = createTeeTexture(sassyImg, 198, 52, 4, 'orangeStussy')
  const blackStussyTex = createTeeTexture(blackTeeImg, 16, 17, 19, 'blackStussy')
  const blackY3Tex = createTeeTexture(blackHalfSleeveImg, 18, 19, 21, 'blackY3')
  const blueGraffitiTex = createTeeTexture(blueTeeImg, 24, 65, 173, 'blueGraffiti')

  const orangeTeeMaterial = new THREE.MeshStandardMaterial({
    map: orangeTeeTex,
    normalMap: cottonNormalMap,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughness: 0.96,
    metalness: 0.0,
    envMapIntensity: 0.06,
  })

  const blackStussyMaterial = new THREE.MeshStandardMaterial({
    map: blackStussyTex,
    normalMap: cottonNormalMap,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughness: 0.96,
    metalness: 0.0,
    envMapIntensity: 0.06,
  })

  const blackY3Material = new THREE.MeshStandardMaterial({
    map: blackY3Tex,
    normalMap: cottonNormalMap,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughness: 0.96,
    metalness: 0.0,
    envMapIntensity: 0.06,
  })

  const blueTeeMaterial = new THREE.MeshStandardMaterial({
    map: blueGraffitiTex,
    normalMap: cottonNormalMap,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughness: 0.96,
    metalness: 0.0,
    envMapIntensity: 0.06,
  })

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

  const jeans1Material = new THREE.MeshStandardMaterial({
    map: jeans1Tex,
    normalMap: denimNormalMap,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughness: 0.95,
    metalness: 0.0,
    envMapIntensity: 0.06,
  })

  const jeans2Material = new THREE.MeshStandardMaterial({
    map: jeans2Tex,
    normalMap: denimNormalMap,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughness: 0.95,
    metalness: 0.0,
    envMapIntensity: 0.06,
  })

  const jeans3Material = new THREE.MeshStandardMaterial({
    map: jeans3Tex,
    normalMap: denimNormalMap,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughness: 0.96,
    metalness: 0.0,
    envMapIntensity: 0.06,
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

  return { getTeeMaterial, getJeansMaterial }
}
