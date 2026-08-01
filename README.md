# solar-system-threejs

Three.js を用いた、太陽・地球・月の公転・自転を可視化する 3D シミュレーション。

## セットアップ

```bash
npm install
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
```

## 構成

```
src/
  config.js        物理比率・時間スケール・カメラ・マテリアルの設定を集約
  CelestialBody.js  天体（メッシュ・マテリアル・自転）を表すクラス
  scene.js          scene / camera / renderer / OrbitControls / resize 対応
  solarSystem.js    太陽・地球+月グループの階層構造とフレーム更新ロジック
  main.js           初期化とアニメーションループ
```

## スケール・速度パラメータについて

`src/config.js` に定義された定数がすべての基準値。

- **半径比・距離比**（`RADIUS_RATIO` / `DISTANCE_RATIO`）: 要件で指定された
  厳密な比率（太陽 109 / 地球 1 / 月 0.27、太陽-地球 23,481 / 地球-月 60、
  いずれも地球半径基準）をそのままロジックに使用している。
- **`config.scale.sizeMultiplier` / `distanceMultiplier`**: 上記の厳密比率に
  掛け合わせる倍率で、既定値はすべて `1`（＝厳密な比率のまま）。
  地球・月は太陽との比率上非常に小さく肉眼では視認しづらいため、
  将来 GUI（lil-gui 等）から `sizeMultiplier.earth` / `sizeMultiplier.moon`
  などを大きくするだけで、距離関係を保ったまま天体を拡大表示できる。
- **`config.time.speed`**: 実時間1秒あたりに進めるシミュレーション上の
  日数。地球公転 365 日・自転 1 日・月の公転/自転 27.3 日という実際の
  周期比をそのまま `PERIOD_DAYS` に保持し、この `speed` を掛けて
  アニメーションの進み方を制御する（`config.time.paused` で一時停止も可能）。
- **`config.camera` / マウス操作**: 既定カメラは系全体を見渡せる俯瞰位置。
  真の比率のままだと地球・月は極小に見えるため、OrbitControls による
  ズームイン/アウトで対象に近づいて観察する想定。
