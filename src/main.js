import * as THREE from 'three';
import { createEngine } from './scene.js';
import { createSolarSystem } from './solarSystem.js';
import { createGui } from './gui.js';
import './style.css';

const container = document.querySelector('#app');
const engine = createEngine(container);
const { scene, camera, renderer, controls } = engine;
const solarSystem = createSolarSystem(scene);

createGui(solarSystem, engine);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  solarSystem.update(clock.getDelta());
  controls.update();
  renderer.render(scene, camera);
}

animate();
