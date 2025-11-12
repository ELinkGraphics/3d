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

  // 🌈 Soft gradient background (sky)
  const topColor = new THREE.Color(0xb5d9ff); // sky blue
  const bottomColor = new THREE.Color(0xf2f6ff); // soft white-blue
  const uniforms = {
    topColor: { value: topColor },
    bottomColor: { value: bottomColor },
  };
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
  const gradientMat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    side: THREE.BackSide,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 15), gradientMat);
  scene.add(sky);

  // 📷 Camera setup
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.3, 5);

  // 🖥️ Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  // 🎮 Orbit Controls (disabled zoom)
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;

  // 💡 Lighting (soft 3-point light setup)
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(5, 5, 5);
  keyLight.castShadow = true;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x99ccff, 1);
  rimLight.position.set(-5, 3, -3);
  scene.add(rimLight);

  // 🧸 Model Loader
  const loader = new GLTFLoader();
  loader.load("/model.glb", (gltf) => {
    model = gltf.scene;
    model.scale.set(1.2, 1.2, 1.2);
    model.position.set(0, -0.7, 0);
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // add subtle material tweak
        child.material.envMapIntensity = 0.8;
        child.material.metalness = 0.2;
        child.material.roughness = 0.4;
      }
    });
    scene.add(model);
  });

  // ✨ Floating Glass Text
  const fontLoader = new FontLoader();
  fontLoader.load(
    "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
    (font) => {
      const textGeo = new TextGeometry("Little Tigers 3D", {
        font,
        size: 0.45,
        height: 0.1,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.008,
        bevelSegments: 5,
      });

      const textMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.3,
        roughness: 0.1,
        transmission: 0.6, // makes it glassy
        opacity: 1,
        transparent: true,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      });

      const textMesh = new THREE.Mesh(textGeo, textMat);
      textMesh.position.set(-1.6, 1.6, 0);
      textMesh.rotation.y = 0.1;
      textMesh.castShadow = true;
      scene.add(textMesh);

      // Gentle floating animation for text
      gsap.to(textMesh.position, {
        y: "+=0.1",
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
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

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // Smooth idle rotation
  if (model && idleRotation && !isSayingHi) {
    model.rotation.y += 0.003;
  }

  renderer.render(scene, camera);
}
