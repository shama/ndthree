var extend = require('extend')
var createAOMesh = require('ao-mesher')
var tileMipMap = require('tile-mip-map')
var ndarray = require('ndarray')
var fs = require('fs')

var vsh = fs.readFileSync(__dirname + '/shaders/ao.vsh')
var fsh = fs.readFileSync(__dirname + '/shaders/ao.fsh')

module.exports = function(arr, geometry, material) {
  var data = createAOMesh(arr)
  if (data === null) return false

  extend(true, material, {
    uniforms: {
      tileSize: { type: 'f', value: 16.0 },
      tileMap: { type: 't', value: [] },
    },
    attributes: {
      attrib0: { type: 'v4', value: [] },
    },
    vertexShader: vsh,
    fragmentShader: fsh,
  })

  var triangles = 12 * arr.shape[0] * arr.shape[1] * arr.shape[2]
  geometry.attributes = {
    index: {
      itemSize: 1,
      array: new Uint16Array(triangles * 3)
    },
    position: {
      itemSize: 3,
      array: new Float32Array(triangles * 3 * 3)
    },
    normal: {
      itemSize: 3,
      array: new Float32Array(triangles * 3 * 3)
    },
    attrib0: {
      itemSize: 2,
      array: new Float32Array(triangles * 3 * 2)
    },
  }

  var chunkSize = Math.floor(Math.pow(2, 16) / 3)

  var indices = geometry.attributes.index.array
  for (var i = 0; i < indices.length; i++) {
    indices[i] = i % (3 * chunkSize)
  }

  var positions = geometry.attributes.position.array
  var normals = geometry.attributes.normal.array
  var attrib0s = geometry.attributes.attrib0.array

  var p3 = 0, p2 = 0
  for (var i = 0; i < data.length; i += 8) {
    var x = data[i + 0], y = data[i + 1], z = data[i + 2], ao = data[i + 3]
    var nx = data[i + 4], ny = data[i + 5], nz = data[i + 6], tid = data[i + 7]

    attrib0s[p2 + 0] = ao
    attrib0s[p2 + 1] = tid

    positions[p3 + 0] = x
    positions[p3 + 1] = y
    positions[p3 + 2] = z

    normals[p3 + 0] = nx
    normals[p3 + 1] = ny
    normals[p3 + 2] = nz

    p3 += 3
    p2 += 2
  }

  geometry.offsets = []
  var offsets = triangles / chunkSize
  for (var i = 0; i < offsets; i++) {
    var offset = {
      start: i * chunkSize * 3,
      index: i * chunkSize * 3,
      count: Math.min(triangles - (i * chunkSize), chunkSize) * 3
    };
    geometry.offsets.push(offset)
  }

  Object.keys(geometry.attributes).forEach(function(key) {
    geometry.attributes[key].needsUpdate = true
  })
}

function reshapeTileMap(tiles) {
  var s = tiles.shape
  return ndarray(tiles.data, [s[0]*s[2], s[1]*s[3], s[4]])
}

// Helper for creating a mesh, this part requires THREE
module.exports.createMesh = function(opts) {
  var THREE = opts.THREE
  var geometry = opts.geometry
  var material = opts.material
  var texture = opts.map || opts.texture || false
  var shape = opts.shape || [32, 32, 32]
  var pad = opts.pad !== false

  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()

  if (texture) {
    var pyramid = tileMipMap(texture, pad)
    texture = reshapeTileMap(pyramid[0])

    texture = new THREE.DataTexture(texture.data, texture.shape[1], texture.shape[0],
      THREE.RGBAFormat, THREE.UnsignedByteType, (new THREE.UVMapping()),
      THREE.RepeatWrapping, THREE.RepeatWrapping,
      THREE.NearestFilter, THREE.NearestFilter)
    texture.flipY = false
    texture.wrapS = 1000
    texture.wrapT = 1000

    // set mipmap levels
    for (var i = 1; i < pyramid.length; ++i) {
      var level = reshapeTileMap(pyramid[i])
      texture.mipmaps.push({
        data: level.data,
        width: level.shape[1],
        height: level.shape[0],
      })
    }

    texture.needsUpdate = true

    material.uniforms.tileMap.value = texture
    material.side = THREE.DoubleSide
    material.needsUpdate = true
  }

  var mesh = new THREE.Object3D()
  var inner = new THREE.Mesh(geometry, material)
  inner.position.set(-(shape[0]/2), -(shape[1]/2), -(shape[2]/2))
  mesh.add(inner)

  return mesh
}
