import GUI from 'lil-gui';
import { config, SUN, PLANETS, MOON, TOGGLE_BODY_NAMES } from './config.js';
import { createCameraController } from './cameraController.js';

const LABELS = { [SUN.name]: SUN.label, [MOON.name]: MOON.label };
for (const planet of PLANETS) LABELS[planet.name] = planet.label;

const ZOOM_MIN_DISTANCE = 1;
const ZOOM_MAX_DISTANCE = config.camera.far * 0.9; // scene.js の controls.maxDistance と一致させる
const ZOOM_SLIDER_MAX = 1000;
const ZOOM_LOG_RANGE = Math.log(ZOOM_MAX_DISTANCE / ZOOM_MIN_DISTANCE);

// ズームは近距離（天体のすぐそば）から遠距離（海王星の軌道の外側）まで
// 6桁以上に及ぶため、線形スライダーでは近距離側の操作性が悪くなる。
// スライダー位置 0〜1000 を対数的に距離へマッピングする。
function sliderToDistance(value) {
  return ZOOM_MIN_DISTANCE * Math.exp(ZOOM_LOG_RANGE * (value / ZOOM_SLIDER_MAX));
}
function distanceToSlider(distance) {
  const clamped = Math.min(ZOOM_MAX_DISTANCE, Math.max(ZOOM_MIN_DISTANCE, distance));
  return (ZOOM_SLIDER_MAX * Math.log(clamped / ZOOM_MIN_DISTANCE)) / ZOOM_LOG_RANGE;
}

// lil-gui パネルを構築する。
// 「時間」「天体ごとの表示・拡大設定」「表示オプション」は config オブジェクトへ
// 直接バインドしており、アニメーションループ側は毎フレーム config を読むだけ
// なので特別な同期処理は不要。「視点」は cameraController 経由でカメラ・
// 注視点を操作する。ズームスライダーだけは、マウスホイールでの変更も
// 画面に反映する必要があるため、毎フレーム syncZoomSlider() で同期する。
export function createGui(solarSystem, engine) {
  const gui = new GUI({ title: 'コントロールパネル' });

  const bodies = { [SUN.name]: solarSystem.sun.mesh, [MOON.name]: solarSystem.moon.mesh };
  for (const name in solarSystem.planets) bodies[name] = solarSystem.planets[name].body.mesh;
  const cameraController = createCameraController(engine, bodies);

  const timeFolder = gui.addFolder('時間');
  timeFolder.add(config.time, 'paused').name('一時停止');
  timeFolder.add(config.time, 'speed', 0, 200, 1).name('速度 (日/秒)');

  const displayFolder = gui.addFolder('表示オプション');
  displayFolder
    .add(config.display, 'labelsVisible')
    .name('天体名ラベル')
    .onChange(() => solarSystem.applyVisibility());
  displayFolder
    .add(config.display, 'orbitLinesVisible')
    .name('軌道線（太陽-惑星）')
    .onChange(() => solarSystem.applyVisibility());

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

  const zoomState = { value: distanceToSlider(cameraController.getDistance()) };
  const zoomController = viewFolder
    .add(zoomState, 'value', 0, ZOOM_SLIDER_MAX, 1)
    .name('ズーム')
    .onChange((value) => cameraController.setDistance(sliderToDistance(value)));

  // マウスホイールによるズームもスライダーに反映されるよう、毎フレーム
  // 現在のカメラ距離からスライダー位置を計算し直す。
  function syncZoomSlider() {
    const value = distanceToSlider(cameraController.getDistance());
    if (Math.abs(value - zoomState.value) > 0.5) {
      zoomState.value = value;
      zoomController.updateDisplay();
    }
  }

  return { gui, cameraController, syncZoomSlider };
}
