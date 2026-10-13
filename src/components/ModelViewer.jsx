import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { createBrushedTexture, createRackMaterials, createClothingMaterials } from '../three/materials.js'
import { applyClothShader } from '../three/clothShader.js'
import { VerletClothSystem } from '../three/verletCloth.js'

export default function ModelViewer({ targetAngle, onHoverGarment }) {
  const containerRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const targetAngleRef = useRef(null)
  const onHoverGarmentRef = useRef(onHoverGarment)

  useEffect(() => {
    onHoverGarmentRef.current = onHoverGarment
  }, [onHoverGarment])

  useEffect(() => {
    if (targetAngle !== undefined && targetAngle !== null) {
      targetAngleRef.current = targetAngle
    }
  }, [targetAngle])

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
    renderer.toneMappingExposure = 0.94
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    container.appendChild(renderer.domElement)

    // Studio Environment for realistic metallic silver reflections on rack
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    const roomEnv = new RoomEnvironment()
    const envTexture = pmremGenerator.fromScene(roomEnv).texture
    scene.environment = envTexture
    if ('environmentIntensity' in scene) {
      scene.environmentIntensity = 0.75
    }

    // Material factories
    const brushedTexture = createBrushedTexture()
    const { rackSilverMaterial, hangerSilverMaterial } = createRackMaterials(brushedTexture)
    const { getTeeMaterial, getJeansMaterial } = createClothingMaterials()

    // Soft, controlled studio lighting (deep fabric contrast, rich natural colors, no washed-out white haze)
    const ambientLight = new THREE.AmbientLight(0xfff6ea, 0.20)
    scene.add(ambientLight)

    const dirLight1 = new THREE.DirectionalLight(0xfff8f2, 1.12)
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
    dirLight1.shadow.bias = -0.00015
    dirLight1.shadow.normalBias = 0.018
    dirLight1.shadow.radius = 2.4
    scene.add(dirLight1)

    const dirLight2 = new THREE.DirectionalLight(0xe8f0ff, 0.38)
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
    dirLight2.shadow.bias = -0.00020
    dirLight2.shadow.normalBias = 0.02
    dirLight2.shadow.radius = 2.8
    scene.add(dirLight2)

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.25)
    rimLight.position.set(0, 16, -26)
    scene.add(rimLight)

    // Physics and interaction state
    let isDragging = false
    let dragMode = null
    let lastPointerX = 0
    let lastPointerY = 0
    let spinVelocity = 0
    let prevCarouselRotY = 0
    let prevCarouselVelocityY = 0
    let lastTime = performance.now()
    let currentHoveredGarment = null
    let activeMouseHit = null
    let activeMouseDelta = null
    let prevMouseHit = null
    let activeHitGarment = null

    const carouselGroup = new THREE.Group()
    carouselGroup.name = 'rotating_carousel'

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    const interactiveObjects = []
    const garmentsPhysicsList = []

    // Load Model
    const loader = new GLTFLoader()
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
              const id = `${name} ${parentName}`.toLowerCase()
              let label = 'lucky boxy-fit t-shirt'
              if (id.includes('052') || id.includes('048') || id.includes('044')) {
                label = 'lucky boxy-fit t-shirt'
              } else if (id.includes('051') || id.includes('047') || id.includes('043')) {
                label = 'stüssy black classic crew'
              } else if (id.includes('050') || id.includes('046') || id.includes('042')) {
                label = 'blue graffiti streetwear tee'
              } else {
                label = 'y-3 graphic half-sleeve'
              }
              child.userData.garmentName = label
              if (child.parent) child.parent.userData.garmentName = label
            } else if (isJeans) {
              child.material = getJeansMaterial(name, parentName).clone()
              const id = `${name} ${parentName}`.toLowerCase()
              let label = 'vintage wide-leg baggy denim'
              if (id.includes('020') || id.includes('023') || id.includes('026')) {
                label = 'vintage wide-leg baggy denim'
              } else if (id.includes('021') || id.includes('024') || id.includes('027')) {
                label = 'medium indigo stone-wash denim'
              } else {
                label = 'washed charcoal black denim'
              }
              child.userData.garmentName = label
              if (child.parent) child.parent.userData.garmentName = label
            } else {
              child.material = child.material.clone()
              child.material.metalness = 0.0
              child.material.roughness = 0.92
              child.material.envMapIntensity = 0.0
              child.material.color = new THREE.Color(0x222428)
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

        itemsToMove.forEach((child) => {
          carouselGroup.attach(child)
        })

        // Setup physical compound pendulum and cloth physics for each garment
        itemsToMove.forEach((child) => {
          const name = (child.name || '').toLowerCase()
          if (!name.startsWith('group0')) return

          const basePosition = child.position.clone()
          const baseQuaternion = child.quaternion.clone()

          const radialDir = new THREE.Vector3(basePosition.x, 0, basePosition.z).normalize()
          const tangentDir = new THREE.Vector3(-radialDir.z, 0, radialDir.x).normalize()
          let angleOnRing = Math.atan2(basePosition.z, basePosition.x)
          if (angleOnRing < 0) angleOnRing += Math.PI * 2
          const radius = Math.sqrt(basePosition.x * basePosition.x + basePosition.z * basePosition.z)

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

          let clothBounds = null
          clothMeshes.forEach((cm) => {
            cm.geometry.computeBoundingBox()
            if (!clothBounds) clothBounds = cm.geometry.boundingBox.clone()
            else clothBounds.union(cm.geometry.boundingBox)
          })
          const safeBounds = clothBounds || new THREE.Box3(new THREE.Vector3(-15, -40, -15), new THREE.Vector3(15, 40, 15))
          const verletCloth = new VerletClothSystem(safeBounds, isShirt, 8, 12)
          const verletUniform = { value: verletCloth.displacementTexture }

          const paramsUniform = { value: new THREE.Vector4(0, 0, 0, 0) }
          clothMeshes.forEach((cm) => {
            applyClothShader(cm.material, isShirt, safeBounds, paramsUniform, verletUniform)
          })

          garmentsPhysicsList.push({
            name: child.name,
            group: child,
            clothMeshes: clothMeshes,
            basePosition: basePosition,
            baseQuaternion: baseQuaternion,
            radialDir: radialDir,
            tangentDir: tangentDir,
            angleOnRing: angleOnRing,
            radius: radius,
            isTee: isShirt,
            // Multi-segment physics properties
            mass: isShirt ? 0.28 : 0.72,       // Cotton vs Heavy denim
            airDrag: isShirt ? 2.2 : 1.25,     // Aerodynamic air drag
            angle: 0.0,                        // Main body lag angle
            velocity: 0.0,
            hemAngle: 0.0,                     // Secondary hem momentum angle
            hemVel: 0.0,
            sleeveAngle: 0.0,                  // Sleeve independent flutter angle
            sleeveVel: 0.0,
            radialTilt: 0.0,                   // Centrifugal flare
            compression: 0.0,                  // Neighbour contact compression
            clothParams: paramsUniform,
            verletCloth: verletCloth,
          })
        })

        // Sort garments circularly around the rack
        garmentsPhysicsList.sort((a, b) => a.angleOnRing - b.angleOnRing)

        // Find interactive objects for raycasting
        carouselGroup.traverse((child) => {
          if (child.isMesh) {
            interactiveObjects.push(child)
          }
        })

        // Set camera position and target
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

      dragMode = hits.length > 0 ? 'carousel' : 'carousel'
      isDragging = true
      lastPointerX = e.clientX
      lastPointerY = e.clientY
      spinVelocity = 0
      container.style.cursor = 'grabbing'
    }

    const onPointerMove = (e) => {
      updateMouseCoords(e)

      if (isDragging) {
        if (e.buttons === 0) {
          isDragging = false
          dragMode = null
          return
        }
        const deltaX = e.clientX - lastPointerX
        lastPointerX = e.clientX
        lastPointerY = e.clientY

        const speed = 0.007
        carouselGroup.rotation.y += deltaX * speed
        spinVelocity = deltaX * speed
      } else {
        // Hover state detection, front garment raycasting & Verlet cloth mouse interaction
        raycaster.setFromCamera(mouse, camera)
        const hits = raycaster.intersectObjects(interactiveObjects, true)
        let foundGarment = null
        activeMouseHit = null
        activeMouseDelta = null
        activeHitGarment = null

        if (hits.length > 0) {
          for (let h = 0; h < Math.min(3, hits.length); h++) {
            const hit = hits[h]
            if (hit.point.z > -10) {
              const obj = hit.object
              const name = obj.userData?.garmentName || obj.parent?.userData?.garmentName
              if (name) {
                foundGarment = name
                activeHitGarment = obj

                // Compute local coordinates on garment for Verlet point mass tugging
                const localPoint = obj.worldToLocal(hit.point.clone())
                if (prevMouseHit) {
                  activeMouseDelta = localPoint.clone().sub(prevMouseHit)
                } else {
                  activeMouseDelta = new THREE.Vector3(0, 0, 0)
                }
                activeMouseHit = localPoint
                prevMouseHit = localPoint.clone()
                break
              }
            }
          }
        }

        if (!foundGarment) {
          prevMouseHit = null
        }

        if (foundGarment !== currentHoveredGarment) {
          currentHoveredGarment = foundGarment
          container.style.cursor = foundGarment ? 'pointer' : (hits.length > 0 ? 'grab' : 'default')
          if (onHoverGarmentRef.current) {
            onHoverGarmentRef.current(foundGarment)
          }
        } else if (!foundGarment) {
          container.style.cursor = hits.length > 0 ? 'grab' : 'default'
        }
      }
    }

    const onPointerUp = () => {
      isDragging = false
      dragMode = null
      prevMouseHit = null
      activeMouseHit = null
      activeMouseDelta = null
      activeHitGarment = null

      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(interactiveObjects, true)
      container.style.cursor = hits.length > 0 ? 'grab' : 'default'
    }

    const onPointerLeave = () => {
      prevMouseHit = null
      activeMouseHit = null
      activeMouseDelta = null
      activeHitGarment = null
      if (currentHoveredGarment !== null) {
        currentHoveredGarment = null
        if (onHoverGarmentRef.current) {
          onHoverGarmentRef.current(null)
        }
      }
    }

    // Touch & Mouse listeners on container and window
    container.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    container.addEventListener('pointerleave', onPointerLeave)

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

    // Physics-driven render loop (Smooth fabric inertia & settled rest state)
    let animationFrameId
    let targetSpringVelocity = 0
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      const currentTime = performance.now()
      const dt = Math.min((currentTime - lastTime) / 1000, 0.04)
      lastTime = currentTime

      // Target alignment from ProductDialer or rotational inertia
      if (!isDragging) {
        if (targetAngleRef.current !== null) {
          const diff = targetAngleRef.current - carouselGroup.rotation.y
          const wrappedDiff = Math.atan2(Math.sin(diff), Math.cos(diff))

          const springK = 38.0
          const springDamp = 0.91
          targetSpringVelocity = (targetSpringVelocity + wrappedDiff * springK * dt) * springDamp
          carouselGroup.rotation.y += targetSpringVelocity * dt
          spinVelocity = 0

          if (Math.abs(wrappedDiff) < 0.002 && Math.abs(targetSpringVelocity) < 0.015) {
            carouselGroup.rotation.y += wrappedDiff
            targetAngleRef.current = null
            targetSpringVelocity = 0
            spinVelocity = 0
          }
        } else if (Math.abs(spinVelocity) > 0.00015) {
          carouselGroup.rotation.y += spinVelocity
          spinVelocity *= 0.88
        } else {
          spinVelocity = 0
        }
      } else {
        targetAngleRef.current = null
        targetSpringVelocity = 0
      }

      // Compute carousel rotational acceleration and velocity
      const currentCarouselRotY = carouselGroup.rotation.y
      const rawCarouselVelY = (currentCarouselRotY - prevCarouselRotY) / Math.max(0.0001, dt)
      const carouselVelY = Math.max(-12.0, Math.min(12.0, rawCarouselVelY))
      const rawCarouselAccY = (carouselVelY - prevCarouselVelocityY) / Math.max(0.0001, dt)
      const carouselAccY = Math.max(-18.0, Math.min(18.0, rawCarouselAccY))
      prevCarouselRotY = currentCarouselRotY
      prevCarouselVelocityY = carouselVelY

      // Multi-segment physics & cloth simulation (aerodynamic drag, inertia, bending constraints, collisions)
      if (garmentsPhysicsList.length > 0) {
        const isRackMoving = Math.abs(carouselVelY) > 0.0001 || Math.abs(carouselAccY) > 0.001
        const substeps = 2
        const subDt = dt / substeps

        for (let step = 0; step < substeps; step++) {
          for (let i = 0; i < garmentsPhysicsList.length; i++) {
            const g = garmentsPhysicsList[i]
            if (!g || !g.group) continue

            // 1. Tangential rotational inertia from circular rack acceleration and angular velocity
            const inertialForce = -(carouselAccY * 0.038 + carouselVelY * 0.17)

            if (isRackMoving) {
              // Main body pendulum dynamics
              const bodyGravity = -22.0 * Math.sin(g.angle)
              const vRel = g.velocity + carouselVelY * 0.14
              const bodyAirDrag = -0.5 * g.airDrag * vRel * Math.abs(vRel) - g.velocity * 5.5
              const bodyAcc = (bodyGravity + bodyAirDrag) / g.mass + inertialForce * (1.0 / g.mass)
              g.velocity += bodyAcc * subDt
              g.velocity *= Math.pow(0.965, subDt * 60)
              g.angle += g.velocity * subDt
              g.angle = Math.max(-0.46, Math.min(0.46, g.angle))

              // Secondary trailing hem momentum (coupled through fabric bending constraint)
              const hemBend = (g.angle - g.hemAngle) * (g.isTee ? 38.0 : 48.0)
              const hemGravity = -24.0 * Math.sin(g.hemAngle)
              const hemAirDrag = -1.5 * (g.hemVel + carouselVelY * 0.16)
              const hemAcc = (hemBend + hemGravity + hemAirDrag) / (g.mass * 0.70) + inertialForce * 1.35
              g.hemVel += hemAcc * subDt
              g.hemVel *= Math.pow(0.955, subDt * 60)
              g.hemAngle += g.hemVel * subDt
              g.hemAngle = Math.max(-0.62, Math.min(0.62, g.hemAngle))

              // Sleeve independent flutter reaction (T-shirts)
              if (g.isTee) {
                const flutter = Math.sin(currentTime * 0.02 + i * 1.8) * Math.abs(carouselVelY) * 0.035
                const sleeveBend = (g.angle - g.sleeveAngle) * 52.0
                const sleeveGravity = -26.0 * Math.sin(g.sleeveAngle)
                const sleeveAcc = (sleeveBend + sleeveGravity) / 0.20 + inertialForce * 1.5 + flutter * 24.0
                g.sleeveVel += sleeveAcc * subDt
                g.sleeveVel *= Math.pow(0.945, subDt * 60)
                g.sleeveAngle += g.sleeveVel * subDt
              }

              // Centrifugal radial flare under spinning
              const targetFlare = Math.min(0.12, carouselVelY * carouselVelY * 0.0035)
              g.radialTilt += (targetFlare - g.radialTilt) * Math.min(1.0, subDt * 8.0)
            } else {
              // Natural harmonic settling when rack has stopped (physical decay, zero jitter)
              if (Math.abs(g.angle) > 0.0006 || Math.abs(g.velocity) > 0.001 || Math.abs(g.hemAngle) > 0.0006) {
                // Free damped pendulum decay
                const bodyGravity = -26.0 * Math.sin(g.angle)
                const bodyDamp = -g.velocity * 8.0
                g.velocity += (bodyGravity + bodyDamp) / g.mass * subDt
                g.angle += g.velocity * subDt

                const hemBend = (g.angle - g.hemAngle) * 42.0
                const hemGravity = -28.0 * Math.sin(g.hemAngle)
                const hemDamp = -g.hemVel * 9.0
                g.hemVel += (hemBend + hemGravity + hemDamp) / (g.mass * 0.70) * subDt
                g.hemAngle += g.hemVel * subDt

                if (g.isTee) {
                  const sleeveBend = (g.angle - g.sleeveAngle) * 56.0
                  const sleeveDamp = -g.sleeveVel * 10.0
                  g.sleeveVel += (sleeveBend + sleeveDamp) / 0.20 * subDt
                  g.sleeveAngle += g.sleeveVel * subDt
                }

                g.radialTilt *= 0.90
              } else {
                // Settle completely rock-solid into perfect physical gravity rest pose
                g.angle = 0
                g.velocity = 0
                g.hemAngle = 0
                g.hemVel = 0
                g.sleeveAngle = 0
                g.sleeveVel = 0
                g.radialTilt = 0
                g.compression = 0
              }
            }
          }

          // 2. Garment-to-Garment Proximity & Soft Collision Detection along circular rack
          const N = garmentsPhysicsList.length
          for (let i = 0; i < N; i++) {
            const gCurr = garmentsPhysicsList[i]
            const gNext = garmentsPhysicsList[(i + 1) % N]

            let gap = gNext.angleOnRing - gCurr.angleOnRing
            if (gap < 0) gap += Math.PI * 2
            const restDist = gap * gCurr.radius
            const dynamicDist = restDist + (gNext.angle - gCurr.angle) * 15.0
            const minClearance = gCurr.isTee && gNext.isTee ? 3.6 : 4.8

            if (dynamicDist < minClearance) {
              const penetration = minClearance - dynamicDist
              const repelForce = penetration * 42.0
              gCurr.velocity -= (repelForce / gCurr.mass) * subDt
              gNext.velocity += (repelForce / gNext.mass) * subDt
              const comp = Math.min(1.0, penetration / minClearance)
              gCurr.compression = Math.max(gCurr.compression, comp)
              gNext.compression = Math.max(gNext.compression, comp)
            } else {
              gCurr.compression *= 0.88
            }
          }
        }

        // Apply updated orientation and pass multi-segment parameters to GPU vertex shader
        for (let i = 0; i < garmentsPhysicsList.length; i++) {
          const g = garmentsPhysicsList[i]
          if (!g || !g.group || !g.baseQuaternion) continue

          if (Math.abs(g.angle) > 0.0001 || Math.abs(g.radialTilt) > 0.0001) {
            const qSwing = new THREE.Quaternion().setFromAxisAngle(g.radialDir, g.angle)
            const qFlare = new THREE.Quaternion().setFromAxisAngle(g.tangentDir, g.radialTilt)
            g.group.quaternion.copy(qSwing).multiply(qFlare).multiply(g.baseQuaternion)
          } else {
            g.group.quaternion.copy(g.baseQuaternion)
          }
          g.group.position.copy(g.basePosition)

          if (g.clothParams) {
            g.clothParams.value.set(
              g.angle,
              g.hemAngle - g.angle,
              g.sleeveAngle - g.angle,
              g.compression
            )
          }

          // 3. Update 3D Verlet Integration Cloth Particle Lattice
          if (g.verletCloth) {
            const isTarget = Boolean(
              activeHitGarment && (
                g.group === activeHitGarment ||
                g.clothMeshes?.includes(activeHitGarment) ||
                g.group === activeHitGarment.parent
              )
            )
            g.verletCloth.update(dt, {
              carouselVelY,
              carouselAccY,
              mouseHit: isTarget ? activeMouseHit : null,
              mouseDelta: isTarget ? activeMouseDelta : null,
              isRackMoving,
            })
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
      container.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
      garmentsPhysicsList.forEach((g) => {
        if (g.verletCloth) g.verletCloth.dispose()
      })
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
