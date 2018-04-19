var camera, scene, renderer, controls;

var objects = [];
var points = 0;
var raycaster;
var shooting = 0;
var spawnTime = 300;
var blocker,  instructions;
var bullets = [];
var controlsEnabled = false;
var gun = null;
var sprint = false;
var moveForward = true;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var monsters = [];
var prevTime = performance.now();
var velocity, direction;
var objLoader = null, jsonLoader = null;
var floorUrl = "../images/checker_large.gif";
var cubeUrl = "../images/wooden_crate_texture_by_zackseeker-d38ddsb.png";

// http://www.html5rocks.com/en/tutorials/pointerlock/intro/




function loadJson()
{
    var xpos = Math.floor((Math.random() * -2000) + 1000);
    var zpos = Math.floor((Math.random() * -2000) + 1000);

    if(!jsonLoader)
    jsonLoader = new THREE.JSONLoader();

    jsonLoader.load(
        'monster/monster.js',

        function(geometry, materials)
        {
            var material = materials[0];

            var object = new THREE.Mesh(geometry, material);
            object.castShadow = true;
            object. receiveShadow = true;
            object.scale.set(0.02, 0.02, 0.02);
            object.position.y = -1;
            object.position.x = xpos;
            object.position.z = zpos;
            object.material.transparent = true;
            scene.add(object);
            monsters.push(object);
            console.log(monsters);
        },
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );

        });
}


function loadObj()
{
    if(!objLoader)
        objLoader = new THREE.OBJLoader();

    objLoader.load(
        'cerberus/Cerberus.obj',

        function(object)
        {
            var texture = new THREE.TextureLoader().load('cerberus/Cerberus_A.jpg');
            var normalMap = new THREE.TextureLoader().load('cerberus/Cerberus_N.jpg');
            var specularMap = new THREE.TextureLoader().load('cerberus/Cerberus_M.jpg');

            object.traverse( function ( child )
            {
                if ( child instanceof THREE.Mesh )
                {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.material.map = texture;
                    child.material.normalMap = normalMap;
                    child.material.specularMap = specularMap;
                }
            } );

            gun = object;
            gun.scale.set(5,5,5);
            gun.position.z = controls.getObject().position.z-3;
            gun.position.x = controls.getObject().position.x+2;
            gun.position.y = controls.getObject().position.y;
            // gun.rotation.x = Math.PI / 180 * 15;
            gun.rotation.y = 50;
            scene.add(object);
        },
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened', error );

        });
}


function initPointerLock()
{
    var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

    if ( havePointerLock )
    {
        var element = document.body;

        var pointerlockchange = function ( event ) {

            if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

                controlsEnabled = true;
                controls.enabled = true;

                blocker.style.display = 'none';

            } else {

                controls.enabled = false;

                blocker.style.display = 'block';

                instructions.style.display = '';

            }

        };

        var pointerlockerror = function ( event ) {

            instructions.style.display = '';

        };

        // Hook pointer lock state change events
        document.addEventListener( 'pointerlockchange', pointerlockchange, false );
        document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
        document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

        document.addEventListener( 'pointerlockerror', pointerlockerror, false );
        document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
        document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

        instructions.addEventListener( 'click', function ( event )
        {
            instructions.style.display = 'none';

            // Ask the browser to lock the pointer
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
            element.requestPointerLock();

        }, false );

    } else {

        instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

    }
}


function dyingMonster(index){

  setTimeout(function(){
    scene.remove(monsters[index]);
    monsters.splice(index, 1);
  }, 500);
  monsters[index].material.opacity = 1 + Math.sin(new Date().getTime() * .0025);//or any ot
  points += 1;
  document.getElementById("scoreShow").innerHTML = "Score: " + points + " aliens killed";
}


function checkIfMonsterDied(index){
  if(monsters[index] != undefined){
    for(var i = 0; i < bullets.length; i++){
      if(monsters[index].position.x + 30 > bullets[i].position.x && monsters[index].position.x - 30 < bullets[i].position.x ){
        if(monsters[index].position.z + 30 > bullets[i].position.z && monsters[index].position.z - 30 < bullets[i].position.z ){
          console.log("mueroooooo");
          dyingMonster(index);
          scene.remove(bullets[i]);
          bullets.splice(i, 1);
          break;
        }
      }
    }
  }
}




function onKeyDown ( event )
{
    switch ( event.keyCode ) {

        case 38: // up
        case 87: // w
            moveForward = true;
            break;

        case 37: // left
        case 65: // a
            console.warn("left");
            controls.getObject().rotateY(Math.PI/2);
            moveLeft = true; break;

        case 40: // down
        case 83: // s
            moveBackward = true;
            break;

        case 39: // right
        case 68: // d
        controls.getObject().rotateY(-Math.PI/2);
            moveRight = true;
            break;
        // case 69:
        //     // shoot();
        //     break;
        case 16:
            sprint = true;
            break;
        case 32: // space
            if ( canJump === true ) velocity.y += 350;
            canJump = false;
            break;

    }

}

function onKeyUp( event ) {

    switch( event.keyCode ) {

        case 38: // up
        case 87: // w
            moveForward = true;
            break;

        case 37: // left
        case 65: // a
            moveLeft = false;
            break;

        case 40: // down
        case 83: // s
            moveBackward = false;
            break;
        case 16:
            sprint = false;
            break;
        case 39: // right
        case 68: // d
            moveRight = false;
            break;

    }
}

