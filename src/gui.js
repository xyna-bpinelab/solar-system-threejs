import GUI from 'lil-gui';
import { config, SUN, PLANETS, MOON, TOGGLE_BODY_NAMES, DEFAULT_VIEW } from './config.js';
import { createCameraController } from './cameraController.js';

const LABELS = { [SUN.name]: SUN.label, [MOON.name]: MOON.label };
for (const planet of PLANETS) LABELS[planet.name] = planet.label;

const ZOOM_MIN_DISTANCE = 1;
const ZOOM_MAX_DISTANCE = config.camera.maxZoomDistance; // scene.js の controls.maxDistance と一致させる
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
// 注視点を操作する。ズーム・仰角はマウス操作（ホイール／左ドラッグでの回転）
// でも変化するため、毎フレーム syncViewControls() でスライダー表示を追従させる。
export function createGui(solarSystem, engine, { starfield }) {
  const gui = new GUI({ title: 'コントロールパネル' });

  const bodies = { [SUN.name]: solarSystem.sun.mesh, [MOON.name]: solarSystem.moon.mesh };
  for (const name in solarSystem.planets) bodies[name] = solarSystem.planets[name].body.mesh;
  const cameraController = createCameraController(engine, bodies);

  const sizeControllers = {};

  // resetToDefaults は下で定義するが、常に先頭に置いて
  // 「いつでも簡単に戻れる」ようにするため、ここで先にボタンを追加する
  // （関数宣言はホイスティングされるため、定義前でも参照できる）。
  gui.add({ resetToDefaults: () => resetToDefaults() }, 'resetToDefaults').name('デフォルト表示に戻す');

  const timeFolder = gui.addFolder('時間').close();
  timeFolder.add(config.time, 'paused').name('一時停止');
  const speedController = timeFolder.add(config.time, 'speed', 0, 200, 1).name('速度 (日/秒)');

  const displayFolder = gui.addFolder('表示オプション').close();
  displayFolder
    .add(config.display, 'labelsVisible')
    .name('天体名ラベル')
    .onChange(() => solarSystem.applyVisibility());
  displayFolder
    .add(config.display, 'orbitLinesVisible')
    .name('軌道線（太陽-惑星・地球-月）')
    .onChange(() => solarSystem.applyVisibility());
  displayFolder
    .add(config.display, 'starsVisible')
    .name('星空背景')
    .onChange(() => {
      starfield.visible = config.display.starsVisible;
    });
  starfield.visible = config.display.starsVisible;

  const bodyFolder = gui.addFolder('天体ごとの表示・拡大設定').close();
  for (const name of TOGGLE_BODY_NAMES) {
    const sub = bodyFolder.addFolder(LABELS[name]).close();
    sub.add(config.visibility, name).name('表示').onChange(() => solarSystem.applyVisibility());
    const maxMultiplier = name === MOON.name ? 80 : 30;
    sizeControllers[name] = sub
      .add(config.scale.sizeMultiplier, name, 1, maxMultiplier, 1)
      .name('サイズ倍率')
      .onChange(() => solarSystem.applyScale());
  }

  const viewFolder = gui.addFolder('視点（画面中心に置く天体・仰角）').close();
  const centerOptions = { [SUN.label]: SUN.name, ...Object.fromEntries(TOGGLE_BODY_NAMES.map((n) => [LABELS[n], n])) };
  const centerBodyController = viewFolder
    .add(cameraController.viewState, 'centerBody', centerOptions)
    .name('中心天体')
    .onChange((name) => cameraController.setOrbitTarget(name));
  const elevationController = viewFolder
    .add(cameraController.viewState, 'elevationDeg', -85, 85, 1)
    .name('仰角（度）')
    .onChange(() => cameraController.refreshElevation());

  const zoomState = { value: distanceToSlider(cameraController.getDistance()) };
  const zoomController = viewFolder
    .add(zoomState, 'value', 0, ZOOM_SLIDER_MAX, 1)
    .name('ズーム')
    .onChange((value) => cameraController.setDistance(sliderToDistance(value)));

  // マウス操作（ホイールでのズーム、左ドラッグでの回転＝仰角変更）でも
  // カメラは変化するため、毎フレーム現在のカメラ状態からスライダー表示を
  // 計算し直す。
  function syncViewControls() {
    const zoomValue = distanceToSlider(cameraController.getDistance());
    if (Math.abs(zoomValue - zoomState.value) > 0.5) {
      zoomState.value = zoomValue;
      zoomController.updateDisplay();
    }

    const elevationValue = cameraController.getElevationDeg();
    if (Math.abs(elevationValue - cameraController.viewState.elevationDeg) > 0.1) {
      cameraController.viewState.elevationDeg = elevationValue;
      elevationController.updateDisplay();
    }
  }

  // DEFAULT_VIEW（config.js）に定義された初期表示値を復元する。
  // 起動直後の状態を作るのにも、「デフォルト表示に戻す」ボタンにも使う
  // ——両者がずれないよう、この関数だけを唯一の適用経路にする。
  function resetToDefaults() {
    config.time.speed = DEFAULT_VIEW.timeSpeed;
    speedController.updateDisplay();

    for (const name in DEFAULT_VIEW.sizeMultiplier) {
      config.scale.sizeMultiplier[name] = DEFAULT_VIEW.sizeMultiplier[name];
      sizeControllers[name]?.updateDisplay();
    }
    solarSystem.applyScale();

    cameraController.viewState.elevationDeg = DEFAULT_VIEW.elevationDeg;
    cameraController.setOrbitTarget(DEFAULT_VIEW.centerBody);
    cameraController.setDistance(DEFAULT_VIEW.zoomDistance);
    centerBodyController.updateDisplay();
    elevationController.updateDisplay();
    syncViewControls();
  }

  resetToDefaults();

  return { gui, cameraController, syncViewControls };
}
