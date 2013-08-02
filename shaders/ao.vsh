// (c) 2013 Mikola Lysenko. MIT License
// https://github.com/mikolalysenko/ao-shader

attribute vec4 attrib0;
attribute vec4 attrib1;

varying vec3  vNormal;
varying vec2  tileCoord;
varying vec2  texCoord;
varying float ambientOcclusion;

varying vec3 vColor;

void main() {
  #ifdef USE_COLOR
    vColor = color;
  #endif

  //Compute position
  vec3 pos = attrib0.xyz;
  
  //Compute ambient occlusion
  ambientOcclusion = attrib0.w / 255.0;
  
  //Compute vNormal
  vNormal = 128.0 - attrib1.xyz;
  
  //Compute texture coordinate
  texCoord = vec2(dot(pos, vec3(vNormal.y-vNormal.z, 0, vNormal.x)),
                  dot(pos, vec3(0, -abs(vNormal.x+vNormal.z), vNormal.y)));
  
  //Compute tile coordinate
  float tx    = attrib1.w / 16.0;
  tileCoord.x = floor(tx);
  tileCoord.y = fract(tx) * 16.0;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
