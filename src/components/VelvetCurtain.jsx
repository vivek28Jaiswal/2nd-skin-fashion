import { useEffect, useRef, memo } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'

// Simplex 3D noise for cloth ripple and swaying folds
const SIMPLEX_NOISE = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  i = mod(i, 289.0 );
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}
`

const VELVET_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const VELVET_FRAGMENT_SHADER = `
varying vec2 vUv;
uniform float uProgress;
uniform float uReveal;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor;

${SIMPLEX_NOISE}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  // Position coordinates matching Codrops Interlude:
  // x goes from 0 to aspect, y goes from 0 (top) to 1 (bottom)
  float x = vUv.x * aspect;
  float y = 1.0 - vUv.y;

  // Exact velvet curtain physical parameters from Codrops Interlude
  float FOLDS = 10.0;
  float DEPTH = 0.50;
  float TRAIL = 0.30;
  float SWAY = 0.35;
  float SWAY_SPEED = 0.25;
  float SHEEN = 0.35;
  float SHADOW = 0.05;
  float DIM = 0.55;
  float PAD = SHADOW + 0.03;

  // The curtain's leading edge, from past the right of the screen to past its left.
  float travel = mix(aspect + PAD, -PAD, uProgress);
  float moving = sin(uProgress * 3.14159265);
  float way = mix(1.0, -1.0, uReveal);
  float trail = pow(clamp(y, 0.0, 1.0), 1.5) * TRAIL * moving * way;
  float ripple = snoise(vec3(y * 2.5, uTime * 0.4, 0.0)) * 0.008;
  float edge = travel + trail + ripple;
  float inside = x - edge; // how far into the curtain this pixel is

  // Dynamic folds that gather tight when bunched and widen when drawn
  float across = inside / max(aspect - edge, 0.05);
  float uneven = snoise(vec3(across * 4.0, y * 0.8, uTime * SWAY_SPEED)) * SWAY;
  float phase = (across + uneven / FOLDS) * (FOLDS * 3.14159265 * 2.0);

  #if defined(GL_OES_standard_derivatives) || __VERSION__ >= 300
    float phaseWidth = length(vec2(dFdx(phase), dFdy(phase)));
    float sharp = 1.0 - smoothstep(0.6, 1.6, phaseWidth);
    float insideWidth = length(vec2(dFdx(inside), dFdy(inside)));
  #else
    float sharp = 1.0;
    float insideWidth = 0.004;
  #endif

  // Light on the cloth with soft sheen
  float slope = (sin(phase) + sin(phase * 2.0 + 1.0) * 0.35) * DEPTH * sharp;
  vec3 normal = vec3(slope, 0.0, 1.0) / sqrt(slope * slope + 1.0);
  vec3 lightDir = normalize(vec3(-0.5, -0.3, 0.81));
  float lit = clamp(dot(normal, lightDir), 0.0, 1.0);
  float sheen = pow(1.0 - normal.z, 1.2) * SHEEN * (lit * 0.6 + 0.4);

  // Stage lighting gradient from top to hem
  float stage = mix(1.1, 0.7, y);
  float hem = mix(0.55, 1.0, smoothstep(0.0, 0.014, inside));
  vec3 body = mix(uColor * 0.2, uColor * 1.05, lit) * stage * hem;
  vec3 glow = mix(uColor, vec3(1.0, 0.85, 0.8), 0.35) * sheen;
  vec3 cloth = body + glow;

  // Antialiased edge coverage & shadow cast on the stage
  float delta = max(insideWidth, 0.002);
  float covered = smoothstep(-delta, delta, inside);
  float shadow = (1.0 - smoothstep(0.0, SHADOW, max(-inside, 0.0))) * 0.35;

  vec2 center = vec2(aspect * 0.5, 0.5);
  float distEdges = length(vec2(x, y) - center) / (aspect * 0.6);
  float dim = smoothstep(0.0, 1.0, uProgress) * DIM * mix(0.9, 1.1, clamp(distEdges, 0.0, 1.0));
  float dark = 1.0 - (1.0 - shadow) * (1.0 - dim);

  float alpha = clamp(covered + dark * (1.0 - covered), 0.0, 1.0);
  vec3 finalColor = mix(vec3(0.0), cloth, covered);

  gl_FragColor = vec4(finalColor, alpha);
}
`

function VelvetCurtain({
  color = '#ff4d1c',
  isActive = false,
  onCovered,
  onComplete,
}) {
  const containerRef = useRef(null)
  const materialRef = useRef(null)
  const hasTriggeredRef = useRef(false)
  const onCoveredRef = useRef(onCovered)
  const onCompleteRef = useRef(onComplete)
  const startRenderRef = useRef(null)
  const stopRenderRef = useRef(null)

  useEffect(() => {
    onCoveredRef.current = onCovered
    onCompleteRef.current = onComplete
  }, [onCovered, onComplete])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = window.innerWidth
    const height = window.innerHeight

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(width, height)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    container.appendChild(renderer.domElement)

    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.ShaderMaterial({
      vertexShader: VELVET_VERTEX_SHADER,
      fragmentShader: VELVET_FRAGMENT_SHADER,
      uniforms: {
        uProgress: { value: 0.0 },
        uReveal: { value: 0.0 },
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uColor: { value: new THREE.Color(color) },
      },
      transparent: true,
      extensions: {
        derivatives: true,
      },
    })
    materialRef.current = material

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // Pre-warm shader pipeline once to prevent first-frame hitches
    renderer.render(scene, camera)

    let animId = null
    let isRunning = false
    const startTime = performance.now()

    const startRender = () => {
      if (isRunning) return
      isRunning = true
      const loop = () => {
        if (!isRunning) return
        animId = requestAnimationFrame(loop)
        material.uniforms.uTime.value = (performance.now() - startTime) / 1000
        renderer.render(scene, camera)
      }
      loop()
    }

    const stopRender = () => {
      isRunning = false
      if (animId) {
        cancelAnimationFrame(animId)
        animId = null
      }
    }

    startRenderRef.current = startRender
    stopRenderRef.current = stopRender

    const handleResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      renderer.setSize(w, h)
      material.uniforms.uResolution.value.set(w, h)
      if (!isRunning) {
        renderer.render(scene, camera)
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      stopRender()
      startRenderRef.current = null
      stopRenderRef.current = null
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [color])

  // Trigger the 2-step curtain sweep when isActive becomes true
  useEffect(() => {
    if (!isActive || hasTriggeredRef.current || !materialRef.current) return
    hasTriggeredRef.current = true

    startRenderRef.current?.()
    const material = materialRef.current

    // Step 1: Draw the curtain in from the right across the screen
    gsap.to(material.uniforms.uProgress, {
      value: 1.0,
      duration: 1.15,
      ease: 'power2.inOut',
      onComplete: () => {
        // Screen is fully covered by the rich velvet cloth
        onCoveredRef.current?.()

        // Step 2: Draw the curtain back to reveal the 3D runway
        material.uniforms.uReveal.value = 1.0
        gsap.to(material.uniforms.uProgress, {
          value: 0.0,
          duration: 1.25,
          delay: 0.08,
          ease: 'power2.inOut',
          onComplete: () => {
            stopRenderRef.current?.()
            onCompleteRef.current?.()
          },
        })
      },
    })
  }, [isActive])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[60] pointer-events-none select-none overflow-hidden"
      style={{ touchAction: 'none' }}
    />
  )
}

export default memo(VelvetCurtain)
