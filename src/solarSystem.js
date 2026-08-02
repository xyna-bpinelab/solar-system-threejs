import * as THREE from 'three';
import { CelestialBody } from './CelestialBody.js';
import { createLabel } from './label.js';
import { config, EARTH_RADIUS_UNIT, SUN, PLANETS, MOON } from './config.js';

const TWO_PI = Math.PI * 2;

// 太陽から惑星までを結ぶ、控えめな点線。
function createOrbitLine(distance) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(distance, 0, 0),
  ]);
  // 距離によらず線1本あたりの点線の密度が揃うように、間隔を距離に比例させる。
  const dashSize = distance * 0.004;
  const material = new THREE.LineDashedMaterial({
    color: 0x556677,
    dashSize,
    gapSize: dashSize,
    transparent: true,
    opacity: 0.6,
  });
  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  return line;
}

// 天体メッシュの少し上（半径基準のオフセット）にラベルを添える。
function attachLabel(body, text) {
  const label = createLabel(text);
  label.position.set(0, body.radius * 1.5 + 0.2, 0);
  body.mesh.add(label);
  return label;
}

// 太陽と各惑星の階層構造を構築し、フレーム更新関数を返す。
//
// 階層（惑星ごとに繰り返し）:
//   scene
//   └ sun.mesh (+ PointLight, ラベル)
//   └ orbitPivot          … 太陽を中心とした公転軸
//       ├ orbitLine       … 太陽-惑星間の点線（orbitPivot の回転にそのまま追従する）
//       └ distanceGroup   … 太陽からの距離だけ離れた位置（惑星の子天体はここにぶら下げる）
//           └ tiltGroup   … 自転軸傾斜（固定）
//               └ mesh    … 自転、ラベル
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
  const sunLabel = attachLabel(sun, SUN.label);
  scene.add(sun.mesh);

  const planets = {};
  for (const def of PLANETS) {
    const orbitPivot = new THREE.Group();
    scene.add(orbitPivot);

    const distance = EARTH_RADIUS_UNIT * def.distanceRatio;
    const orbitLine = createOrbitLine(distance);
    orbitPivot.add(orbitLine);

    const distanceGroup = new THREE.Group();
    distanceGroup.position.x = distance;
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
    const label = attachLabel(body, def.label);

    planets[def.name] = { def, body, orbitPivot, distanceGroup, orbitLine, label };
  }

  const moonOrbitPivot = new THREE.Group();
  planets.earth.distanceGroup.add(moonOrbitPivot);

  const moon = new CelestialBody({
    name: MOON.name,
    radius: EARTH_RADIUS_UNIT * MOON.radiusRatio,
    color: MOON.color,
  });
  moon.mesh.position.x = EARTH_RADIUS_UNIT * MOON.distanceRatio;
  const moonLabel = attachLabel(moon, MOON.label);
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

  // config.visibility（天体ごと）と config.display（ラベル・軌道線の全体
  // 切り替え）の現在値を、メッシュ・ラベル・軌道線の表示/非表示に反映する。
  function applyVisibility() {
    for (const name in planets) {
      const { body, label, orbitLine } = planets[name];
      const visible = config.visibility[name];
      body.mesh.visible = visible;
      label.visible = visible && config.display.labelsVisible;
      orbitLine.visible = visible && config.display.orbitLinesVisible;
    }
    moon.mesh.visible = config.visibility.moon;
    moonLabel.visible = config.visibility.moon && config.display.labelsVisible;
    sunLabel.visible = config.display.labelsVisible;
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
