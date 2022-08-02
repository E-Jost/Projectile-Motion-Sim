//Ewan Jost
/*
-------CONTROLS-------
WASD - changes the theta and phi values
ZX - decrease/increase the initial velocity
1 - switch to launch cam (default)
2 - switch to target cam
3 - switch to chase cam
4 - switch to apex cam
L - launches the ball
R - resets the ball back to original position
*/
import * as THREE from 'https://cdn.skypack.dev/three@0.132.2/build/three.module.js';
/*
Because three.js is external lib firefox wouldnt let me run locally
so I had to use VS codes live server extension to run this program.
This might make it so you cant run it without configuring your machine
so it might be best to meet.
*/

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true});
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const width = window.innerWidth;
const height = window.innerHeight;
const div = document.getElementById('HUD');

//Camera References and Offsets
const LaunchCamera = new THREE.PerspectiveCamera(32, width/height, 1, 10000);
const LaunchCamXOffset = 0;
const LaunchCamYOffset = 3;
const LaunchCamZOffset = 15;
const TargetCamera = new THREE.PerspectiveCamera(32, width/height, 1, 10000);
const TargetCamYOffset = 3;
const TargetCamHorizontalOffset = 15;
const ChaseCamera = new THREE.PerspectiveCamera(32, width/height, 1, 10000);
const ChaseCamXOffset = 0;
const ChaseCamYOffset = 0.5;
const ChaseCamZOffset = 15;
const ApexCamera = new THREE.PerspectiveCamera(32, width/height, 1, 10000);
const ApexCamYOffset = 5;
let camera = LaunchCamera;

//Keyboard key values
const LKey = 76;
const WKey = 87;
const AKey = 65;
const SKey = 83;
const DKey = 68;
const ZKey = 90;
const XKey = 88;
const Key1 = 49;
const Key2 = 50;
const Key3 = 51;
const Key4 = 52;
const RKey = 82;

const maxPhiVal = 90;
const minPhiVal = 5;
const VIncrementVal = 10;
const timeIncrement = 0.1;
const sinkVal = -0.33;

const g = -9.81;
const kmhToms = 5/18;
const FPS = 1000/30;
const xAxis = new THREE.Vector3( 1, 0, 0 );
const yAxis = new THREE.Vector3( 0, 1, 0 );

let sphere;
let floor;
let rod;

let theta = 0;
let phi = 30;
let rodTheta = 0;
let rodPhi = 0;
let rodScale = 100;

let t = 0;
let lasty = 0;
let lastx = 0;
let lastz = 0;
let vy, vh, vx, vz;
let initialV = 100;
let fly = false;

let yHeight = 0;
let travelTime = 0;
let initialTime;

//init() initializes the cameras, lights, and populates the scene
function init()
{
    renderer.setSize(width, height);//Set size of canvas
    scene.background = new THREE.Color( 0x6973f5 );//Set the background to sky blue color
    /*
    Initialize the position of cameras
    */
    LaunchCamera.position.set(LaunchCamXOffset, LaunchCamYOffset, LaunchCamZOffset);
    ChaseCamera.position.set(ChaseCamXOffset, ChaseCamYOffset, ChaseCamZOffset);
    /*
    Populate Scene with geometry.
    */
    //SPHERE
    let geometry = new THREE.SphereGeometry(0.5, 32, 16 );
    let material = new THREE.MeshStandardMaterial( { color: 0x2d2e2d } );
    sphere = new THREE.Mesh( geometry, material );
    scene.add(sphere);
    //LAUNCH INDICATOR
    geometry = new THREE.CylinderGeometry(0, 0.1, 3, 32 );
    material = new THREE.MeshBasicMaterial( { color: "red" } );
    rod = new THREE.Mesh(geometry, material);
    rod.geometry.translate(0, 1.25, 0);
    scene.add(rod);
    //FLOOR
    let tex = new THREE.TextureLoader().load('minecraftgrass.jpg');
    tex.anisotropy = 64;
    tex.repeat.set(1000, 1000);
    tex.wrapT = THREE.RepeatWrapping;
    tex.wrapS = THREE.RepeatWrapping;
    geometry = new THREE.PlaneBufferGeometry(100000, 100000);
    material = new THREE.MeshLambertMaterial({ map: tex });
    floor = new THREE.Mesh(geometry, material);
    floor.position.set(0, -0.5, 0);
    floor.rotation.set(Math.PI / -2, 0, 0);
    scene.add(floor);
    /*
    Add lighting to the scene
    */
    //Ambient light for whole scene
    const light = new THREE.AmbientLight( 0x404040 );
    scene.add( light );
    //Add brighter light coming from above like a sun
    const sun = new THREE.DirectionalLight(0xffffcc);
    sun.position.set(0, 1, 0);
    scene.add(sun);
}

