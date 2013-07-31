var createAOMesh = require('ao-mesher')
var fs = require('fs')

var vsh = fs.readFileSync(__dirname + '/shaders/ao.vsh')
var fsh = fs.readFileSync(__dirname + '/shaders/ao.fsh')

function ND3Mesh(arr, geometry) {
  this.ndarray = arr
  this.data = createAOMesh(arr)
  this.material = {
    uniforms: {
      tileSize: { type: 'f', value: 16.0 },
      tileMap: { type: 't', value: [] },
    },
    attributes: {
      attrib0: { type: 'v4', value: [] },
      attrib1: { type: 'v4', value: [] },
    },
    vertexShader: vsh,
    fragmentShader: fsh,
  }
  this.geometry = geometry
  this._init()
}
module.exports = function(arr, geometry) {
  return new ND3Mesh(arr, geometry)
}
module.exports.ND3Mesh = ND3Mesh

ND3Mesh.prototype._init = function() {
  var self = this
  var geometry = this.geometry
  var arr = this.ndarray
  var vert_data = this.data

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
    color: {
      itemSize: 3,
      array: new Float32Array(triangles * 3 * 3)
    },
    uv: {
      itemSize: 2,
      array: new Float32Array(triangles * 3 * 2)
    },
    attrib0: {
      itemSize: 4,
      array: new Float32Array(triangles * 3 * 4)
    },
    attrib1: {
      itemSize: 4,
      array: new Float32Array(triangles * 3 * 4)
    },
  }

  if (this.data === null) return

  var chunkSize = Math.floor(Math.pow(2, 16) / 3)

  var indices = geometry.attributes.index.array
  for (var i = 0; i < indices.length; i++) {
    indices[i] = i % (3 * chunkSize)
  }

  var positions = geometry.attributes.position.array
  var normals = geometry.attributes.normal.array
  var colors = geometry.attributes.color.array
  var uvs = geometry.attributes.uv.array

  var attrib0s = geometry.attributes.attrib0.array
  var attrib1s = geometry.attributes.attrib1.array

  eachData(vert_data, function(p, x, y, z, ao, nx, ny, nz, tid) {
    attrib0s[p + 0] = x
    attrib0s[p + 1] = y
    attrib0s[p + 2] = z
    attrib0s[p + 3] = ao

    attrib1s[p + 0] = nx
    attrib1s[p + 1] = ny
    attrib1s[p + 2] = nz
    attrib1s[p + 3] = tid

    self.material.attributes.attrib0.value[p + 0] = x
    self.material.attributes.attrib0.value[p + 1] = y
    self.material.attributes.attrib0.value[p + 2] = z
    self.material.attributes.attrib0.value[p + 3] = ao

    self.material.attributes.attrib1.value[p + 0] = nx
    self.material.attributes.attrib1.value[p + 1] = ny
    self.material.attributes.attrib1.value[p + 2] = nz
    self.material.attributes.attrib1.value[p + 3] = tid
  }, 4)

  eachData(vert_data, function(p, x, y, z, ao, nx, ny, nz, tid) {
    positions[p + 0] = x
    positions[p + 1] = y
    positions[p + 2] = z

    normals[p + 0] = nx
    normals[p + 1] = ny
    normals[p + 2] = nz

    colors[p + 0] = 0
    colors[p + 1] = 0
    colors[p + 2] = 0
  }, 3)

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

  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
}

function eachData(data, fn, by) {
  var p = 0
  for (var i = 0; i < data.length; i += 8) {
    var x = data[i + 0]
    var y = data[i + 1]
    var z = data[i + 2]
    var ao = data[i + 3]
    var nx = data[i + 4]
    var ny = data[i + 5]
    var nz = data[i + 6]
    var tid = data[i + 7]
    fn(p, x, y, z, ao, nx, ny, nz, tid)
    p += by
  }
}
