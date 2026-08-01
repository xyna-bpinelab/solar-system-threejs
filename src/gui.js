import * as THREE from 'three';
import GUI from 'lil-gui';
import { config } from './config.js';

const worldPosition = new THREE.Vector3();

// カメラを対象の天体へ、その現在のスケール済み半径に応じた距離まで寄せる。
// 厳密な比率のままだと地球・月は俯瞰視点からは視認できないほど小さいため、
// サイズ倍率を変えなくても対象を素早く見つけられるようにするための機能。
function focusOn(mesh, { camera, controls }) {
  mesh.getWorldPosition(worldPosition);
  const scaledRadius = mesh.geometry.parameters.radius * mesh.scale.x;
  const distance = scaledRadius * 6 + 2;

  camera.position.set(
    worldPosition.x + distance,
    worldPosition.y + distance * 0.6,
    worldPosition.z + distance,
  );
  controls.target.copy(worldPosition);
  controls.update();
}

// lil-gui パネルを構築し、config オブジェクトへ直接バインドする。
// アニメーションループ（solarSystem.update）は毎フレーム config を読むだけなので、
// ここでの変更は特別な同期処理なしに反映される。
export function createGui(solarSystem, engine) {
  const gui = new GUI({ title: 'コントロールパネル' });

  const timeFolder = gui.addFolder('時間');
  const pausedController = timeFolder.add(config.time, 'paused').name('一時停止');
  timeFolder.add(config.time, 'speed', 0, 200, 1).name('速度 (日/秒)');

  const scaleFolder = gui.addFolder('拡大表示（距離はそのまま・見た目のサイズだけ変更）');
  scaleFolder
    .add(config.scale.sizeMultiplier, 'earth', 1, 30, 1)
    .name('地球サイズ倍率')
    .onChange(() => solarSystem.applyScale());
  scaleFolder
    .add(config.scale.sizeMultiplier, 'moon', 1, 80, 1)
    .name('月サイズ倍率')
    .onChange(() => solarSystem.applyScale());

  // フォーカス時点で自動的に一時停止する。再生したままだと、近距離まで
  // 寄った直後に公転で対象がフレームアウトしてしまうため。
  function focusAndPause(mesh) {
    config.time.paused = true;
    pausedController.updateDisplay();
    focusOn(mesh, engine);
  }

  const viewFolder = gui.addFolder('視点');
  viewFolder.add({ focusSun: () => focusAndPause(solarSystem.sun.mesh) }, 'focusSun').name('太陽を見る');
  viewFolder.add({ focusEarth: () => focusAndPause(solarSystem.earth.mesh) }, 'focusEarth').name('地球を見る');
  viewFolder.add({ focusMoon: () => focusAndPause(solarSystem.moon.mesh) }, 'focusMoon').name('月を見る');

  return gui;
}
