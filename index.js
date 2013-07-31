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
      //color: { type: 'v3', value: [] },
    },
    vertexShader: vsh,
    fragmentShader: fsh,
    map: true,
  }
  this.geometry = geometry
  if (this.data) this._init()
}
module.exports = function(arr, geometry) {
  return new ND3Mesh(arr, geometry)
}
module.exports.ND3Mesh = ND3Mesh

ND3Mesh.prototype._init = function() {
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

  var p = 0
  for (var i = 0; i < vert_data.length; i += 8) {
    var x = vert_data[i + 0]
    var y = vert_data[i + 1]
    var z = vert_data[i + 2]
    var ao = vert_data[i + 3]
    var nx = vert_data[i + 4]
    var ny = vert_data[i + 5]
    var nz = vert_data[i + 6]
    var tid = vert_data[i + 7]

    attrib0s[p + 0] = x
    attrib0s[p + 1] = y
    attrib0s[p + 2] = z
    attrib0s[p + 3] = ao

    attrib1s[p + 0] = nx
    attrib1s[p + 1] = ny
    attrib1s[p + 2] = nz
    attrib1s[p + 3] = tid

    positions[p + 0] = x
    positions[p + 1] = y
    positions[p + 2] = z

    normals[p + 0] = nx
    normals[p + 1] = ny
    normals[p + 2] = nz

    colors[p + 0] = 0
    colors[p + 1] = 0
    colors[p + 2] = 0

    uvs[p + 0] = 0
    uvs[p + 1] = 1

    this.material.attributes.attrib0.value.push(x)
    this.material.attributes.attrib0.value.push(y)
    this.material.attributes.attrib0.value.push(z)
    this.material.attributes.attrib0.value.push(ao)

    this.material.attributes.attrib1.value.push(nx)
    this.material.attributes.attrib1.value.push(ny)
    this.material.attributes.attrib1.value.push(nz)
    this.material.attributes.attrib1.value.push(tid)

    //this.material.attributes.color.value.push(255)
    //this.material.attributes.color.value.push(0)
    //this.material.attributes.color.value.push(0)

    p += 3
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
