<template>
  <div id="app">
   <split-pane @resize="resize" :min-percent='20' :default-percent='20' split="vertical">
      <template slot="paneL">
        <div style="position:relative">
        <div>
          <label class="d-block bg-dark text-white font-weight-bold p-1">Tools</label>
          <div class="px-2 py-2">
            <button type="button" class="btn btn-light border dropdown-toggle mr-1" data-toggle="dropdown">
              <i class="mdi mdi-shape-square-plus"></i>
            </button>
            <div class="dropdown-menu">
              <h6 class="dropdown-header">Create Object</h6>
              <button class="dropdown-item" @click="addObject('Box')">Cube</button>
              <button class="dropdown-item" @click="addObject('Sphere')">Sphere</button>
              <button class="dropdown-item" @click="addObject('Cylinder')">Cylinder</button>
              <button class="dropdown-item" @click="addObject('Cone')">Cone</button>
              <button class="dropdown-item" @click="addObject('Circle')">Circle</button>
              <button class="dropdown-item" @click="addObject('Plane')">Plane</button>
            </div>
            <button type="button" class="btn btn-light border mr-1"><i class="mdi mdi-file-plus"></i></button>
            <button type="button" class="btn btn-light border"><i class="mdi mdi-brush"></i></button>
          </div>
        </div>
        <div id="worlds">
          <label class="d-block bg-dark text-white font-weight-bold p-1">World</label>

          <div id="objects">
            <label class="d-block bg-secondary text-light border-bottom p-1 small font-weight-bold">Objects ({{objects.length}})</label>
            <div class="object border-bottom" v-for="(o,i) in objects">
              <div class="row no-gutters">
                <div class="col-10">
                  <button @click="selectObject(o,true)" class="bg-light border-0 w-100 text-left">
                  <i v-if="o.active" class="mdi mdi-circle text-primary small mr-1"></i>
                  <i v-else class="mdi mdi-circle-outline text-secondary small mr-1"></i>
                  <span>{{o.name}}</span>
                  </button>
                </div>
                <div class="col-2 border-left">
                  <div v-if="o.active">
                    <button type="button" class="bg-light border-0 w-100 dropdown-toggle" data-toggle="dropdown">
                      <i class="mdi mdi-settings"></i>
                    </button>
                    <div class="dropdown-menu">
                      <a @click.prevent="removeObject(o)" class="dropdown-item" href="#">Remove</a>
                    </div>
                  </div>
                </div>
              </div>
              <div class="w-100 border-top" v-if="o.active">
                X
              </div>
            </div>
          </div>
          <div id="lights">
            <label class="d-block bg-secondary text-light border-bottom p-1 small font-weight-bold">Lights ({{lights.length}})</label>
          </div>
          <div id="sky">
            <label class="d-block bg-secondary text-light border-bottom p-1 small font-weight-bold">Sky</label>
            <div class="row">
              <div class="col-5">
                <span class="small">Luminance</span>
              </div>
              <div class="col-7">
                <input class="w-100" v-if="sky" step="0.1" min="0.1" max="0.9" type="number" v-model="sky.material.uniforms.luminance.value">
              </div>
            </div>
            <div class="row">
              <div class="col-5">
                <span class="small">Turbidity</span>
              </div>
              <div class="col-7">
                <input class="w-100" v-if="sky" step="1" min="-30" max="10" type="number" v-model="sky.material.uniforms.turbidity.value">
              </div>
            </div>
            <div class="row">
              <div class="col-5">
                <span class="small">Rayleigh</span>
              </div>
              <div class="col-7">
                <input class="w-100" v-if="sky" step="0.1" min="0" max="2" type="number" v-model="sky.material.uniforms.rayleigh.value">
              </div>
            </div>
            <div class="row">
              <div class="col-5">
                <span class="small">mieDirectionalG</span>
              </div>
              <div class="col-7">
                <input class="w-100" v-if="sky" step="0.1" min="0" max="2" type="number" v-model="sky.material.uniforms.mieDirectionalG.value">
              </div>
            </div>
            <div class="row">
              <div class="col-5">
                <span class="small">mieCoefficient</span>
              </div>
              <div class="col-7">
                <input class="w-100" v-if="sky" step="0.001" min="0" max="0.02" type="number" v-model="sky.material.uniforms.mieCoefficient.value">
              </div>
            </div>
          </div>
          <div id="terrain">
            <label class="d-block bg-secondary text-light border-bottom p-1 small font-weight-bold">Terrain</label>
          </div>
        </div>
      </div>
      </template>
      <template slot="paneR">
        <div
          @mousedown="mouseDown($event)"
          @mousemove="mouseMove($event)"
          @dblclick="dblClick($event)"
          
          ref="render"
          class="render"
        ></div>
      </template>
    </split-pane>
  </div>
