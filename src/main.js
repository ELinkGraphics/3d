import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";

let scene, camera, renderer, controls;
let jungle, character;
let isSayingHi = false;
let idleRotation = true;

init();
animate();

function init() {
  scene = new THREE.Scene();

  // 🌤 Ambient fog for depth
  scene.fog = new THREE.Fog(0xa0d0a0, 10, 50);

  // 🎥 Camera
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 2, 8);

  // 🖥 Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  // 🎮 Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.4;

  // 💡 Lighting setup (soft natural)
  const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x202020, 1.5);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
  dirLight.position.set(5, 10, 2);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  scene.add(dirLight);

  // 🌿 Load Jungle Environment
  const gltfLoader = new GLTFLoader();
  gltfLoader.load("/jungle_environment.glb", (gltf) => {
    jungle = gltf.scene;
    jungle.scale.set(3, 3, 3);
    jungle.position.set(0, -2, 0);
    jungle.traverse((child) => {
      if (child.isMesh) {
        child.receiveShadow = true;
        child.castShadow = false;
        if (child.material) {
          child.material.roughness = 1;
          child.material.metalness = 0.1;
        }
      }
    });
    scene.add(jungle);
  });

  // 🧸 Load Character Model
  const charLoader = new GLTFLoader();
  charLoader.load("/model.glb", (gltf) => {
    character = gltf.scene;
    character.scale.set(1.5, 1.5, 1.5);
    character.position.set(0, -1.1, 0);
    character.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.metalness = 0.2;
          child.material.roughness = 0.5;
        }
      }
    });
    scene.add(character);
  });

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
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // Gentle idle motion
  if (character && idleRotation && !isSayingHi) {
    character.rotation.y += 0.002;
  }

  renderer.render(scene, camera);
}
