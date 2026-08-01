import GUI from 'lil-gui';
import { config, SUN, PLANETS, MOON, TOGGLE_BODY_NAMES } from './config.js';
import { createCameraController } from './cameraController.js';

const LABELS = { [SUN.name]: SUN.label, [MOON.name]: MOON.label };
for (const planet of PLANETS) LABELS[planet.name] = planet.label;

// lil-gui パネルを構築する。
// 「時間」「天体ごとの表示・拡大設定」は config オブジェクトへ直接バインド
// しており、アニメーションループ側は毎フレーム config を読むだけなので
// 特別な同期処理は不要。「視点」は cameraController 経由でカメラ・注視点を操作する。
export function createGui(solarSystem, engine) {
  const gui = new GUI({ title: 'コントロールパネル' });

  const bodies = { [SUN.name]: solarSystem.sun.mesh, [MOON.name]: solarSystem.moon.mesh };
  for (const name in solarSystem.planets) bodies[name] = solarSystem.planets[name].body.mesh;
  const cameraController = createCameraController(engine, bodies);

  const timeFolder = gui.addFolder('時間');
  timeFolder.add(config.time, 'paused').name('一時停止');
  timeFolder.add(config.time, 'speed', 0, 200, 1).name('速度 (日/秒)');

  const bodyFolder = gui.addFolder('天体ごとの表示・拡大設定');
  for (const name of TOGGLE_BODY_NAMES) {
    const sub = bodyFolder.addFolder(LABELS[name]);
    sub.add(config.visibility, name).name('表示').onChange(() => solarSystem.applyVisibility());
    const maxMultiplier = name === MOON.name ? 80 : 30;
    sub
      .add(config.scale.sizeMultiplier, name, 1, maxMultiplier, 1)
      .name('サイズ倍率')
      .onChange(() => solarSystem.applyScale());
  }

  const viewFolder = gui.addFolder('視点（画面中心に置く天体・仰角）');
  const centerOptions = { [SUN.label]: SUN.name, ...Object.fromEntries(TOGGLE_BODY_NAMES.map((n) => [LABELS[n], n])) };
  viewFolder
    .add(cameraController.viewState, 'centerBody', centerOptions)
    .name('中心天体')
    .onChange((name) => cameraController.setOrbitTarget(name));
  viewFolder
    .add(cameraController.viewState, 'elevationDeg', -85, 85, 1)
    .name('仰角（度）')
    .onChange(() => cameraController.refreshElevation());

  return { gui, cameraController };
}
