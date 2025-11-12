import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import gsap from "gsap";

let scene, camera, renderer, composer, controls;
let jungle, character;
let isSayingHi = false;
let idleRotation = true;
let clock = new THREE.Clock();

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbad6ff);
  scene.fog = new THREE.Fog(0xbad6ff, 10, 60);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 1.8, 8);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.4;

  // 🌤️ Balanced natural lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(8, 15, 10);
  sun.castShadow = true;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x99ccff, 0.4);
  fill.position.set(-8, 5, -6);
  scene.add(fill);

  // 🌫️ Fake ground contact shadow
  const groundMat = new THREE.ShadowMaterial({ opacity: 0.3 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.2;
  ground.receiveShadow = true;
  scene.add(ground);

  // 🌿 Load Jungle
  const loader = new GLTFLoader();
  loader.load("/jungle_environment.glb",
    (gltf) => {
      jungle = gltf.scene;
      jungle.scale.set(3, 3, 3);
      jungle.position.set(0, -1.2, 0);
      jungle.traverse((obj) => {
        if (obj.isMesh) {
          obj.receiveShadow = true;
          obj.material.roughness = 1;
          obj.material.metalness = 0.1;
        }
      });
      scene.add(jungle);
    },
    undefined,
    (error) => console.error("Error loading jungle:", error)
  );

  // 🧸 Load Character
  loader.load("/model.glb",
    (gltf) => {
      character = gltf.scene;
      character.scale.set(1.6, 1.6, 1.6);
      character.position.set(0, -1.1, 0);
      character.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material.metalness = 0.3;
          child.material.roughness = 0.5;
        }
      });
      scene.add(character);
    },
    undefined,
    (error) => console.error("Error loading model:", error)
  );

  // ✨ Simple bloom (safe)
  const renderScene = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.4,
    0.5,
    0.1
  );
  composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

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
  gsap.timeline({
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

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  if (character && idleRotation && !isSayingHi) {
    character.rotation.y += 0.002;
  }

  composer.render();
}