function createScene(canvas)
{

    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    window.addEventListener( 'resize', onWindowResize, false );

    velocity = new THREE.Vector3();
    direction = new THREE.Vector3();

    blocker = document.getElementById( 'blocker' );
    instructions = document.getElementById( 'instructions' );

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x696969 );
    // scene.fog = new THREE.Fog( 0xffffff, 0, 550 );

    // A light source positioned directly above the scene, with color fading from the sky color to the ground color.
    // HemisphereLight( skyColor, groundColor, intensity )
    // skyColor - (optional) hexadecimal color of the sky. Default is 0xffffff.
    // groundColor - (optional) hexadecimal color of the ground. Default is 0xffffff.
    // intensity - (optional) numeric value of the light's strength/intensity. Default is 1.

    var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
    light.position.set( 0.5, 1, 0.75 );
    scene.add( light );

    controls = new THREE.PointerLockControls( camera );
    scene.add( controls.getObject() );

    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );

    // Raycaster( origin, direction, near, far )
    // origin — The origin vector where the ray casts from.
    // direction — The direction vector that gives direction to the ray. Should be normalized.
    // near — All results returned are further away than near. Near can't be negative. Default value is 0.
    // far — All results returned are closer then far. Far can't be lower then near . Default value is Infinity.
    raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

    // floor

    var map = new THREE.TextureLoader().load(floorUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);

    var floorGeometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
    var floor = new THREE.Mesh(floorGeometry, new THREE.MeshPhongMaterial({color:0xffffff, map:map, side:THREE.DoubleSide}));
    floor.rotation.x = -Math.PI / 2;
    scene.add( floor );
    //
    // // objects
    // for (var i = 0; i < 4; i++) {
    //     loadJson();
    // }
    // loadObj();


    console.log(controls.getObject().position.y);
    console.log(controls.getObject().position.x);
    console.log(controls.getObject().position.z);
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function run()
{
    requestAnimationFrame( run );

    if ( controlsEnabled === true )
    {
        raycaster.ray.origin.copy( controls.getObject().position );
        raycaster.ray.origin.y -= 10;

        var intersections = raycaster.intersectObjects( objects );

        var onObject = intersections.length > 0;

        var time = performance.now();
        var delta = ( time - prevTime ) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        if(sprint){
          velocity.x *= 1.3
          velocity.y *= 1.3
          velocity.z *= 1.3

        }
        direction.z = Number( moveForward ) - Number( moveBackward );
        direction.x = Number( moveLeft ) - Number( moveRight );
        direction.normalize(); // this ensures consistent movements in all directions

        if ( moveForward || moveBackward ) velocity.z -= direction.z * 600.0 * delta;
        // if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

        if ( onObject === true )
        {
            velocity.y = Math.max( 0, velocity.y );
            canJump = true;
        }

        controls.getObject().translateX( velocity.x * delta );
        controls.getObject().translateY( velocity.y * delta );
        controls.getObject().translateZ( velocity.z * delta );

        if ( controls.getObject().position.y < 10 ) {

            velocity.y = 0;
            controls.getObject().position.y = 10;

            canJump = true;

        }

        prevTime = time;

    }
    // if(monsters.length > 0){
    //   // console.log("si hay monstruos");
    //     // var vector = monsters[0].position.distanceTo(controls.getObject().position)//new THREE.Vector3(controls.getObject().position.x, 0, controls.getObject().position.z);
    //     for(var i = 0; i< monsters.length; i++){
    //       var vector = controls.getObject().position
    //       move = new THREE.Vector3().subVectors(vector, monsters[i].position)
    //       monsters[i].lookAt(controls.getObject().position);
    //       monsters[i].position.add(new THREE.Vector3(move.x* 0.007,0,move.z* 0.007 )); // add to position
    //       checkIfMonsterDied(i);
    //     }
    //
    // }
    // if(gun){
    //   // gun.position.z = controls.getObject().position.z-3;
    //   // gun.position.x = controls.getObject().position.x+2;
    //   // gun.position.y = controls.getObject().position.y;
    //   // // gun.rotation.z = controls.getObject().rotation.z-3;
    //   // // gun.rotation.x = controls.getObject().rotation.x+2;
    //   // gun.rotation.y = controls.getObject().rotation.y;
    //   gun.position.x = (controls.getObject().position.x - Math.sin(controls.getObject().rotation.y + Math.PI/7) * 2.35);
    //   gun.position.y = (controls.getObject().position.y - 0.6)
    //   gun.position.z = (controls.getObject().position.z - Math.cos(controls.getObject().rotation.y + Math.PI/7) * 2.35);
    //
    //   gun.rotation.x = controls.getObject().rotation.x;
    //   gun.rotation.y = controls.getObject().rotation.y + Math.PI/90;
    //   gun.rotation.z = controls.getObject().rotation.z;
    //
    // }
    // for(var i = 0; i < bullets.length; i++){
    //   if(bullets[i] == undefined){
    //     continue;
    //   }
    //   if(bullets[i].alive == false){
    //     bullets.splice(i, 1);
    //     continue;
    //   }
    //   bullets[i].position.add(bullets[i].velocity);
    // }
    // if(shooting > 0){
    //   shooting -= 1;
    // }
    // if(spawnTime <= 0){
    //   loadJson();
    //   spawnTime += 100
    // }
    // spawnTime -= 1

    renderer.render( scene, camera );

}
