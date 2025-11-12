import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import gsap from "gsap";

let scene, camera, renderer, model, controls;
let isSayingHi = false;
let idleRotation = true;

init();
animate();

function init() {
  scene = new THREE.Scene();

  // 🌤️ Sky-like gradient background
  const topColor = new THREE.Color(0xbfd9ff); // light sky blue
  const bottomColor = new THREE.Color(0xe6edf3); // pale horizon
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const fragmentShader = `
    varying vec2 vUv;
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    void main() {
      gl_FragColor = vec4(mix(bottomColor, topColor, vUv.y), 1.0);
    }
  `;
  const gradientMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      topColor: { value: topColor },
      bottomColor: { value: bottomColor },
    },
    side: THREE.BackSide,
  });
  const skyGeo = new THREE.SphereGeometry(50, 32, 15);
  const sky = new THREE.Mesh(skyGeo, gradientMaterial);
  scene.add(sky);

  // 🎥 Camera setup
  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 1.3, 5);

  // 🖥️ Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  // 🎮 Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = false;

  // 💡 Lighting
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // 🧸 Load the 3D model
  const loader = new GLTFLoader();
  loader.load("/model.glb", (gltf) => {
    model = gltf.scene;
    model.scale.set(1, 1, 1);
    model.position.set(0, -0.5, 0);
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(model);
  });

  // 🔤 3D Text
  const fontLoader = new FontLoader();
  fontLoader.load(
    "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
    (font) => {
      const textGeometry = new TextGeometry("Little Tigers 3D", {
        font: font,
        size: 0.3,
        height: 0.05,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.005,
        bevelOffset: 0,
        bevelSegments: 5,
      });
      const textMaterial = new THREE.MeshStandardMaterial({
        color: 0x2f3542,
        metalness: 0.2,
        roughness: 0.4,
      });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(-1.3, 1.5, 0);
      textMesh.castShadow = true;
      scene.add(textMesh);
    }
  );

  // 🖱️ Events
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
  if (!model) return;
  isSayingHi = true;
  idleRotation = false;

  gsap
    .timeline({
      onComplete: () => {
        isSayingHi = false;
        idleRotation = true;
      },
    })
    .to(model.rotation, { y: "+=0.5", duration: 0.3, ease: "power1.inOut" })
    .to(model.rotation, { y: "-=1.0", duration: 0.6, ease: "power1.inOut" })
    .to(model.rotation, { y: "+=0.5", duration: 0.3, ease: "power1.inOut" });
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// 🎡 Idle rotation
function rotateIdle() {
  if (model && idleRotation && !isSayingHi) {
    model.rotation.y += 0.005; // smooth continuous rotation
  }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  rotateIdle();
  renderer.render(scene, camera);
}
