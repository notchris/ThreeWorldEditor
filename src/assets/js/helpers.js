import {
    MTLLoader,
    OBJLoader
} from 'three-obj-mtl-loader'
const TransformControls = require('three-transform-ctrls')

export function makeBounds(x) {
    let container = new THREE.Object3D()
    let rowA = buildArenaRow({
        container: container,
        radius: 21,
        nClusters: 30,
        nPerCluster: 5,
        heightMin: 4,
        heightMax: 10,
        radiusBottomMin: 2,
        radiusBottomMax: 3.5,
    })
    let rowB = buildArenaRow({
        container: container,
        radius: 20,
        nClusters: 20,
        nPerCluster: 2,
        heightMin: 2,
        heightMax: 6,
        radiusBottomMin: 1.5,
        radiusBottomMax: 2.5,
    })
    return container;
}

export function makeModel(scene, model, camera, domel,objects) {
    let mtlLoader = new MTLLoader();
    let objLoader = new OBJLoader();
    let path = '../models/';
    mtlLoader.load(path + model + '.mtl', (materials) => {
        materials.preload()
        objLoader.setMaterials(materials)
        objLoader.load(path + model + '.obj', (object) => {
        	let obj = new THREE.Object3D();
     
            object.position.set(0, 0, 0)
            object.name = model + '_' + Math.random().toString(36).substring(8);

            let controls = new TransformControls(camera, domel);
            controls.attach(object)
            obj.add(object)
            scene.add(obj)
            scene.add(controls)
            objects.push(obj)
            console.log(obj)
            object.controls = controls;
            obj.active = true;
        })
    })
}

export function makeTerrain(scene,t) {

	if (t) {
		// Generate Terrain
	    let texture = new THREE.TextureLoader().load(require('../img/grass1.jpg'))
	    let terrain = THREE.Terrain({
	        easing: THREE.Terrain.EaseIn,
	        frequency: 4,
	        heightmap: THREE.Terrain.DiamondSquare,
	        material: new THREE.MeshLambertMaterial({
	            map: texture
	        }),
	        maxHeight: -0.5,
	        minHeight: -1.5,
	        steps: 1,
	        useBufferGeometry: false,
	        xSegments: 40,
	        xSize: 40,
	        ySegments: 40,
	        ySize: 40,
	    });

	    /** TREES **/

	    let terrainGeo = terrain.children[0].geometry;
	    let mtlLoader = new MTLLoader();
	    let objLoader = new OBJLoader();
	    mtlLoader.load('../models/tree.mtl', (materials) => {
	        materials.preload()
	        objLoader.setMaterials(materials)
	        objLoader.load('../models/tree.obj', (object) => {
	            object.scale.set(0.75, 0.75)
	            let trees = THREE.Terrain.ScatterMeshes(terrainGeo, {
	                mesh: object,
	                sizeVariance: 0.1,
	                w: 30,
	                h: 30,
	                spread: 0.005,
	                randomness: Math.random,
	            });
	            //terrain.add(trees);
	            scene.add(terrain)
	        })
	    })
	} else {
	    // Flat
	    let texture = new THREE.TextureLoader().load(require('../img/grass1.jpg'))
	    const floor = new THREE.Mesh(new THREE.BoxBufferGeometry(40, 0.5, 40), new THREE.MeshPhongMaterial({
	        map: texture
	    }))
	    floor.position.set(-0.5, -0.8, -0.5)
	    scene.add(floor)
	}
}

function buildArenaRow(opts) {
    opts = opts || {}
    var container = opts.container || console.assert(false, 'This arguments is required')
    var radius = opts.radius !== undefined ? opts.radius : 10 / 20
    var nClusters = opts.nCluster !== undefined ? opts.nClusters : 30
    var nPerCluster = opts.nPerCluster !== undefined ? opts.nPerCluster : 5
    var heightMin = opts.heightMin !== undefined ? opts.heightMin : 2 / 20
    var heightMax = opts.heightMax !== undefined ? opts.heightMax : 3 / 20
    var radiusBottomMin = opts.radiusBottomMin !== undefined ? opts.radiusBottomMin : 0.8 / 20
    var radiusBottomMax = opts.radiusBottomMax !== undefined ? opts.radiusBottomMax : 0.8 / 20

    var material = new THREE.MeshPhongMaterial({
        color: '#553615'
    })
    for (var i = 0; i < nClusters; i++) {
        var angle = (i / nClusters) * (Math.PI * 2);
        for (var j = 0; j < nPerCluster; j++) {
            var deltaAngle = THREE.Math.randFloatSpread(2 / nClusters) * (Math.PI * 2);
            var height = THREE.Math.randFloat(heightMin, heightMax);
            var radiusBottom = THREE.Math.randFloat(radiusBottomMin, radiusBottomMax);
            var geometry = new THREE.CylinderBufferGeometry(0, radiusBottom, height)
            var mesh = new THREE.Mesh(geometry, material)
            mesh.position.y = height / 2
            mesh.position.x = opts.radius * Math.cos(angle + deltaAngle)
            mesh.position.z = opts.radius * Math.sin(angle + deltaAngle)
            opts.container.add(mesh)
        }
    }
    return opts.container;
}