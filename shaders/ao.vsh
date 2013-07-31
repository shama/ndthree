attribute vec4 attrib0;
attribute vec4 attrib1;
attribute vec3 color;

varying vec3  vNormal;
varying vec2  tileCoord;
varying vec2  texCoord;
varying float ambientOcclusion;

varying vec2 vUV;
varying vec3 vColor;

void main() {
  //Compute position
  //vec3 pos = attrib0.xyz;

  vUV = uv;
  vColor = color;
  
  //Compute ambient occlusion
  ambientOcclusion = attrib0.w / 255.0;
  
  //Compute vNormal
  vNormal = 128.0 - attrib1.xyz;
  
  //Compute texture coordinate
  texCoord = vec2(dot(position, vec3(vNormal.y-vNormal.z, 0, vNormal.x)),
                  dot(position, vec3(0, -abs(vNormal.x+vNormal.z), vNormal.y)));
  
  //Compute tile coordinate
  float tx    = attrib1.w / 16.0;
  tileCoord.x = floor(tx);
  tileCoord.y = fract(tx) * 16.0;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
