import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const canvas = document.querySelector("#viewerCanvas");
const loading = document.querySelector("#loading");
const resetView = document.querySelector("#resetView");

if (!canvas) {
  throw new Error("Canvas #viewerCanvas не найден.");
}

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 0.5;
controls.maxDistance = 6;

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8a7a6a, 1.1);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(2, 4, 3);
scene.add(dirLight);

const loader = new GLTFLoader();
const modelPath = "foto/15_01_2026.glb";
let modelGroup = null;
let defaultCameraState = null;

loader.load(
  modelPath,
  (gltf) => {
    modelGroup = gltf.scene;
    scene.add(modelGroup);

    const box = new THREE.Box3().setFromObject(modelGroup);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    modelGroup.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fitDist = maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));

    camera.position.set(0, size.y * 0.15, fitDist * 1.2);
    camera.near = Math.max(fitDist / 100, 0.01);
    camera.far = fitDist * 10;
    camera.updateProjectionMatrix();

    controls.target.set(0, 0, 0);
    controls.update();

    defaultCameraState = {
      position: camera.position.clone(),
      target: controls.target.clone(),
    };

    loading.classList.add("hidden");
  },
  undefined,
  () => {
    loading.textContent = "Не удалось загрузить модель.";
  }
);

function resizeRenderer() {
  const { clientWidth, clientHeight } = canvas;
  renderer.setSize(clientWidth, clientHeight, false);
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
}

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

if (resetView) {
  resetView.addEventListener("click", () => {
    if (!defaultCameraState) {
      return;
    }
    camera.position.copy(defaultCameraState.position);
    controls.target.copy(defaultCameraState.target);
    controls.update();
  });
}

window.addEventListener("resize", resizeRenderer);
resizeRenderer();
animate();
