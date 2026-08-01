// 天体の物理比率・時間スケール・マテリアル・カメラ設定を1箇所に集約する。
// 将来 lil-gui / dat.gui から書き換える対象は `config` オブジェクトの値のみ。

// シーン内の1ユニット = 地球半径1（すべての半径・距離はこの単位の倍数として算出する）
export const EARTH_RADIUS_UNIT = 1;

// 半径比（基準: 地球 = 1）— 要件で指定された厳密な比率
export const RADIUS_RATIO = {
  sun: 109,
  earth: 1,
  moon: 0.27,
};

// 距離比（基準: 地球の半径）— 要件で指定された厳密な比率
export const DISTANCE_RATIO = {
  sunToEarth: 23481,
  earthToMoon: 60,
};

// 公転・自転周期（日）。月は地球に対し常に同じ面を向ける（潮汐固定）ため
// 公転周期と自転周期が一致する。
export const PERIOD_DAYS = {
  earthOrbit: 365,
  earthRotation: 1,
  moonOrbit: 27.3,
  moonRotation: 27.3,
};

export const EARTH_AXIAL_TILT_DEG = 23.4;

export const config = {
  scale: {
    // 半径・距離は RADIUS_RATIO / DISTANCE_RATIO の厳密な比率を基本スケールとし、
    // ここに掛け合わせる倍率のみで描画上のサイズ・距離を調整する。
    // 既定値は 1（＝厳密な比率のまま）。地球・月は太陽との比率上きわめて小さく
    // 視認しづらいため、将来 GUI から sizeMultiplier.earth / moon などを
    // 大きくすることで「拡大表示トグル」を実現できる構造にしてある。
    sizeMultiplier: {
      sun: 1,
      earth: 1,
      moon: 1,
    },
    distanceMultiplier: {
      sunToEarth: 1,
      earthToMoon: 1,
    },
  },
  time: {
    // 実時間1秒あたりに進めるシミュレーション上の日数
    speed: 20,
    paused: false,
  },
  materials: {
    // 実テクスチャ未適用時のダミーカラー。texture に画像を読み込んだ
    // THREE.Texture を渡すだけでテクスチャ付き表示に切り替えられる。
    sun: { color: 0xffcc33, texture: null },
    earth: { color: 0x2266cc, texture: null },
    moon: { color: 0xaaaaaa, texture: null },
  },
  camera: {
    fov: 45,
    near: 1,
    far: 200000,
    // 太陽・地球・月の3天体を一括で見渡せる固定オフセット位置
    initialPosition: { x: 0, y: 9000, z: 26000 },
    initialTarget: { x: 0, y: 0, z: 0 },
  },
};

export function getRadius(body) {
  return EARTH_RADIUS_UNIT * RADIUS_RATIO[body] * config.scale.sizeMultiplier[body];
}

export function getDistance(pair) {
  return EARTH_RADIUS_UNIT * DISTANCE_RATIO[pair] * config.scale.distanceMultiplier[pair];
}