</template>

<script>
import * as THREE from 'three';
global.THREE = require('three')
const OrbitControls = require('three-orbit-controls')(THREE)
const TransformControls = require('three-transform-ctrls')
const WindowResize = require('three-window-resize')
const Sky = require('three-sky');
const Terrain = require('three.terrain.js')

export default {
  data () {
    return {
      clock: new THREE.Clock(),
      scene: new THREE.Scene(),
      camera: null,
      renderer: new THREE.WebGLRenderer({antialias: true}),
      lights: [new THREE.AmbientLight(0xFFFFFF),new THREE.DirectionalLight(0xffffff, 0.5)],
      orbitControls: null,
      transformControls: null,
      gridHelper: new THREE.GridHelper(40, 40),
      axesHelper: new THREE.AxesHelper(5),
      player: {
        mesh: new THREE.Mesh(new THREE.BoxGeometry( 0.25, 0.25, 0.25 ),
              new THREE.MeshPhongMaterial({ color: 'dodgerblue' })),
        keys: {
            up: false,
            down: false,
            forward: false,
            backward: false,
            left: false,
            right: false
        },
        mouse: new THREE.Vector2(),
        ray: new THREE.Raycaster()
      },
      m: {
        vec: new THREE.Vector3(),
        pos: new THREE.Vector3()
      },
      world: {
        o: [{
          name: 'Test Block',
          size: [1,1,1],
          position: [2,0,2],
          color: 'lightgray',
          g: 'Box'
        },{
          name: 'Test Block',
          size: [1,1,1],
          position: [4,0,2],
          color: 'pink',
          g: 'Box'
        }]
      },
      sky: null,
      terrain: null,
      objects: [],
      intersects: null,
      intersected: null,
      create: {
        active: false,
        object: null
      }
    }
  },
  mounted () {
    let that = this;
    this.renderer.setSize(this.$refs.render.offsetWidth, this.$refs.render.offsetHeight);
    document.querySelector('.render').appendChild(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera( 75, this.$refs.render.offsetWidth / this.$refs.render.offsetHeight, 0.1, 1000 )

    this.orbitControls = new OrbitControls(this.camera,this.renderer.domElement)
    this.orbitControls.enableKeys = false

    this.init()
    this.animate()

    window.addEventListener('keydown', function(e) {
        that.keyswitch(e, true)
    })
    window.addEventListener('keyup', function(e) {
        that.keyswitch(e, false)
    })
    window.addEventListener('resize', function(event){
      that.resize()
    })
  },
  methods: {
    resize () {
      this.camera.aspect = this.$refs.render.offsetWidth / this.$refs.render.offsetHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.$refs.render.offsetWidth, this.$refs.render.offsetHeight);
    },
    animate () {
      requestAnimationFrame(this.animate)
      this.update()
      this.render()
    },
    init () {
      let that = this;

      const sky = new Sky();
      sky.scale.setScalar( 40 );
      sky.material.uniforms.luminance.value = 0.2
      sky.material.uniforms.turbidity.value = 10
      sky.material.uniforms.rayleigh.value = 0.8
      sky.material.uniforms.mieDirectionalG.value = 0.4
      sky.material.uniforms.mieCoefficient.value = 0.005
      this.sky = sky;
      this.scene.add(sky)

      this.lights.forEach(function (l) { that.scene.add(l) })
      this.gridHelper.position.set(-0.5,-0.5,-0.5)
      this.axesHelper.position.set(-0.5,-0.49,-0.5)
      this.scene.add(this.gridHelper,this.axesHelper)
      this.scene.add(this.player.mesh)
      this.player.mesh.position.set(0,1,0)
      this.player.mesh.rotation.y = Math.PI * 1.5

      // Floor
      const floor = new THREE.Mesh(new THREE.BoxGeometry( 10, 0.5, 10 ), new THREE.MeshPhongMaterial( { color: '#999999' } ))
      floor.position.set(-0.5,-0.8,-0.5)

      
      


      //this.scene.add(floor)

      // Terrain
      this.makeTerrain()

      // World Objects
      this.world.o.forEach(function (ob,i) {
        let obj = that.createObject(ob);
        that.objects.push(obj)
        that.scene.add(that.objects[i].bounds,that.objects[i].controls,that.objects[i])
      })



    },
    makeTerrain () {
      let texture = new THREE.TextureLoader().load(require('./assets/img/grass1.jpg'))
      this.terrain = THREE.Terrain({
          easing: THREE.Terrain.EaseIn,
          frequency: 4,
          heightmap: THREE.Terrain.DiamondSquare,
          material: new THREE.MeshPhongMaterial({map: texture}),
          maxHeight: 1,
          minHeight: -1,
          steps: 1,
          useBufferGeometry: false,
          xSegments: 40,
          xSize: 40,
          ySegments: 40,
          ySize: 40,
      });
      this.scene.add(this.terrain);

      let worldBounds = makeBounds();
      this.scene.add(worldBounds)
      worldBounds.position.y = -1;

      function makeBounds () {
        let container = new THREE.Object3D()
        let rowA = buildArenaRow({
          container : container,
          radius    : 21,
          nClusters : 30,
          nPerCluster : 5,
          heightMin : 4,
          heightMax : 10,
          radiusBottomMin : 2,
          radiusBottomMax : 3.5,
        })
        let rowB = buildArenaRow({
          container : container,
          radius    : 20,
          nClusters : 20,
          nPerCluster : 2,
          heightMin : 2,
          heightMax : 6,
          radiusBottomMin : 1.5,
          radiusBottomMax : 2.5,
        })
        return container;
      }

      function buildArenaRow(opts){
        opts      = opts  || {}
        var container   = opts.container  || console.assert(false, 'This arguments is required')
        var radius    = opts.radius !== undefined   ? opts.radius   : 10/20
        var nClusters   = opts.nCluster !== undefined   ? opts.nClusters  : 30
        var nPerCluster   = opts.nPerCluster !== undefined  ? opts.nPerCluster  : 5
        var heightMin   = opts.heightMin !== undefined    ? opts.heightMin  : 2/20
        var heightMax   = opts.heightMax !== undefined    ? opts.heightMax  : 3/20
        var radiusBottomMin = opts.radiusBottomMin !== undefined  ? opts.radiusBottomMin  : 0.8/20
        var radiusBottomMax = opts.radiusBottomMax !== undefined  ? opts.radiusBottomMax  : 0.8/20
        
        var material    = new THREE.MeshPhongMaterial({color: '#553615'})
        for(var i = 0; i < nClusters; i++ ){
          var angle = (i / nClusters) * (Math.PI*2);
          for(var j = 0; j < nPerCluster; j++){
            var deltaAngle  = THREE.Math.randFloatSpread(2/nClusters) * (Math.PI*2);
            var height  = THREE.Math.randFloat( heightMin, heightMax );
            var radiusBottom= THREE.Math.randFloat( radiusBottomMin, radiusBottomMax );
            var geometry  = new THREE.CylinderBufferGeometry(0, radiusBottom, height)
            var mesh  = new THREE.Mesh(geometry, material)
            mesh.position.y = height/2
            mesh.position.x = opts.radius * Math.cos(angle + deltaAngle)
            mesh.position.z = opts.radius * Math.sin(angle + deltaAngle)
            opts.container.add(mesh)
          }
        }
        return opts.container;
      }

    },
    update () {
      let that = this;
      this.controls()
      this.player.ray.setFromCamera(this.player.mouse, this.camera);
      this.intersects = this.player.ray.intersectObjects(this.objects, false);
      if (this.intersects.length > 0) {
        if (that.intersects[0].object != that.intersected) {
          that.intersected = that.intersects[0].object;
        }
      } 
      else {
        that.intersected = null;
      }

      this.objects.forEach(function (o) {
        if (o.active) {
          o.bounds.visible = true;
          o.controls.visible = true;
          o.controls.enabled = true;
        } else {
          o.bounds.visible = false;
          o.controls.visible = false;
          o.controls.enabled = false;
        }
      })

      if (this.create.active) {
        this.create.object.position.set(this.m.pos.x,this.m.pos.y,this.m.pos.z)
      }

    },
    render () {
      this.renderer.render(this.scene, this.camera)
    },
    controls () {
      let keys = this.player.keys;
      let mesh = this.player.mesh;

      let delta = this.clock.getDelta()
      let moveDistance = 1.25 * delta
      let rotateAngle = Math.PI / 2 * delta
      let rotation_matrix = new THREE.Matrix4().identity();

      keys.forward && (mesh.translateX(moveDistance))
      keys.backward && (mesh.translateX(-moveDistance))
      keys.left && (mesh.rotateOnAxis( new THREE.Vector3(0,1,0), rotateAngle))
      keys.right && (mesh.rotateOnAxis( new THREE.Vector3(0,1,0), -rotateAngle))
      keys.up && (mesh.translateY(moveDistance))
      keys.down && (mesh.translateY(-moveDistance))

      if (mesh.position.y <= -0.35) { mesh.position.y = -0.35 }

      let relativeCameraOffset = new THREE.Vector3(-2,1,0);
      let cameraOffset = relativeCameraOffset.applyMatrix4(mesh.matrixWorld);
      this.camera.position.x = cameraOffset.x;
      this.camera.position.y = cameraOffset.y;
      this.camera.position.z = cameraOffset.z;
      this.camera.lookAt(mesh.position);

    },
    mouseDown (e) {
      let that = this;
      if (this.intersected) {
        that.selectObject(that.intersected)
      }

      // Set object if adding
      if (this.create.active) {
        this.create.active = false;
        this.create.object = null;
      }
    },
    mouseMove (e) {
      let rect = this.$refs.render.getBoundingClientRect()
      this.player.mouse.x = ((event.clientX - rect.left) / this.$refs.render.offsetWidth) * 2 - 1;
      this.player.mouse.y = -((event.clientY - rect.top) / this.$refs.render.offsetHeight) * 2 + 1;
      this.objects.forEach(function (o) {
        o.bounds.update()
      })

      // Adding object
      this.m.vec.set(
      ((event.clientX - rect.left) / this.$refs.render.offsetWidth) * 2 - 1,
      -((event.clientY - rect.top) / this.$refs.render.offsetHeight) * 2 + 1,
      0.5 )
      this.m.vec.unproject(this.camera)
      this.m.vec.sub(this.camera.position).normalize();
      let distance = - this.camera.position.z / this.m.vec.z;
      this.m.pos.copy(this.camera.position).add(this.m.vec.multiplyScalar(distance))

    },
    dblClick (e) {
      this.deselectAll()
    },
    keyswitch (e, bool) {
      let keys = this.player.keys;
      switch (e.keyCode) {
          case 187:
              e.preventDefault() // Up
              keys.up = bool
              break;
          case 189:
              e.preventDefault() // Down
              keys.down= bool
              break;
          case 39:
          case 68:
              e.preventDefault() // Right
              keys.right = bool
              break;
          case 37:
          case 65:
              e.preventDefault() // Left
              keys.left = bool
              break;
          case 38:
          case 87:
              e.preventDefault() // Forward
              keys.forward = bool
              break;
          case 40:
          case 83:
              e.preventDefault() // Backward
              keys.backward = bool
              break;
          default:
              break;
      }
    },
    createObject (o) {
        let mesh;
        switch (o.g) {
          case 'Box':
            mesh = new THREE.Mesh (
                new THREE.BoxBufferGeometry(o.size[0],o.size[1], o.size[2]),
                new THREE.MeshLambertMaterial({ color: o.color })
            )
            break;
          case 'Sphere':
            mesh = new THREE.Mesh (
                new THREE.SphereBufferGeometry(o.size[0],o.size[1],o.size[2]),
                new THREE.MeshLambertMaterial({ color: o.color})
            )
            break;
          case 'Cylinder':
            mesh = new THREE.Mesh (
                new THREE.CylinderBufferGeometry(o.size[0],o.size[1],o.size[2],o.size[3]),
                new THREE.MeshLambertMaterial({ color: o.color})
            )
            break;
          case 'Cone':
            mesh = new THREE.Mesh (
                new THREE.ConeBufferGeometry(o.size[0],o.size[1],o.size[2]),
                new THREE.MeshLambertMaterial({ color: o.color})
            )
            break;
          case 'Circle':
            mesh = new THREE.Mesh (
                new THREE.CircleBufferGeometry(o.size[0],o.size[1]),
                new THREE.MeshLambertMaterial({ color: o.color, side: THREE.DoubleSide })
            )
            break;
          case 'Plane':
            mesh = new THREE.Mesh (
                new THREE.PlaneBufferGeometry(o.size[0],o.size[1],o.size[2]),
                new THREE.MeshLambertMaterial({ color: o.color, side: THREE.DoubleSide })
            )
            break;
          default:
            return false;
            break;
        }
        mesh.name = o.name;
        mesh.active = false;
        mesh.position.set(o.position[0],o.position[1],o.position[2])

        let bounds = new THREE.BoxHelper(mesh, 0xffff00);
        bounds.visible = false;
        mesh.bounds = bounds;

        let controls = new TransformControls(this.camera, this.renderer.domElement);
        controls.attach(mesh)
        controls.visible = false;
        controls.enabled = false;
        controls.setTranslationSnap(1);
        mesh.controls = controls;

        /*controls.addEventListener('objectChange', (e) => {
          console.log(e)
        });*/

        return mesh;
    },
    selectObject (o,fromPanel) {
      if (fromPanel) {
        if (o.active) {
          this.deselectAll()
        } else {
          this.deselectAll()
          o.active = true;
        }
      } else {
        this.deselectAll()
        o.active = true;
      }
    },
    deselectAll () {
      this.objects.forEach(function (o) {
        o.active = false;
      })
    },
    addObject (g) {
      let o;
      switch (g) {
        case 'Box':
          o = {
            name: 'Box_'+Math.random().toString(36).substring(8),
            size: [1,1,1],
            position: [0,0,0],
            color: 'lightgray',
            g: g
          }
          break;
        case 'Sphere':
          o = {
            name: 'Sphere_'+Math.random().toString(36).substring(8),
            size: [1,32,32],
            position: [0,0,0],
            color: 'lightgray',
            g: g
          }
          break;
        case 'Cylinder':
          o = {
            name: 'Cylinder_'+Math.random().toString(36).substring(8),
            size: [0.5,0.5,1,32],
            position: [0,0,0],
            color: 'lightgray',
            g: g
          }
          break;
        case 'Cone':
          o = {
            name: 'Cone_'+Math.random().toString(36).substring(8),
            size: [0.5,1,32],
            position: [0,0,0],
            color: 'lightgray',
            g: g
          }
          break;
        case 'Circle':
          o = {
            name: 'Circle_'+Math.random().toString(36).substring(8),
            size: [0.5,32],
            position: [0,0,0],
            color: 'lightgray',
            g: g
          }
          break;
        case 'Plane':
          o = {
            name: 'Plane_'+Math.random().toString(36).substring(8),
            size: [1,1,1],
            position: [0,0,0],
            color: 'lightgray',
            g: g
          }
          break;
        default:
          return false;
          break;
      }

      let obj = this.createObject(o);
      this.objects.push(obj)

      let ob = this.objects[this.objects.length - 1];
      this.scene.add(ob.bounds,ob.controls,ob)
      this.selectObject(ob)

      // Set object to mouse controls temporarily
      this.create.object = ob;
      this.create.active = true;
      
    },
    removeObject (o) {
      let that = this;

      this.objects.forEach(function (obj,i) {
        if (o == obj) {
          that.objects.splice(i,1)
          o.controls.detach(o)
          that.scene.remove(o.controls,o.bounds,o)

        }
      })

    }
  },
  components: {}
}
</script>