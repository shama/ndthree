var ndarray = require('ndarray')
var fill = require('ndarray-fill')
var terrain = require('isabella-texture-pack')
var THREE = require('three')

var ndthree = require('./')

var width = window.innerWidth
var height = window.innerHeight
var container = document.body
var renderer = new THREE.WebGLRenderer()
renderer.setClearColor(0xBFD1E5, 1.0)
var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100000)
var scene = new THREE.Scene()
scene.add(camera)
camera.position.z = 60
renderer.setSize(width, height)

//Create some random voxels in a sphere
var shape = [32, 32, 32]
var voxels = ndarray(new Uint16Array(shape[0]*shape[1]*shape[2]), shape)
fill(voxels, function(i,j,k) {
  var x = Math.abs(i - (shape[0]/2))
  var y = Math.abs(j - (shape[1]/2))
  var z = Math.abs(k - (shape[2]/2))
  return (x*x+y*y+z*z) < 190 ? ((Math.random()*255)|0) + (1<<15) : 0
})

// Create our buffer geometry and material
var geometry = new THREE.BufferGeometry()
var material = new THREE.ShaderMaterial()
ndthree(voxels, geometry, material)

var mesh = ndthree.createMesh({
  THREE: THREE,
  geometry: geometry,
  material: material,
  map: terrain,
  shape: shape,
})
scene.add(mesh)

var ambientLight = new THREE.AmbientLight(0xff0000)
scene.add(ambientLight)

//var directionalLight = new THREE.DirectionalLight(0xffffff, 200 )
//directionalLight.position.set(1, 1, 0.5).normalize()
//scene.add(directionalLight)

container.appendChild(renderer.domElement)
window.addEventListener('resize', onWindowResize, false)

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();
(function animate() {
  requestAnimFrame(animate)
  render()
}())

function render() {
  mesh.rotation.y += 0.01
  mesh.rotation.z += 0.01
  renderer.render(scene, camera)
}
