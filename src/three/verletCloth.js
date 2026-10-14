import * as THREE from 'three'

/**
 * 3D Verlet Integration Cloth Simulation Engine
 * Based on mass-spring particle grid with distance constraints, structural/shear/bending links,
 * top hanger pinning, real-time mouse interaction, rotational inertia, and GPU texture skinning.
 */

export class PointMass3D {
  constructor(x, y, z, pinned = false) {
    this.x = x
    this.y = y
    this.z = z
    this.lastX = x
    this.lastY = y
    this.lastZ = z
    this.origX = x
    this.origY = y
    this.origZ = z
    this.pinned = pinned
  }

  pin() {
    this.pinned = true
  }

  unpin() {
    this.pinned = false
  }

  update(dt, damping, grav, extForceX, extForceY, extForceZ, mouseHit, mouseDelta, mouseStrength, interactDist, allowMouse = true) {
    if (this.pinned) {
      this.x = this.origX
      this.y = this.origY
      this.z = this.origZ
      this.lastX = this.origX
      this.lastY = this.origY
      this.lastZ = this.origZ
      return
    }

    // Elastic spring restoring force towards original draped rest pose (prevents endless sagging/stretching)
    const restSpringK = 18.0
    const springFx = (this.origX - this.x) * restSpringK
    const springFy = (this.origY - this.y) * restSpringK
    const springFz = (this.origZ - this.z) * restSpringK

    // Interactive mouse tugging (matching user reference implementation)
    let dmx = 0
    let dmy = 0
    let dmz = 0
    if (allowMouse && mouseHit && mouseDelta) {
      const dx = this.x - mouseHit.x
      const dy = this.y - mouseHit.y
      const dz = this.z - mouseHit.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist < interactDist) {
        const falloff = Math.max(0, 1.0 - dist / interactDist)
        dmx = mouseDelta.x * falloff * (mouseStrength / 100.0)
        dmy = mouseDelta.y * falloff * (mouseStrength / 100.0)
        dmz = mouseDelta.z * falloff * (mouseStrength / 100.0)
      }
    }

    // Standard Verlet velocity integration with elastic spring restoration
    const vx = (this.x - this.lastX) * damping + (extForceX + springFx) * dt * dt + dmx
    const vy = (this.y - this.lastY) * damping + (grav + extForceY + springFy) * dt * dt + dmy
    const vz = (this.z - this.lastZ) * damping + (extForceZ + springFz) * dt * dt + dmz

    this.lastX = this.x
    this.lastY = this.y
    this.lastZ = this.z

    this.x += vx
    this.y += vy
    this.z += vz
  }
}

export class Link3D {
  constructor(pointA, pointB, stiffness = 1.0) {
    this.pointA = pointA
    this.pointB = pointB
    const dx = pointB.x - pointA.x
    const dy = pointB.y - pointA.y
    const dz = pointB.z - pointA.z
    this.restDist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    this.stiffness = stiffness
  }

  solve() {
    const dx = this.pointB.x - this.pointA.x
    const dy = this.pointB.y - this.pointA.y
    const dz = this.pointB.z - this.pointA.z
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    if (dist < 0.00001) return true

    // Distance constraint relaxation
    const diff = ((this.restDist - dist) / dist) * 0.5 * this.stiffness
    const transX = dx * diff
    const transY = dy * diff
    const transZ = dz * diff

    if (!this.pointA.pinned) {
      this.pointA.x -= transX
      this.pointA.y -= transY
      this.pointA.z -= transZ
    }
    if (!this.pointB.pinned) {
      this.pointB.x += transX
      this.pointB.y += transY
      this.pointB.z += transZ
    }
    return true
  }
}

export class VerletClothSystem {
  constructor(bounds, isTee = true, gridW = 8, gridH = 12) {
    this.bounds = bounds
    this.isTee = isTee
    this.gridW = gridW
    this.gridH = gridH
    this.points = []
    this.links = []

    // Fabric physical parameters
    this.damping = isTee ? 0.982 : 0.975 // Cotton light damping vs denim heavy damping
    this.gravity = 0.0                  // Garments are already naturally draped at rest; spring restoration maintains shape cleanly
    this.solves = 3                     // Number of constraint relaxation passes per frame
    this.interactDist = 18.0            // Mouse interaction distance
    this.mouseStrength = 22.0           // Mouse tugging force

    // Create displacement DataTexture for GPU vertex shader skinning
    this.textureData = new Float32Array(gridW * gridH * 4)
    this.displacementTexture = new THREE.DataTexture(
      this.textureData,
      gridW,
      gridH,
      THREE.RGBAFormat,
      THREE.FloatType
    )
    this.displacementTexture.minFilter = THREE.NearestFilter
    this.displacementTexture.magFilter = THREE.NearestFilter
    this.displacementTexture.wrapS = THREE.ClampToEdgeWrapping
    this.displacementTexture.wrapT = THREE.ClampToEdgeWrapping
    this.displacementTexture.needsUpdate = true

    this.isResting = false
    this.generateFabric()
  }

