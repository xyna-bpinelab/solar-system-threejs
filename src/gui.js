import GUI from 'lil-gui';
import { config } from './config.js';
import { createCameraController } from './cameraController.js';

// lil-gui パネルを構築する。
// 「時間」「拡大表示」は config オブジェクトへ直接バインドしており、
// アニメーションループ側は毎フレーム config を読むだけなので特別な
// 同期処理は不要。「視点」は cameraController 経由でカメラ・注視点を操作する。
export function createGui(solarSystem, engine) {
  const gui = new GUI({ title: 'コントロールパネル' });

  const bodies = {
    sun: solarSystem.sun.mesh,
    earth: solarSystem.earth.mesh,
    moon: solarSystem.moon.mesh,
  };
  const cameraController = createCameraController(engine, bodies);

  const timeFolder = gui.addFolder('時間');
  timeFolder.add(config.time, 'paused').name('一時停止');
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

  const viewFolder = gui.addFolder('視点（画面中心に置く天体・仰角）');
  viewFolder
    .add(cameraController.viewState, 'centerBody', { 太陽: 'sun', 地球: 'earth', 月: 'moon' })
    .name('中心天体')
    .onChange((name) => cameraController.setOrbitTarget(name));
  viewFolder
    .add(cameraController.viewState, 'elevationDeg', -85, 85, 1)
    .name('仰角（度）')
    .onChange(() => cameraController.refreshElevation());

  const presetFolder = gui.addFolder('視点プリセット（○○から××を見る）');
  presetFolder
    .add({ run: () => cameraController.setViewpoint('earth', 'sun') }, 'run')
    .name('地球から太陽を見る');
  presetFolder
    .add({ run: () => cameraController.setViewpoint('earth', 'moon') }, 'run')
    .name('地球から月を見る');
  presetFolder
    .add({ run: () => cameraController.setViewpoint('moon', 'earth') }, 'run')
    .name('月から地球を見る');
  presetFolder
    .add({ run: () => cameraController.setViewpoint('moon', 'sun') }, 'run')
    .name('月から太陽を見る');

  return { gui, cameraController };
}
