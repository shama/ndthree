# ndarray-geometry

Populates a three.js BufferGeometry from a ndarray.

## example

```js
var ndarrayGeometry = require('ndarray-geometry')
var ndarray = require('ndarray')
var fill = require('ndarray-fill')
var THREE = require('three')

// create our ndarray
var voxels = ndarray(new Int32Array(32 * 32 * 32), [32, 32, 32])

// Fill it up with a voxel sphere
fill(voxels, function(i, j, k) {
  var x = i - 16
  var y = j - 16
  var z = k - 16
  if (x*x+y*y+z*z < 30) {
    if (k < 16) return 1<<15
    return (1<<15)+1
  }  
  return 0
})

// Give it a ndarray and BufferGeometry to populate
var geometry = ndarrayGeometry(voxels, new THREE.BufferGeometry())

// Create a new mesh from the geometry
var mesh = new THREE.Mesh(
  geometry,
  new THREE.MeshPhongMaterial({vertexColors: THREE.VertexColors})
)
```

## install

With [npm](https://npmjs.org) do:

```
npm install ndarray-geometry
```

Use [browserify](http://browserify.org) to `require('ndarray-geometry')`.

## release history
* 0.1.0 - initial release

## license
Copyright (c) 2013 Kyle Robinson Young<br/>
Licensed under the MIT license.
