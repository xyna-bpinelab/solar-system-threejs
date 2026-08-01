import * as THREE from 'three';

// 天体1つ分のメッシュ生成と自転操作をまとめるクラス。
// 太陽系以外の天体（例: 他惑星の追加）でも再利用できるよう汎用化してある。
export class CelestialBody {
  constructor({ name, radius, color, texture = null, materialType = 'standard' }) {
    this.name = name;
    this.radius = radius;

    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = createMaterial({ materialType, color, texture });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = name;
  }

  // 自転: 経過角度分だけ自軸（ローカルY軸）を回転させる
  spin(deltaAngle) {
    this.mesh.rotation.y += deltaAngle;
  }
}

function createMaterial({ materialType, color, texture }) {
  const params = { color };
  if (texture) params.map = texture;

  // 太陽: 自己発光風に光の影響を受けない MeshBasicMaterial
  if (materialType === 'basic') {
    return new THREE.MeshBasicMaterial(params);
  }

  // 地球・月: 光源の影響を受ける MeshStandardMaterial
  return new THREE.MeshStandardMaterial(params);
}
