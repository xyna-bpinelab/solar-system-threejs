// 天体の物理比率・時間スケール・カメラ設定を1箇所に集約する。
// 将来 lil-gui / dat.gui から書き換える対象は `config` オブジェクトの値のみ。

// シーン内の1ユニット = 地球半径1（すべての半径・距離はこの単位の倍数として算出する）
export const EARTH_RADIUS_UNIT = 1;

export const SUN = {
  name: 'sun',
  label: '太陽',
  radiusRatio: 109,
  color: 0xffcc33,
};

// 太陽を公転する惑星。半径比・太陽からの距離比はいずれも地球半径基準の
// 厳密な比率、公転・自転周期は日単位の実際の値。
// 自転周期が負の値の惑星（金星・天王星）は逆行自転を表す。
export const PLANETS = [
  {
    name: 'mercury',
    label: '水星',
    radiusRatio: 0.383,
    distanceRatio: 9092,
    orbitDays: 87.97,
    rotationDays: 58.646,
    tiltDeg: 0.034,
    color: 0x9c8d7b,
  },
  {
    name: 'venus',
    label: '金星',
    radiusRatio: 0.949,
    distanceRatio: 16988,
    orbitDays: 224.7,
    rotationDays: -243.02,
    tiltDeg: 177.4,
    color: 0xd8b98a,
  },
  {
    name: 'earth',
    label: '地球',
    radiusRatio: 1,
    distanceRatio: 23481,
    orbitDays: 365,
    rotationDays: 1,
    tiltDeg: 23.4,
    color: 0x2266cc,
  },
  {
    name: 'mars',
    label: '火星',
    radiusRatio: 0.532,
    distanceRatio: 35778,
    orbitDays: 686.98,
    rotationDays: 1.026,
    tiltDeg: 25.19,
    color: 0xb1543a,
  },
  {
    name: 'jupiter',
    label: '木星',
    radiusRatio: 10.97,
    distanceRatio: 122202,
    orbitDays: 4332.59,
    rotationDays: 0.41354,
    tiltDeg: 3.13,
    color: 0xc9a679,
  },
  {
    name: 'saturn',
    label: '土星',
    radiusRatio: 9.14,
    distanceRatio: 225039,
    orbitDays: 10759.22,
    rotationDays: 0.44401,
    tiltDeg: 26.73,
    color: 0xe0c78a,
  },
  {
    name: 'uranus',
    label: '天王星',
    radiusRatio: 3.98,
    distanceRatio: 450965,
    orbitDays: 30688.5,
    rotationDays: -0.71833,
    tiltDeg: 97.77,
    color: 0x9fd4d6,
  },
  {
    name: 'neptune',
    label: '海王星',
    radiusRatio: 3.86,
    distanceRatio: 705730,
    orbitDays: 60182,
    rotationDays: 0.6713,
    tiltDeg: 28.32,
    color: 0x4d69bd,
  },
];

// 月は地球を公転する特別な子天体（潮汐固定のため公転周期＝自転周期）
export const MOON = {
  name: 'moon',
  label: '月',
  radiusRatio: 0.27,
  distanceRatio: 60,
  orbitDays: 27.3,
  rotationDays: 27.3,
  color: 0xaaaaaa,
};

// GUI の「表示/非表示」「サイズ倍率」チェック・スライダーの対象になる天体
// （太陽は光源を兼ねるため常時表示とし、対象に含めない）。
// 月は地球の次に並べて表示する。
export const TOGGLE_BODY_NAMES = PLANETS.flatMap((p) => (p.name === 'earth' ? [p.name, MOON.name] : [p.name]));

// 太陽から最も離れた惑星の軌道半径（海王星）。カメラの far 平面や
// ズーム最大距離を、天体データ側の変更にも自動で追従させるために使う。
export const MAX_ORBIT_DISTANCE_RATIO = Math.max(...PLANETS.map((p) => p.distanceRatio));

// 背景の星を配置する球の半径。ズームを最大まで引いてカメラが原点から
// 離れた状態でも、反対側の星までの距離が far 平面を超えないよう、
// MAX_ORBIT_DISTANCE_RATIO の 1.1 倍程度に抑える。
export const STARFIELD_RADIUS = MAX_ORBIT_DISTANCE_RATIO * 1.1;

// 起動時の初期表示値、および GUI の「デフォルト表示に戻す」ボタンが
// 復元する値。両者が食い違わないよう、この定数を唯一の情報源にする。
export const DEFAULT_VIEW = {
  timeSpeed: 5,
  centerBody: 'earth',
  elevationDeg: 5,
  zoomDistance: 350,
  sizeMultiplier: { earth: 1, moon: 1 },
};

function defaultSizeMultipliers() {
  const result = { sun: 1 };
  for (const planet of PLANETS) result[planet.name] = 1;
  result[MOON.name] = 1;
  Object.assign(result, DEFAULT_VIEW.sizeMultiplier);
  return result;
}

function defaultVisibility() {
  const result = {};
  for (const planet of PLANETS) result[planet.name] = true;
  result[MOON.name] = true;
  return result;
}

export const config = {
  scale: {
    // 半径は各天体の radiusRatio（厳密な比率）を基本スケールとし、
    // ここに掛け合わせる倍率のみで描画上のサイズを調整する。
    // 既定値は 1（＝厳密な比率のまま）。小さな天体は太陽・木星等との
    // 比率上きわめて視認しづらいため、GUI から sizeMultiplier.xxx を
    // 大きくすることで「拡大表示トグル」を実現できる構造にしてある。
    sizeMultiplier: defaultSizeMultipliers(),
  },
  time: {
    // 実時間1秒あたりに進めるシミュレーション上の日数
    speed: DEFAULT_VIEW.timeSpeed,
    paused: false,
  },
  // 各天体をシミュレーション画面に表示するかどうか
  visibility: defaultVisibility(),
  // 天体名ラベル・太陽-惑星の軌道線・背景の星空の全体表示切り替え
  display: {
    labelsVisible: true,
    orbitLinesVisible: true,
    starsVisible: true,
  },
  camera: {
    fov: 45,
    near: 1,
    // ズームを最大まで引いた状態で、原点付近を注視しつつ反対側にいる
    // 海王星を見ても far 平面でクリップされないだけの余裕を確保する
    // （最悪ケース: カメラ距離 maxZoomDistance + 反対側の海王星までの
    // 距離 MAX_ORBIT_DISTANCE_RATIO が far を超えないようにする）。
    far: MAX_ORBIT_DISTANCE_RATIO * 4,
    maxZoomDistance: MAX_ORBIT_DISTANCE_RATIO * 1.5,
    // 内側の岩石惑星（水星〜火星）を見渡せる固定オフセット位置。
    // 木星より外側の軌道は距離が桁違いに大きいため、初期表示では
    // 視野に収まらない（「中心天体」選択とズームで個別に観察する想定）。
    initialPosition: { x: 0, y: 15000, z: 45000 },
    initialTarget: { x: 0, y: 0, z: 0 },
  },
};
