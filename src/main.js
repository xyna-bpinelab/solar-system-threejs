import * as THREE from 'three';
import { createEngine } from './scene.js';
import { createSolarSystem } from './solarSystem.js';
import { createStarfield } from './starfield.js';
import { createGui } from './gui.js';
import { STARFIELD_RADIUS } from './config.js';
import './style.css';

const container = document.querySelector('#app');
const engine = createEngine(container);
const { scene, camera, renderer, labelRenderer, controls } = engine;
const solarSystem = createSolarSystem(scene);

const starfield = createStarfield({ radius: STARFIELD_RADIUS });
scene.add(starfield);

const { cameraController, syncViewControls } = createGui(solarSystem, engine, { starfield });

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
