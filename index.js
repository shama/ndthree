var extend = require('extend')
var createAOMesh = require('ao-mesher')
var tileMipMap = require('tile-mip-map')
var ndarray = require('ndarray')
var fs = require('fs')

var vsh = fs.readFileSync(__dirname + '/shaders/ao.vsh')
var fsh = fs.readFileSync(__dirname + '/shaders/ao.fsh')

function ND3(opts) {
  opts = opts || {}
  this.chunkShape = opts.chunkShape || [32, 32, 32]
  var triangles = opts.size || 12 * 32 * 32 * 32
  this.geometry = opts.geometry || {}
  this.material = opts.material || {}
  this._p3 = 0
  this._p2 = 0

  this.geometry.attributes = {
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
  this.geometry.dynamic = true

  this.material.uniforms = {
    tileSize: { type: 'f', value: 16.0 },
    tileMap: { type: 't', value: [] },
  }
  this.material.attributes = {
    position: { type: 'v3', value: null },
    normal: { type: 'v3', value: null },
    attrib0: { type: 'v2', value: null },
  }
  this.material.vertexShader = vsh
  this.material.fragmentShader = fsh

  var chunkSize = Math.floor(Math.pow(2, 16) / 3)
  var indices = this.geometry.attributes.index.array
  for (var i = 0; i < indices.length; i++) {
    indices[i] = i % (3 * chunkSize)
  }

  this.geometry.offsets = []
  var offsets = triangles / chunkSize
  for (var i = 0; i < offsets; i++) {
    var offset = {
      start: i * chunkSize * 3,
      index: i * chunkSize * 3,
      count: Math.min(triangles - (i * chunkSize), chunkSize) * 3
    };
    this.geometry.offsets.push(offset)
  }
}
module.exports = function(geometry, material) {
  return new ND3(geometry, material)
}
module.exports.ND3 = ND3

ND3.prototype.chunk = function(pos, arr) {
  var self = this
  var data = createAOMesh(arr)
  if (data === null) return

  var positions = this.geometry.attributes.position.array
  var normals = this.geometry.attributes.normal.array
  var attrib0s = this.geometry.attributes.attrib0.array

  var dist = 0
  var offset = [this.chunkShape[0] * pos[0], this.chunkShape[1] * pos[1], this.chunkShape[2] * pos[2]]

  for (var i = 0; i < data.length; i += 8) {
    var x = data[i + 0], y = data[i + 1], z = data[i + 2], ao = data[i + 3]
    var nx = data[i + 4], ny = data[i + 5], nz = data[i + 6], tid = data[i + 7]

    attrib0s[this._p2 + 0] = ao
    attrib0s[this._p2 + 1] = tid

    positions[this._p3 + 0] = x + offset[0]
    positions[this._p3 + 1] = y + offset[1]
    positions[this._p3 + 2] = z + offset[2]

    normals[this._p3 + 0] = nx
    normals[this._p3 + 1] = ny
    normals[this._p3 + 2] = nz

    if (this._p3 > positions.length) this._p3 = 0
    else this._p3 += 3

    if (this._p2 > attrib0s.length) this._p2 = 0
    else this._p2 += 2
  }

  Object.keys(this.geometry.attributes).forEach(function(key) {
    self.geometry.attributes[key].needsUpdate = true
  })
}

ND3.prototype.generate = function(lo, hi, fn) {
  lo[0]--
  lo[1]--
  lo[2]--
  hi[0]++
  hi[1]++
  hi[2]++
  var dims = [hi[0]-lo[0], hi[1]-lo[1], hi[2]-lo[2]]
  var data = ndarray(new Uint16Array(dims[0] * dims[1] * dims[2]), dims)
  for (var n = 0, k = lo[2]; k < hi[2]; k++)
    for (var j = lo[1]; j < hi[1]; j++)
      for(var i = lo[0]; i < hi[0]; i++, n++)
        data.data[n] = fn(i, j, k, n)
  return data
}

ND3.prototype.bounds = function(pos) {
  var x = pos[0]
  var y = pos[1]
  var z = pos[2]
  var bits = 0
  for (var size = 32; size > 0; size >>= 1) bits++
  bits--
  var low = [x << bits, y << bits, z << bits]
  var high = [(x+1) << bits, (y+1) << bits, (z+1) << bits]
  return [low, high]
}

function reshapeTileMap(tiles) {
  var s = tiles.shape
  return ndarray(tiles.data, [s[0]*s[2], s[1]*s[3], s[4]])
}

// Helper for creating a mesh, this part requires THREE
ND3.prototype.createMesh = function(opts) {
  var THREE = opts.THREE
  var geometry = opts.geometry || this.geometry
  var material = opts.material || this.material
  var texture = opts.map || opts.texture || false
  var offset = opts.offset || [1, 1, 1]
  var pad = opts.pad !== false

  this.geometry.computeBoundingSphere()
  this.geometry.boundingSphere.radius = 999999

  if (texture) {
    var pyramid = tileMipMap(texture, pad)
    var map1 = reshapeTileMap(pyramid[0])

    var map = new THREE.DataTexture(map1.data, map1.shape[1], map1.shape[0],
      THREE.RGBAFormat, THREE.UnsignedByteType, (new THREE.UVMapping()),
      THREE.RepeatWrapping, THREE.RepeatWrapping,
      THREE.NearestFilter, THREE.NearestMipMapNearestFilter)
    map.flipY = false
    map.wrapS = 1000
    map.wrapT = 1000
    //map.generateMipmaps = false
    //map.mipmaps[0] = {data: map1.data, width: map1.shape[1], height: map1.shape[0]}

    // set mipmap levels
    /*for (var i = 1; i < pyramid.length; ++i) {
      var level = reshapeTileMap(pyramid[i])
      map.mipmaps.push({
        data: level.data,
        width: level.shape[1],
        height: level.shape[0],
      })
    }*/

    map.needsUpdate = true

    material.uniforms.tileMap.value = map
    material.side = THREE.DoubleSide
    material.needsUpdate = true
  }

  var mesh = new THREE.Object3D()
  var inner = new THREE.Mesh(geometry, material)
  inner.position.set(offset[0], offset[1], offset[2])
  mesh.add(inner)

  return mesh
}
