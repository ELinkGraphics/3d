import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";

let scene, camera, renderer, model, controls, isSayingHi = false;

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#e6edf3");

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.5, 3);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = false;

  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5, 10, 7.5);
  scene.add(dir);

  const loader = new GLTFLoader();
  loader.load("/model.glb", (gltf) => {
    model = gltf.scene;
    model.scale.set(1, 1, 1);
    scene.add(model);
  });

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("resize", onResize);
}

function onMouseMove(e) {
  if (!model || isSayingHi) return;
  const mx = (e.clientX / window.innerWidth) * 2 - 1;
  const my = -(e.clientY / window.innerHeight) * 2 + 1;
  if (Math.sqrt(mx * mx + my * my) < 0.2) sayHi();
}

function sayHi() {
  isSayingHi = true;
  gsap.timeline({ onComplete: () => (isSayingHi = false) })
    .to(model.rotation, { y: "+=0.5", duration: 0.3, ease: "power1.inOut" })
    .to(model.rotation, { y: "-=1.0", duration: 0.6, ease: "power1.inOut" })
    .to(model.rotation, { y: "+=0.5", duration: 0.3, ease: "power1.inOut" });
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
