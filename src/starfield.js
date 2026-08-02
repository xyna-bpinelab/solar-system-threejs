import * as THREE from 'three';

// 球面上に一様分布させたランダムな点群で、背景の星を表現する。
// sizeAttenuation を無効にし、カメラからの距離によらず一定のピクセル
// サイズで描く（実際の星と同じく、どれだけズームしても大きさが変わらない）。
export function createStarfield({ count = 4000, radius }) {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // 球面上の一様分布（緯度方向の偏りを避けるため cos(phi) を一様乱数にする）
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.85 + Math.random() * 0.15);

    positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2,
    sizeAttenuation: false,
  });

  return new THREE.Points(geometry, material);
}
