import * as THREE from 'three';
import { createEngine } from './scene.js';
import { createSolarSystem } from './solarSystem.js';
import './style.css';

const container = document.querySelector('#app');
const { scene, camera, renderer, controls } = createEngine(container);
const solarSystem = createSolarSystem(scene);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  solarSystem.update(clock.getDelta());
  controls.update();
  renderer.render(scene, camera);
}

animate();