  generateFabric() {
    this.points = []
    this.links = []

    const minX = this.bounds.min.x
    const maxX = this.bounds.max.x
    const minY = this.bounds.min.y
    const maxY = this.bounds.max.y
    const width = maxX - minX
    const height = maxY - minY

    // 1. Generate particle lattice across garment bounds
    for (let y = 0; y < this.gridH; y++) {
      const v = y / (this.gridH - 1) // 0 at top hanger, 1 at bottom hem
      // For T-shirt: maxY is top shoulders, minY is bottom hem
      // For Pants: minY is top hanger fold, maxY is bottom hem
      const py = this.isTee ? (maxY - v * height) : (minY + v * height)

      for (let x = 0; x < this.gridW; x++) {
        const u = x / (this.gridW - 1) // 0 at left, 1 at right
        const px = minX + u * width
        const pz = 0

        const point = new PointMass3D(px, py, pz)

        // Top edge attached to hanger
        if (y === 0) {
          if (this.isTee) {
            // T-shirt shoulder hanger support: pin center shoulder region, allow sleeve ends to droop
            if (u >= 0.20 && u <= 0.80) {
              point.pin()
            }
          } else {
            // Trouser waistband / fold bar: pin across the bar
            point.pin()
          }
        } else if (!this.isTee && y === 1) {
          // Extra lock for pants hanger wire bar: pin row 1 as well to guarantee zero detachment
          point.pin()
        }

        this.points.push(point)
      }
    }

    // 2. Structural Links (horizontal and vertical neighbors)
    const structStiffness = this.isTee ? 0.92 : 0.98
    for (let y = 0; y < this.gridH; y++) {
      for (let x = 0; x < this.gridW; x++) {
        const idx = y * this.gridW + x
        if (x > 0) {
          this.links.push(new Link3D(this.points[idx], this.points[idx - 1], structStiffness))
        }
        if (y > 0) {
          this.links.push(new Link3D(this.points[idx], this.points[(y - 1) * this.gridW + x], structStiffness))
        }
      }
    }

    // 3. Shear Links (diagonal cross-bracing for shear elasticity)
    const shearStiffness = this.isTee ? 0.50 : 0.65
    for (let y = 1; y < this.gridH; y++) {
      for (let x = 1; x < this.gridW; x++) {
        const idx = y * this.gridW + x
        this.links.push(new Link3D(this.points[idx], this.points[(y - 1) * this.gridW + (x - 1)], shearStiffness))
        this.links.push(new Link3D(this.points[idx - 1], this.points[(y - 1) * this.gridW + x], shearStiffness))
      }
    }

    // 4. Bending Links (2-hop skip links for realistic fabric bending stiffness)
    const bendStiffness = this.isTee ? 0.28 : 0.42
    for (let y = 0; y < this.gridH; y++) {
      for (let x = 0; x < this.gridW; x++) {
        const idx = y * this.gridW + x
        if (x > 1) {
          this.links.push(new Link3D(this.points[idx], this.points[idx - 2], bendStiffness))
        }
        if (y > 1) {
          this.links.push(new Link3D(this.points[idx], this.points[(y - 2) * this.gridW + x], bendStiffness))
        }
      }
    }
  }

  update(dt, { carouselVelY = 0, carouselAccY = 0, mouseHit = null, mouseDelta = null, isRackMoving = false }) {
    // If stationary and settled, sleep the cloth simulation and avoid redundant GPU texture updates
    if (!isRackMoving && !mouseHit && Math.abs(carouselVelY) < 0.0001 && Math.abs(carouselAccY) < 0.0001) {
      if (this.isResting) {
        return
      }
    } else {
      this.isResting = false
    }

    // Tangential inertial force along local Z axis caused by rack rotation
    const rackInertiaZ = -(carouselAccY * 2.2 + carouselVelY * 5.5)

    // Aerodynamic air drag opposing motion
    const airDragFactor = this.isTee ? 0.08 : 0.04

    // 1. Particle mass update
    for (let y = 0; y < this.gridH; y++) {
      for (let x = 0; x < this.gridW; x++) {
        const i = y * this.gridW + x
        const p = this.points[i]
        if (p.pinned) continue

        // Air resistance
        const vz = p.z - p.lastZ
        const airDragZ = -vz * airDragFactor * 60.0

        // Disallow mouse tugging near top hanger fold for trousers (y <= 2)
        const allowMouse = this.isTee || y > 2

        p.update(
          dt,
          this.damping,
          this.gravity,
          0,                 // extForceX
          0,                 // extForceY
          rackInertiaZ + airDragZ, // extForceZ
          mouseHit,
          mouseDelta,
          this.mouseStrength,
          this.interactDist,
          allowMouse
        )
      }
    }

    // 2. Iterative constraint relaxation solving (SOLVES = 3)
    for (let iter = 0; iter < this.solves; iter++) {
      for (let i = 0; i < this.links.length; i++) {
        this.links[i].solve()
      }
    }

    // 3. Write displacement into DataTexture for GPU vertex shader
    const data = this.textureData
    let maxDisp = 0

    for (let y = 0; y < this.gridH; y++) {
      for (let x = 0; x < this.gridW; x++) {
        const idx = y * this.gridW + x
        const p = this.points[idx]
        const dx = p.x - p.origX
        const dy = p.y - p.origY
        const dz = p.z - p.origZ

        const pIdx = idx * 4
        data[pIdx + 0] = dx
        data[pIdx + 1] = dy
        data[pIdx + 2] = dz
        data[pIdx + 3] = 1.0

        const dMag = Math.abs(dx) + Math.abs(dy) + Math.abs(dz)
        if (dMag > maxDisp) maxDisp = dMag
      }
    }

    this.displacementTexture.needsUpdate = true

    // Settle to rest pose when carousel is still and oscillations are tiny
    if (!isRackMoving && !mouseHit && maxDisp < 0.015) {
      for (let i = 0; i < this.points.length; i++) {
        const p = this.points[i]
        if (!p.pinned) {
          p.x = p.origX
          p.y = p.origY
          p.z = p.origZ
          p.lastX = p.origX
          p.lastY = p.origY
          p.lastZ = p.origZ
        }
      }
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 0
        data[i + 1] = 0
        data[i + 2] = 0
        data[i + 3] = 1.0
      }
      this.displacementTexture.needsUpdate = true
      this.isResting = true
    }
  }

  dispose() {
    if (this.displacementTexture) {
      this.displacementTexture.dispose()
    }
  }
}
