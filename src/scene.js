import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { config } from './config.js';

// レンダリングに必要な scene / camera / renderer / controls をまとめて構築する。
// resize への追従もここで完結させ、main.js からは呼び出すだけで良い状態にする。
export function createEngine(container) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    config.camera.fov,
    container.clientWidth / container.clientHeight,
    config.camera.near,
    config.camera.far,
  );
  const { x: cx, y: cy, z: cz } = config.camera.initialPosition;
  camera.position.set(cx, cy, cz);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  const { x: tx, y: ty, z: tz } = config.camera.initialTarget;
  controls.target.set(tx, ty, tz);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 1;
  controls.maxDistance = config.camera.far * 0.9;
  controls.update();

  // 完全な暗闇を避けるための最低限の環境光（太陽の PointLight が主光源）
  scene.add(new THREE.AmbientLight(0xffffff, 0.05));

  function handleResize() {
    const { clientWidth: width, clientHeight: height } = container;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', handleResize);

  return {
    scene,
    camera,
    renderer,
    controls,
    dispose: () => window.removeEventListener('resize', handleResize),
  };
}