function animate()
{
    renderer.render(scene, camera);
    if(camera !== ChaseCamera)//chase cam does not track the ball
    {
        camera.lookAt(sphere.position);
    }
    if(fly)//if the ball is launched then do calculations
    {
        t = t + timeIncrement;
        //calculate new position
        let y = vy*t + 0.5*g*t*t;
        let x = vx * t;
        let z = vz * t;
        if(t >= travelTime)
        {
            fly = false;
            // Make the ball sink into the ground slightly
            let d = vh * travelTime;
            let x = d*Math.sin(toRadians(theta));
            let z = -d*Math.cos(toRadians(theta));
            sphere.position.set(x, sinkVal, z);
            ChaseCamera.position.set(x, ChaseCamYOffset+sinkVal, z+ChaseCamZOffset);
            logResults(d);
        }
        else
        {
            //update chase camera position
            ChaseCamera.translateY(y - lasty);
            ChaseCamera.translateX(x - lastx);
            ChaseCamera.translateZ(z - lastz);
            //update cannon ball position
            sphere.translateY(y - lasty);
            sphere.translateX(x - lastx);
            sphere.translateZ(z - lastz);
        }
        //Find max height reached during trajectory
        if(y > yHeight)
        {
            yHeight = y;
        }
        //remember last translations
        lasty = y;
        lastx = x;
        lastz = z;
    }
}

function onFrame()
{
    vy = initialV*kmhToms * Math.sin(toRadians(phi));
    vh = initialV*kmhToms * Math.cos(toRadians(phi));
    vx = vh * Math.sin(toRadians(theta));
    vz = -vh * Math.cos(toRadians(theta));
    travelTime = 2* vy/-g;

    updateHUD();
    setApexCam();
    setTargetCam();
    adjustLaunchIndicator();
    animate();
}

function startAnimation()
{
    setInterval(onFrame, FPS); //calls onFrame on the specified interval
}

//adjusts the position of the launch indicator each frame
function adjustLaunchIndicator()
{
    rod.rotateOnWorldAxis(yAxis, toRadians(rodTheta));//Undo previous y rotation
    rod.rotateOnWorldAxis(xAxis, toRadians(-rodPhi));//Undo previous x rotation
    rod.scale.set(1, -1 + -rodScale/1000, 1);//Undo previous scale
    rod.scale.set(1, 1 + initialV/1000, 1);//Apply new scale
    rod.rotateOnWorldAxis(xAxis, toRadians(phi - 90));//Apply new x rotation
    rod.rotateOnWorldAxis(yAxis, toRadians(-theta));//Apply new y rotation
    //remember previous adjustments
    rodScale = initialV;
    rodTheta = theta;
    rodPhi = phi - 90;
}

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event)
{
    let keyCode = event.which;
    if(keyCode === LKey)// L
    {
        fly = true;
        initialTime = (new Date).getTime();
    }
    else if(keyCode === WKey)// W
    {
        //increase phi
        if(phi < maxPhiVal)
        {
            phi++;
        }
    }
    else if(keyCode === AKey)// A
    {
        //turn counter clockwise
        theta--;
    }
    else if(keyCode === SKey)// S
    {
        if(phi > minPhiVal)
        {
            phi--;
        }
    }
    else if(keyCode === DKey)// D
    {
        theta++;
    }
    else if(keyCode === ZKey)// Z
    {
        //decrease launch velocity
        if(initialV > 1)
        {
            initialV = initialV - VIncrementVal;
        }
    }
    else if(keyCode === XKey)// X
    {
        //increase launch velocity
        initialV = initialV + VIncrementVal;
    }
    else if(keyCode === Key1)// 1
    {
        //change to camera 1
        camera = LaunchCamera;
    }
    else if(keyCode === Key2)// 2
    {
        //change to camera 2
        camera = TargetCamera;
    }
    else if(keyCode === Key3)// 3
    {
        //change to camera 3
        camera = ChaseCamera;
    }
    else if(keyCode === Key4)// 4
    {
        //change to camera 4
        camera = ApexCamera;
    }
    else if(keyCode === RKey)// R
    {
        //reset ball and variables
        reset();
    }
}

//sets the values displayed in the div
function updateHUD()
{
    div.textContent = 'Velocity = '+initialV+' km/h  |  Theta = '+(theta+360)%360 + '  |  Phi = '+phi;
}

//calculates the postion of the apex cam according to the users specifications
function setApexCam()
{
    let d = vh * (travelTime/2);
    let y = vy*(travelTime/2) + 0.5*g*(travelTime/2)*(travelTime/2);
    let x = d*Math.sin(toRadians(theta));
    let z = -d*Math.cos(toRadians(theta));
    ApexCamera.position.set(x, y+ApexCamYOffset, z);
}

//calculates the postion of the target cam according to the users specifications
function setTargetCam()
{
    let d = (vh * travelTime) + TargetCamHorizontalOffset;
    let x = d*Math.sin(toRadians(theta));
    let z = -d*Math.cos(toRadians(theta));
    TargetCamera.position.set(x, TargetCamYOffset, z);
}

//resets the position of the ball to the origin as well as key values
function reset()
{
    fly = false;
    lastx = 0;
    lasty = 0;
    lastz = 0;
    t = 0;
    yHeight = 0;

    sphere.position.set(0, 0, 0);
    ChaseCamera.position.set(ChaseCamXOffset, ChaseCamYOffset, ChaseCamZOffset);
}

//Called at the end of each launch
//prints details about the trajectory is si units
function logResults(d)
{
    console.log("--------------------------------");
    console.log("Max Height = "+yHeight);//(m)
    console.log("Distance = "+d);//(m)
    console.log("Real travel time = "+travelTime);//(s)
    console.log("Actual elapsed time = "+((new Date).getTime() - initialTime)/1000);//(s)
}

function toRadians(angle)
{
    return angle * (Math.PI / 180);
}

init();
startAnimation();