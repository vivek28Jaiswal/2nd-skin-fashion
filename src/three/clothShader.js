import * as THREE from 'three'

/**
 * Smooth natural cloth fabric drape vertex shader modifier
 * Simulates gentle inertial lag along tangential Z anchored at hanger top
 */
export const applyClothShader = (material, isTee, bounds, paramsUniform) => {
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

      // Smooth natural cloth fabric drape (anchored at hanger top, flexible towards lower hem)
      float bendWeight = pow(normY, 1.8);
      float lagDisp = uClothParams.x * bendWeight * 2.2;

      // Pure smooth cloth drape along tangential Z
      transformed.z += lagDisp;
      `
    )
  }

  material.onBeforeCompile = patchVertexShader
}
