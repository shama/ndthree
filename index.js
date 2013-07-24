var createAOMesh = require('ao-mesher')

module.exports = function(arr, geometry) {
  var vert_data = createAOMesh(arr)

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
    /*color: {
      itemSize: 3,
      array: new Float32Array( triangles * 3 * 3 )
    },*/
  }

  var chunkSize = Math.floor(Math.pow(2, 16) / 3)

  var indices = geometry.attributes.index.array
  for (var i = 0; i < indices.length; i++) {
    indices[i] = i % (3 * chunkSize)
  }

  var positions = geometry.attributes.position.array
  var normals = geometry.attributes.normal.array
  //var colors = geometry.attributes.color.array

  //var color = new THREE.Color(0xff0000)

  var p = 0
  for (var i = 0; i < vert_data.length; i += 8) {
    var x = vert_data[i + 0]
    var y = vert_data[i + 1]
    var z = vert_data[i + 2]
    //var ao = vert_data[i + 3]
    var nx = vert_data[i + 4]
    var ny = vert_data[i + 5]
    var nz = vert_data[i + 6]
    //var tid = vert_data[i + 7]

    positions[p + 0] = x
    positions[p + 1] = y
    positions[p + 2] = z

    normals[p + 0] = nx
    normals[p + 1] = ny
    normals[p + 2] = nz

    //colors[p + 0] = color.r
    //colors[p + 1] = color.g
    //colors[p + 2] = color.b

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

  geometry.computeBoundingSphere()

  return geometry
}
