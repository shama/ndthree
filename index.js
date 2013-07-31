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
  var geometry = this.geometry

  var triangles = 12 * this.ndarray.shape[0] * this.ndarray.shape[1] * this.ndarray.shape[2]
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

  var p4 = 0, p3 = 0
  for (var i = 0; i < this.data.length; i += 8) {
    var x = this.data[i + 0], y = this.data[i + 1], z = this.data[i + 2], ao = this.data[i + 3]
    var nx = this.data[i + 4], ny = this.data[i + 5], nz = this.data[i + 6], tid = this.data[i + 7]

    attrib0s[p4 + 0] = x
    attrib0s[p4 + 1] = y
    attrib0s[p4 + 2] = z
    attrib0s[p4 + 3] = ao

    attrib1s[p4 + 0] = nx
    attrib1s[p4 + 1] = ny
    attrib1s[p4 + 2] = nz
    attrib1s[p4 + 3] = tid

    this.material.attributes.attrib0.value[p4 + 0] = x
    this.material.attributes.attrib0.value[p4 + 1] = y
    this.material.attributes.attrib0.value[p4 + 2] = z
    this.material.attributes.attrib0.value[p4 + 3] = ao

    this.material.attributes.attrib1.value[p4 + 0] = nx
    this.material.attributes.attrib1.value[p4 + 1] = ny
    this.material.attributes.attrib1.value[p4 + 2] = nz
    this.material.attributes.attrib1.value[p4 + 3] = tid

    positions[p3 + 0] = x
    positions[p3 + 1] = y
    positions[p3 + 2] = z

    normals[p3 + 0] = nx
    normals[p3 + 1] = ny
    normals[p3 + 2] = nz

    // TODO: implement colors
    colors[p3 + 0] = 0
    colors[p3 + 1] = 0
    colors[p3 + 2] = 0

    p4 += 4
    p3 += 3
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

  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
}
