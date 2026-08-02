import * as THREE from 'three';
import { createEngine } from './scene.js';
import { createSolarSystem } from './solarSystem.js';
import { createGui } from './gui.js';
import './style.css';

const container = document.querySelector('#app');
const engine = createEngine(container);
const { scene, camera, renderer, labelRenderer, controls } = engine;
const solarSystem = createSolarSystem(scene);

const { cameraController, syncViewControls } = createGui(solarSystem, engine);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  solarSystem.update(clock.getDelta());
  cameraController.update();
  controls.update();
  syncViewControls();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

animate();
