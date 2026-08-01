import * as THREE from 'three';
import { CelestialBody } from './CelestialBody.js';
import {
  config,
  getRadius,
  getDistance,
  PERIOD_DAYS,
  EARTH_AXIAL_TILT_DEG,
} from './config.js';

const TWO_PI = Math.PI * 2;

// 太陽 / 地球+月グループ の階層構造を構築し、フレーム更新関数を返す。
//
// 階層:
//   scene
//   └ sun.mesh (+ PointLight)
//   └ earthOrbitPivot            … 太陽を中心とした地球+月グループの公転軸
//       └ earthMoonGroup         … 「地球+月」グループ（要件2の階層構造）
//           ├ earthTiltGroup     … 地球の自転軸傾斜（23.4度・固定）
//           │   └ earth.mesh     … 自転
//           └ moonOrbitPivot     … 地球を中心とした月の公転軸
//               └ moon.mesh      … 自転（公転と同周期＝潮汐固定）
export function createSolarSystem(scene) {
  const sun = new CelestialBody({
    name: 'sun',
    radius: getRadius('sun'),
    materialType: 'basic',
    color: config.materials.sun.color,
    texture: config.materials.sun.texture,
  });
  const sunLight = new THREE.PointLight(0xffffff, 3, 0, 0);
  sun.mesh.add(sunLight);
  scene.add(sun.mesh);

  const earthOrbitPivot = new THREE.Group();
  scene.add(earthOrbitPivot);

  const earthMoonGroup = new THREE.Group();
  earthMoonGroup.position.x = getDistance('sunToEarth');
  earthOrbitPivot.add(earthMoonGroup);

  const earthTiltGroup = new THREE.Group();
  earthTiltGroup.rotation.z = THREE.MathUtils.degToRad(EARTH_AXIAL_TILT_DEG);
  earthMoonGroup.add(earthTiltGroup);

  const earth = new CelestialBody({
    name: 'earth',
    radius: getRadius('earth'),
    color: config.materials.earth.color,
    texture: config.materials.earth.texture,
  });
  earthTiltGroup.add(earth.mesh);

  const moonOrbitPivot = new THREE.Group();
  earthMoonGroup.add(moonOrbitPivot);

  const moon = new CelestialBody({
    name: 'moon',
    radius: getRadius('moon'),
    color: config.materials.moon.color,
    texture: config.materials.moon.texture,
  });
  moon.mesh.position.x = getDistance('earthToMoon');
  moonOrbitPivot.add(moon.mesh);

  function update(deltaSeconds) {
    if (config.time.paused) return;

    // timeScale: 実時間の経過を「シミュレーション上の日数」に変換する
    const deltaDays = deltaSeconds * config.time.speed;

    earthOrbitPivot.rotation.y += TWO_PI * (deltaDays / PERIOD_DAYS.earthOrbit);
    earth.spin(TWO_PI * (deltaDays / PERIOD_DAYS.earthRotation));
    moonOrbitPivot.rotation.y += TWO_PI * (deltaDays / PERIOD_DAYS.moonOrbit);
    moon.spin(TWO_PI * (deltaDays / PERIOD_DAYS.moonRotation));
  }

  return { sun, earth, moon, earthOrbitPivot, earthMoonGroup, moonOrbitPivot, update };
}
