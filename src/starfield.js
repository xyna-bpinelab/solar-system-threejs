import * as THREE from 'three';

// 頂点ごとに色（＝明るさ）とサイズを変えるための最小限のシェーダー。
// PointsMaterial は全点に単一のサイズ・色しか適用できないため、
// 星ごとの輝きの強弱を出すにはこのカスタムシェーダーが必要になる。
const VERTEX_SHADER = /* glsl */ `
  attribute float size;
  attribute vec3 starColor;
  varying vec3 vColor;
  void main() {
    vColor = starColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = size;
  }
`;
const FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  void main() {
    // デフォルトの点は正方形になるため、中心からの距離で角を切り落として丸くする
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    gl_FragColor = vec4(vColor, 1.0);
  }
`;

// 経度・緯度方向にいくつかの波を重ね、球面上に「濃い領域・薄い領域」の
// ムラを作る。実際の天の川のような分布を厳密に再現するものではないが、
// 完全な一様分布よりも自然な密度差を安価に表現できる。
function densityWeight(theta, phi) {
  const wave =
    Math.sin(theta * 2.3 + phi * 1.7) + Math.sin(theta * 0.9 - phi * 3.1) + Math.sin(phi * 4.2 + 0.6);
  return THREE.MathUtils.clamp(0.55 + wave / 6, 0.08, 1);
}

// 背景の星を表す点群を生成する。
// - 配置密度: densityWeight() による棄却サンプリングで濃淡をつける
// - 輝きの強弱: 明るさは指数分布に近い形で偏らせ、暗い星を多数・明るい星を
//   少数にする（実際の等級分布に近い見え方になる）。明るい星ほど心持ち
//   大きく・わずかに色味を持たせる。
export function createStarfield({ count = 5000, radius }) {
  const positions = [];
  const sizes = [];
  const colors = [];
  const color = new THREE.Color();

  const maxAttempts = count * 25;
  let attempts = 0;
  while (positions.length / 3 < count && attempts < maxAttempts) {
    attempts++;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    if (Math.random() > densityWeight(theta, phi)) continue;

    const r = radius * (0.85 + Math.random() * 0.15);
    positions.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));

    // 0〜1 を2乗して暗い側に偏らせる（暗い星が多く、明るい星ほど珍しい）
    const brightness = Math.pow(Math.random(), 2.2);
    const intensity = 0.25 + brightness * 0.75;
    sizes.push(1.2 + brightness * 3.5);

    // わずかに暖色・寒色に振って単調な白にしない
    const tint = 0.85 + Math.random() * 0.3;
    color.setRGB(intensity, intensity * (0.9 + Math.random() * 0.15), intensity * tint);
    colors.push(color.r, color.g, color.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('starColor', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: false,
  });

  return new THREE.Points(geometry, material);
}
