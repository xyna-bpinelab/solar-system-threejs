import * as THREE from 'three';
import { CelestialBody } from './CelestialBody.js';
import { config, EARTH_RADIUS_UNIT, SUN, PLANETS, MOON } from './config.js';

const TWO_PI = Math.PI * 2;

// 太陽と各惑星の階層構造を構築し、フレーム更新関数を返す。
//
// 階層（惑星ごとに繰り返し）:
//   scene
//   └ sun.mesh (+ PointLight)
//   └ orbitPivot          … 太陽を中心とした公転軸
//       └ distanceGroup   … 太陽からの距離だけ離れた位置（惑星の子天体はここにぶら下げる）
//           └ tiltGroup   … 自転軸傾斜（固定）
//               └ mesh    … 自転
//
// 月だけは地球の distanceGroup にぶら下がる特別な子天体で、
// 「地球+月グループ」が太陽を公転する構造になっている。
export function createSolarSystem(scene) {
  // ジオメトリは厳密比率のみで固定生成し、GUI からのサイズ倍率変更は
  // mesh.scale で反映する（ジオメトリの再生成を避け、スライダー操作に
  // 即座に追従できるようにするため）。
  const sun = new CelestialBody({
    name: SUN.name,
    radius: EARTH_RADIUS_UNIT * SUN.radiusRatio,
    materialType: 'basic',
    color: SUN.color,
  });
  const sunLight = new THREE.PointLight(0xffffff, 3, 0, 0);
  sun.mesh.add(sunLight);
  scene.add(sun.mesh);

  const planets = {};
  for (const def of PLANETS) {
    const orbitPivot = new THREE.Group();
    scene.add(orbitPivot);

    const distanceGroup = new THREE.Group();
    distanceGroup.position.x = EARTH_RADIUS_UNIT * def.distanceRatio;
    orbitPivot.add(distanceGroup);

    const tiltGroup = new THREE.Group();
    tiltGroup.rotation.z = THREE.MathUtils.degToRad(def.tiltDeg);
    distanceGroup.add(tiltGroup);

    const body = new CelestialBody({
      name: def.name,
      radius: EARTH_RADIUS_UNIT * def.radiusRatio,
      color: def.color,
    });
    tiltGroup.add(body.mesh);

    planets[def.name] = { def, body, orbitPivot, distanceGroup };
  }

  const moonOrbitPivot = new THREE.Group();
  planets.earth.distanceGroup.add(moonOrbitPivot);

  const moon = new CelestialBody({
    name: MOON.name,
    radius: EARTH_RADIUS_UNIT * MOON.radiusRatio,
    color: MOON.color,
  });
  moon.mesh.position.x = EARTH_RADIUS_UNIT * MOON.distanceRatio;
  moonOrbitPivot.add(moon.mesh);

  // config.scale.sizeMultiplier の現在値をメッシュのスケールに反映する。
  // GUI のサイズ倍率スライダーから呼び出され、ジオメトリの再生成なしで
  // 見た目のサイズを即座に更新できる。
  function applyScale() {
    sun.mesh.scale.setScalar(config.scale.sizeMultiplier.sun);
    for (const name in planets) {
      planets[name].body.mesh.scale.setScalar(config.scale.sizeMultiplier[name]);
    }
    moon.mesh.scale.setScalar(config.scale.sizeMultiplier.moon);
  }
  applyScale();

  // config.visibility の現在値をメッシュの表示/非表示に反映する。
  function applyVisibility() {
    for (const name in planets) {
      planets[name].body.mesh.visible = config.visibility[name];
    }
    moon.mesh.visible = config.visibility.moon;
  }
  applyVisibility();

  function update(deltaSeconds) {
    if (config.time.paused) return;

    // timeScale: 実時間の経過を「シミュレーション上の日数」に変換する
    const deltaDays = deltaSeconds * config.time.speed;

    for (const name in planets) {
      const { orbitPivot, body, def } = planets[name];
      orbitPivot.rotation.y += TWO_PI * (deltaDays / def.orbitDays);
      body.spin(TWO_PI * (deltaDays / def.rotationDays));
    }
    moonOrbitPivot.rotation.y += TWO_PI * (deltaDays / MOON.orbitDays);
    moon.spin(TWO_PI * (deltaDays / MOON.rotationDays));
  }

  return { sun, planets, moon, update, applyScale, applyVisibility };
}
