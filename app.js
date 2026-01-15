import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const canvas = document.querySelector("#viewerCanvas");
const loading = document.querySelector("#loading");
const resetView = document.querySelector("#resetView");
const modelSelect = document.querySelector("#modelSelect");

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
const models = [
  { label: "Модель 1", path: "foto/1/15_01_2026.glb" },
  { label: "Модель 2", path: "foto/2/15_01_2026.glb" },
  { label: "Модель 3", path: "foto/3/15_01_2026.glb" },
  { label: "Модель 4", path: "foto/4/15_01_2026.glb" },
  { label: "Модель 5", path: "foto/5/15_01_2026.glb" },
];
let modelGroup = null;
let defaultCameraState = null;

function disposeModel(object) {
  object.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (material.map) {
            material.map.dispose();
          }
          material.dispose();
        });
      }
    }
  });
}

function loadModel(index) {
  const entry = models[index] || models[0];
  loading.textContent = "Загружаю модель…";
  loading.classList.remove("hidden");

  if (modelGroup) {
    scene.remove(modelGroup);
    disposeModel(modelGroup);
    modelGroup = null;
  }

  loader.load(
    entry.path,
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
}

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

if (modelSelect) {
  modelSelect.addEventListener("change", (event) => {
    const index = Number(event.target.value);
    loadModel(index);
  });
}

window.addEventListener("resize", resizeRenderer);
resizeRenderer();
loadModel(0);
animate();
