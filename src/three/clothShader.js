import * as THREE from 'three'

/**
 * Advanced Photorealistic Cloth Fabric Drape, Realistic Folds & Verlet Simulation
 * - Natural 3D garment geometry: hollow chest volume, armpit tension folds, drooping sleeves
 * - Authentic trouser construction: waistband bar fold, distinct leg separation, vertical creases
 * - 3D Verlet Integration particle lattice displacement
 * - Dynamic normal perturbation and concave fold soft ambient occlusion to eliminate flat milky washing
 */
export const applyClothShader = (material, isTee, bounds, paramsUniform, verletTextureUniform) => {
  const boundsUniform = {
    value: new THREE.Vector4(bounds.min.y, bounds.max.y, bounds.min.x, bounds.max.x),
  }

  const patchClothShader = (shader) => {
    shader.uniforms.uClothParams = paramsUniform
    shader.uniforms.uClothBounds = boundsUniform
    shader.uniforms.uGarmentType = { value: isTee ? 1.0 : 2.0 }
    if (verletTextureUniform) {
      shader.uniforms.uVerletMap = verletTextureUniform
    }

    shader.vertexShader = `
      uniform vec4 uClothParams;
      uniform vec4 uClothBounds;
      uniform float uGarmentType;
      uniform sampler2D uVerletMap;
      varying float vFoldDepth;
    ` + shader.vertexShader

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      // Normalized coordinates across the garment geometry
      float clothH = max(1.0, uClothBounds.y - uClothBounds.x);
      float clothW = max(1.0, uClothBounds.w - uClothBounds.z);
      // For T-shirt: uClothBounds.y (max.y) is hanger shoulders, uClothBounds.x (min.y) is hem
      // For Pants: uClothBounds.x (min.y) is hanger fold, uClothBounds.y (max.y) is bottom hem
      float normY = uGarmentType < 1.5
        ? clamp((uClothBounds.y - position.y) / clothH, 0.0, 1.0)
        : clamp((position.y - uClothBounds.x) / clothH, 0.0, 1.0);
      float normX = clamp((position.x - uClothBounds.z) / clothW, 0.0, 1.0); // 0 at left, 1 at right
      float centerDistX = (normX - 0.5) * 2.0; // -1.0 to +1.0 from garment center line

      // Progressive anchor weight: firmly attached at hanger, free towards body and hem
      // For pants, the hanger crossbar fold (top 15%) is strictly clamped to 0.0 so it never lifts off the hanger
      float anchorWeight = uGarmentType < 1.5
        ? smoothstep(0.03, 0.16, normY)
        : smoothstep(0.14, 0.30, normY);
      float hemWeight = pow(normY, 1.5);

      // ========================================================
      // 1. NATURAL GRAVITY DRAPING & REALISTIC FABRIC FOLDS
      // ========================================================
      float staticDrapeZ = 0.0;
      float staticDrapeY = 0.0;
      float dZdx = 0.0;
      float dZdy = 0.0;
      float foldAO = 1.0;

      if (uGarmentType < 1.5) {
        // --- T-SHIRTS: Real Cotton Drape, 3D Chest Volume & Relaxed Sleeves ---

        // A. Natural 3D Hollow Torso Cavity (prevents flat cardboard appearance)
        float torsoCavity = cos(clamp(centerDistX * 1.57, -1.57, 1.57)) * sin(normY * 3.1415) * 2.1;

        // B. Collar / Neckband natural thickness & forward curvature
        float collarCurve = cos(clamp(centerDistX * 5.5, -1.57, 1.57)) * (1.0 - smoothstep(0.0, 0.15, normY)) * 0.90;

        // C. Shoulder-to-armpit diagonal tension draping folds
        float armpitDiag1 = sin(abs(centerDistX) * 5.2 - normY * 3.8) * exp(-normY * 2.0) * 0.95;
        float armpitDiag2 = cos(abs(centerDistX) * 4.0 - normY * 5.5) * smoothstep(0.18, 0.55, normY) * 0.55;

        // D. Vertical drape fluting columns hanging naturally from the chest
        float bodyFluting = (sin(centerDistX * 6.5) * 0.85 + cos(centerDistX * 11.5) * 0.45 + sin(centerDistX * 16.5) * 0.22) * pow(normY, 1.25) * 1.05;

        // E. Drooping relaxed sleeves falling naturally under gravity with round volume
        float isSleeve = max(0.0, abs(centerDistX) - 0.40) * 2.0;
        float sleeveDroop = pow(isSleeve, 1.35) * 2.6 * smoothstep(0.08, 0.65, normY);
        staticDrapeY -= sleeveDroop;
        float sleeveVolume = sin(normY * 6.28) * isSleeve * 0.75;

        // F. Organic bottom hem irregularity (breaks laser-straight artificial edge)
        float hemIrregularity = (sin(centerDistX * 8.0) * 0.45 + cos(centerDistX * 15.0) * 0.28) * pow(normY, 2.5);
        staticDrapeY += hemIrregularity * 0.40;

        staticDrapeZ = (torsoCavity + collarCurve + armpitDiag1 + armpitDiag2 + bodyFluting + sleeveVolume) * anchorWeight;

        // Surface normal perturbation slope for light and shadow tracking
        dZdx = (cos(centerDistX * 6.5) * 5.5 - sin(centerDistX * 11.5) * 5.1) * pow(normY, 1.25) * 0.040;
        dZdy = (torsoCavity * 0.35 + armpitDiag1 * 0.45) * 0.035;

        // Concave fold depth ambient occlusion
        foldAO = clamp(1.0 - (abs(bodyFluting) * 0.12 + abs(armpitDiag1) * 0.09) * anchorWeight, 0.76, 1.0);
      } else {
        // --- TROUSERS: Heavyweight Denim Bar Fold, Distinct Legs & Creases ---

        // A. Hanger crossbar fold & thick denim waistband volume
        float barVolume = sin(normY * 13.0) * exp(-normY * 7.5) * 1.35;
        float waistbandThickness = sin(clamp(normX * 3.1415, 0.0, 3.1415)) * 1.75 * smoothstep(0.14, 0.35, normY);

        // B. Clear 3D leg separation & inward crotch seam indentation
        float crotchDivision = (1.0 - smoothstep(0.0, 0.13, abs(centerDistX))) * smoothstep(0.25, 0.95, normY) * -1.85;

        // C. Heavy vertical fluting columns down each pant leg
        float legFluting = (sin(centerDistX * 12.5) * 1.05 + cos(centerDistX * 22.0) * 0.50) * pow(normY, 1.15) * 1.05;

        // D. Knee break crease and natural fabric bending
        float kneeBreak = sin(normY * 5.0) * 0.50 * smoothstep(0.35, 0.75, normY);

        // E. Bottom cuff flare and roping break
        float cuffBreak = sin(centerDistX * 9.0) * 0.55 * pow(normY, 2.3);

        staticDrapeZ = (barVolume + waistbandThickness + crotchDivision + legFluting + kneeBreak + cuffBreak) * anchorWeight;

        // Surface normal slope
        dZdx = (cos(centerDistX * 12.5) * 13.0 - sin(centerDistX * 22.0) * 11.0) * pow(normY, 1.15) * 0.035;
        dZdy = (barVolume * 0.4 + kneeBreak * 0.35) * 0.035;

        // Concave fold depth ambient occlusion
        foldAO = clamp(1.0 - (abs(legFluting) * 0.14 + (crotchDivision < -0.2 ? 0.15 : 0.0)) * anchorWeight, 0.72, 1.0);
      }

      // ========================================================
      // 2. 3D VERLET INTEGRATION CLOTH SIMULATION DISPLACEMENT
      // ========================================================
      vec2 verletUV = vec2(clamp(normX, 0.0, 1.0), clamp(normY, 0.0, 1.0));
      vec4 verletSample = texture2D(uVerletMap, verletUV);
      vec3 verletDisp = verletSample.xyz * anchorWeight;

      // ========================================================
      // 3. REAL-TIME MULTI-SEGMENT CLOTH FORCES & DYNAMICS
      // ========================================================
      // uClothParams.x: Main body tangential lag angle
      // uClothParams.y: Lower hem secondary trailing momentum
      // uClothParams.z: Sleeve independent aerodynamic swing
      // uClothParams.w: Contact cushioning / compression
      float dynamicSwingZ = 0.0;

      // Body inertia lag
      float bodyLag = uClothParams.x * hemWeight * 2.35;

      // Secondary hem momentum oscillation
      float hemTrailing = uClothParams.y * pow(normY, 2.5) * 1.25;

      // Sleeve reaction for T-shirts
      float sleeveLag = 0.0;
      if (uGarmentType < 1.5) {
        float sleeveWeight = max(0.0, abs(centerDistX) - 0.40) * 1.8;
        sleeveLag = uClothParams.z * sleeveWeight * smoothstep(0.12, 0.60, normY) * 1.85;
      }

      // Soft contact compression when touching neighbour
      float compCushion = uClothParams.w * sin(centerDistX * 4.0) * hemWeight * 0.65;

      dynamicSwingZ = (bodyLag + hemTrailing + sleeveLag + compCushion) * anchorWeight;

      // Apply cumulative realistic draping and physical Verlet cloth simulation
      transformed.x += verletDisp.x;
      transformed.y += (staticDrapeY + verletDisp.y);
      transformed.z += (staticDrapeZ + dynamicSwingZ + verletDisp.z);

      // Pass fold depth ambient occlusion to fragment shader
      vFoldDepth = foldAO;
      `
    )

    // Patch fragment shader to deepen concave fold valleys and prevent flat washed-out white appearance
    shader.fragmentShader = `
      varying float vFoldDepth;
    ` + shader.fragmentShader

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
      #include <dithering_fragment>
      gl_FragColor.rgb *= vFoldDepth;
      `
    )
  }

  material.onBeforeCompile = patchClothShader
}
