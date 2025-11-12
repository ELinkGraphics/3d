import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass.js";
import gsap from "gsap";

let scene, camera, renderer, composer, controls;
let jungle, character;
let clock = new THREE.Clock();
let isSayingHi = false;
let idleRotation = true;

init();
animate();

function init() {
  // 🌍 Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd9ff);
  scene.fog = new THREE.FogExp2(0xaccfff, 0.035); // smooth atmospheric fade

  // 🎥 Camera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 1.8, 8);

  // 🖥 Renderer with tone mapping
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  // 🎮 Controls (limited orbit for cinematic feel)
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.minPolarAngle = Math.PI / 3;
  controls.maxPolarAngle = Math.PI / 1.8;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.4;

  // 💡 Lighting system
  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(10, 15, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const fillLight = new THREE.DirectionalLight(0x99ccff, 0.4);
  fillLight.position.set(-8, 5, -5);
  scene.add(fillLight);

  // 🌫 Soft contact shadow plane (fake ground)
  const groundMat = new THREE.ShadowMaterial({ opacity: 0.25 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.1;
  ground.receiveShadow = true;
  scene.add(ground);

  // 🌿 Load Jungle Environment
  const loader = new GLTFLoader();
  loader.load("/jungle_environment.glb", (gltf) => {
    jungle = gltf.scene;
    jungle.scale.set(3, 3, 3);
    jungle.position.set(0, -1.2, 0);
    jungle.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = true;
        obj.material.roughness = 1;
        obj.material.metalness = 0.05;
      }
    });
    scene.add(jungle);
  });

  // 🧸 Load Character Model
  loader.load("/model.glb", (gltf) => {
    character = gltf.scene;
    character.scale.set(1.6, 1.6, 1.6);
    character.position.set(0, -1.1, 0);
    character.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.metalness = 0.3;
          child.material.roughness = 0.4;
          child.material.envMapIntensity = 1.2;
        }
      }
    });
    scene.add(character);
  });

  // ✨ Post Processing System
  const renderScene = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.6, // strength
    0.8, // radius
    0.3  // threshold
  );
  const filmPass = new FilmPass(0.05, 0, 0, false);
  composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);
  composer.addPass(filmPass);

  // 🖱 Interaction
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("resize", onResize);
}

function onMouseMove(e) {
  if (!character || isSayingHi) return;
  const mx = (e.clientX / window.innerWidth) * 2 - 1;
  const my = -(e.clientY / window.innerHeight) * 2 + 1;
  if (Math.sqrt(mx * mx + my * my) < 0.2) sayHi();
}

function sayHi() {
  if (!character) return;
  isSayingHi = true;
  idleRotation = false;
  gsap
    .timeline({
      onComplete: () => {
        isSayingHi = false;
        idleRotation = true;
      },
    })
    .to(character.rotation, { y: "+=0.5", duration: 0.3, ease: "power1.inOut" })
    .to(character.rotation, { y: "-=1.0", duration: 0.6, ease: "power1.inOut" })
    .to(character.rotation, { y: "+=0.5", duration: 0.3, ease: "power1.inOut" });
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

// 🎬 Cinematic camera drift (slight float motion)
function cameraDrift() {
  const t = clock.getElapsedTime() * 0.2;
  camera.position.x = Math.sin(t) * 3;
  camera.position.z = 8 + Math.cos(t) * 2;
  camera.lookAt(0, 1.2, 0);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  cameraDrift();

  if (character && idleRotation && !isSayingHi) {
    character.rotation.y += 0.002;
  }

  composer.render();
}
