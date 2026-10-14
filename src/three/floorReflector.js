import * as THREE from 'three'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'

/**
 * Custom glossy floor reflector with soft downward gradient falloff,
 * lateral edge masking, and depth-based roughness blur matching the reference image.
 */
export function createFloorReflector({
  floorY = -65.46,
  size = 380,
  intensity = 0.37,
} = {}) {
  const geometry = new THREE.PlaneGeometry(size, size, 1, 1)

  const customShader = {
    name: 'GlossyFloorReflectorShader',
    uniforms: {
      color: { value: new THREE.Color(0x000000) },
      tDiffuse: { value: null },
      textureMatrix: { value: new THREE.Matrix4() },
      uIntensity: { value: intensity },
      uRackCenter: { value: new THREE.Vector2(0, 0) },
      uRadiusX: { value: 82.0 },
      uFadeStart: { value: 10.0 },
      uFadeEnd: { value: 72.0 },
      uBackFade: { value: 36.0 },
    },
    vertexShader: /* glsl */ `
      uniform mat4 textureMatrix;
      varying vec4 vUv;
      varying vec3 vWorldPosition;

      #include <common>
      #include <logdepthbuf_pars_vertex>

      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        vUv = textureMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

        #include <logdepthbuf_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 color;
      uniform sampler2D tDiffuse;
      uniform float uIntensity;
      uniform vec2 uRackCenter;
      uniform float uRadiusX;
      uniform float uFadeStart;
      uniform float uFadeEnd;
      uniform float uBackFade;

      varying vec4 vUv;
      varying vec3 vWorldPosition;

      #include <logdepthbuf_pars_fragment>

      void main() {
        #include <logdepthbuf_fragment>

        float dx = abs(vWorldPosition.x - uRackCenter.x);
        float dz = vWorldPosition.z - uRackCenter.y;

        // Progressive glossy blur spread (near contact = sharp, lower on screen = soft dispersion)
        float blurFactor = clamp((dz - uFadeStart) / max(0.001, (uFadeEnd - uFadeStart)), 0.0, 1.0);
        float spread = mix(0.0004, 0.0024, blurFactor);

        // 5-tap sample for smooth glossy reflection
        vec4 base = texture2DProj(tDiffuse, vUv);
        vec4 s1 = texture2DProj(tDiffuse, vUv + vec4( spread,  spread, 0.0, 0.0));
        vec4 s2 = texture2DProj(tDiffuse, vUv + vec4(-spread,  spread, 0.0, 0.0));
        vec4 s3 = texture2DProj(tDiffuse, vUv + vec4( spread, -spread, 0.0, 0.0));
        vec4 s4 = texture2DProj(tDiffuse, vUv + vec4(-spread, -spread, 0.0, 0.0));
        vec4 reflColor = base * 0.44 + (s1 + s2 + s3 + s4) * 0.14;

        // Normalized lateral distance
        float nx = clamp(dx / uRadiusX, 0.0, 1.0);

        // Normalized depth distance
        float nz;
        if (dz >= uFadeStart) {
          nz = clamp((dz - uFadeStart) / max(0.001, (uFadeEnd - uFadeStart)), 0.0, 1.0);
        } else if (dz >= 0.0) {
          nz = 0.0;
        } else {
          nz = clamp((-dz) / uBackFade, 0.0, 1.0);
        }

        // 1. Vertical downward fade (closest to feet is 1.0, fades smoothly to 0.0 towards bottom)
        float verticalFade;
        if (dz >= 0.0) {
          verticalFade = 1.0 - smoothstep(0.0, 1.0, nz);
          verticalFade = pow(verticalFade, 1.45); // natural optical falloff curve
        } else {
          verticalFade = 1.0 - smoothstep(0.0, 1.0, nz);
        }

        // 2. Lateral fade (center is 1.0, smoothly fades towards left and right flanks)
        float lateralFade = 1.0 - smoothstep(0.55, 1.0, nx);

        // 3. Smooth radial envelope to avoid any harsh diagonal corners
        float r = sqrt(nx * nx + nz * nz);
        float radialFade = 1.0 - smoothstep(0.68, 1.12, r);

        float totalFade = verticalFade * lateralFade * radialFade * uIntensity;

        // Rich color preservation
        vec3 reflRgb = reflColor.rgb;
        reflRgb = pow(reflRgb, vec3(0.96)); // subtly lift rich midtones

        // Floor surface is pure pitch black (#000000)
        vec3 finalRgb = reflRgb * totalFade;

        gl_FragColor = vec4(finalRgb, 1.0);

        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  }

  const reflector = new Reflector(geometry, {
    clipBias: 0.005,
    textureWidth: 1024,
    textureHeight: 1024,
    color: 0x000000,
    multisample: 0,
    shader: customShader,
  })

  // Horizontal floor orientation facing +Y
  reflector.rotation.x = -Math.PI / 2
  reflector.position.set(0, floorY - 0.02, 0)
  reflector.material.depthWrite = false

  // Resource cleanup helper to avoid WebGL render target leaks
  const originalDispose = reflector.dispose ? reflector.dispose.bind(reflector) : null
  reflector.dispose = () => {
    if (originalDispose) originalDispose()
    geometry.dispose()
    if (reflector.material) reflector.material.dispose()
    const rt = reflector.getRenderTarget && reflector.getRenderTarget()
    if (rt) rt.dispose()
  }

  return reflector
}
