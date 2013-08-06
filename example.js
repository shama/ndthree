var ndarray = require('ndarray')
var fill = require('ndarray-fill')
var terrain = require('isabella-texture-pack')
var THREE = require('three')

var createND3 = require('./')

var width = window.innerWidth
var height = window.innerHeight
var container = document.body
var renderer = new THREE.WebGLRenderer()
renderer.setClearColor(0xBFD1E5, 1.0)
var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100000)
var scene = new THREE.Scene()
scene.add(camera)
camera.position.z = 860
renderer.setSize(width, height)

// create tiles from tilemap
var tiles = ndarray(terrain.data,
  [16,16,terrain.shape[0]>>4,terrain.shape[1]>>4,4],
  [terrain.stride[0]*16, terrain.stride[1]*16, terrain.stride[0], terrain.stride[1], terrain.stride[2]], 0)

var distance = 2
var nd3 = createND3({
  geometry: new THREE.BufferGeometry(),
  material: new THREE.ShaderMaterial(),
  distance: distance
})
var mesh = nd3.createMesh({
  THREE: THREE,
  map: tiles,
  //offset: [-16, -16, -16],
})
scene.add(mesh)

function create(pos) {
  var shape = [32, 32, 32]
  var voxels = ndarray(new Uint8Array(shape[0]*shape[1]*shape[2]), shape)
  
  var n = 0
  for (var x = 0; x < shape[0]; x++) {
    for (var y = 0; y < shape[1]; y++) {
      for (var z = 0; z < shape[2]; z++) {
        var tid = 0
        if (x > 1 && y > 1 && z > 1 && x < 30 && y < 30 && z < 30) tid = 1
        voxels.data[n++] = tid
      }
    }
  }

  /*fill(voxels, function(i,j,k) {
    //if (j > 0 && j < 32) return 1
    //return 0
    var x = Math.abs(i - (shape[0]/2))
    var y = Math.abs(j - (shape[1]/2))
    var z = Math.abs(k - (shape[2]/2))
    return (x*x+y*y+z*z) < 32 ? ((Math.random()*255)|0) + (1<<15) : 0
  })*/
  //voxels = voxels.transpose(2, 1, 0)
  nd3.chunk(pos, voxels)
}

for (var x = -4; x < 4; ++x) {
  for (var y = -4; y < 4; ++y) {
    for (var z = -4; z < 4; ++z) {
      create([x,y,z])
    }
  }
}

//create([0,0,1])
//create([0,0,2])

/*setInterval(function() {
  console.log('change!')
  create([0, 0, 0])
}, 2000)*/


/*
var meshes = []
function create(pos) {
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
  ndthree(voxels, geometry, material)

  var mesh = ndthree.createMesh({
    THREE: THREE,
    geometry: geometry,
    material: material,
    map: tiles,
    offset: [-16, -16, -16],
  })
  mesh.position.set(pos[0] * 32, pos[1] * 32, pos[2] * 32)
  scene.add(mesh)

  return mesh
}
meshes.push(create([0, 0, 0]))
*/

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
