# ndthree

The unholy union of [three.js](https://github.com/mrdoob/three.js/)
and [Mikola Lysenko's ndarrays](https://github.com/mikolalysenko/ndarray).

It's far more efficient to just use
[gl-now](https://github.com/mikolalysenko/gl-now). See the
[voxel-mipmap-demo](https://github.com/mikolalysenko/voxel-mipmap-demo). But if
you would like to use ndarrays with three.js then this is the library for you.

## example

See [http://shama.github.io/ndthree](http://shama.github.io/ndthree).

```js
// initialize our modules
var ndthree = require('ndthree')
var ndarray = require('ndarray')
var fill = require('ndarray-fill')
var terrain = require('isabella-texture-pack')
var THREE = require('three')

// Create some random voxels in a sphere
var voxels = ndarray(new Uint16Array(32*32*32), [32,32,32])
fill(voxels, function(i,j,k) {
  var x = Math.abs(i - 16)
  var y = Math.abs(j - 16)
  var z = Math.abs(k - 16)
  // (1<<15) toggles ambient occlusion
  return (x*x+y*y+z*z) < 190 ? ((Math.random()*255)|0) + (1<<15) : 0
})

// Create our buffer geometry and shader material
var geometry = new THREE.BufferGeometry()
var material = new THREE.ShaderMaterial()

// Populate the geometry and material
ndthree(voxels, geometry, material)

// Restructure terrain ([256,256,4]) into a tile map shape ([16, 16, 16, 16, 4])
var tiles = ndarray(terrain.data,
    [16,16,terrain.shape[0]>>4,terrain.shape[1]>>4,4],
    [terrain.stride[0]*16, terrain.stride[1]*16, terrain.stride[0], terrain.stride[1], terrain.stride[2]], 0)

// Use helper for creating a mesh (optional)
var mesh = ndthree.createMesh({
  THREE: THREE,
  geometry: geometry,
  material: material,
  map: tiles,
  size: 32,
  pad: true,
})
```

## api

`var ndthree = require('ndthree')`

### `ndthree(ndarray, geometry, material)`

- `ndarray` should be 3 dimensional, eg `[32, 32, 32]`.
- `geometry` can be just an object but easier if a `THREE.BufferGeometry`.
- `material` can be just an object but easier if a `THREE.ShaderMaterial`.

### `ndthree.createMesh(options)`
A helper for creating a three.js mesh from the previously created geometry and
material.

- `options`
  - `THREE` Pass in the instance of three.js. *Required*
  - `geometry` Pass in a `THREE.BufferGeometry`. *Required*
  - `material` Pass in a `THREE.ShaderMaterial`. *Required*
  - `map|texture` Pass in a ndarray texture tile map in the shape of `[16, 16, 16, 16, 4]`.
  - `offset` Offset the mesh with this array. *Default: [1, 1, 1]*
  - `pad` Boolean whether to pad tile map. *Default: true*

*Returns:* A three.js mesh.

## install

With [npm](https://npmjs.org) do:

```
npm install ndthree
```

Use [browserify](http://browserify.org) to `require('ndthree')`.

## release history
* 0.1.0 - initial release

## license
Copyright (c) 2013 Kyle Robinson Young  
Licensed under the MIT license.
