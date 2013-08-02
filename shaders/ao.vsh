// (c) 2013 Mikola Lysenko. MIT License
// https://github.com/mikolalysenko/ao-shader

attribute vec2 attrib0;

varying vec3  vNormal;
varying vec2  tileCoord;
varying vec2  texCoord;
varying float ambientOcclusion;

varying vec3 vColor;

void main() {
  //Compute ambient occlusion
  ambientOcclusion = attrib0.x / 255.0;
  
  //Compute vNormal
  vNormal = 128.0 - normal;
  
  //Compute texture coordinate
  texCoord = vec2(dot(position, vec3(vNormal.y-vNormal.z, 0, vNormal.x)),
                  dot(position, vec3(0, -abs(vNormal.x+vNormal.z), vNormal.y)));
  
  //Compute tile coordinate
  float tx    = attrib0.y / 16.0;
  tileCoord.x = floor(tx);
  tileCoord.y = fract(tx) * 16.0;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
