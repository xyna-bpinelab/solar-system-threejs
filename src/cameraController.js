import * as THREE from 'three';

const tmpA = new THREE.Vector3();

function worldPositionOf(mesh, out) {
  mesh.getWorldPosition(out);
  return out;
}

// 天体を間近で観察するのに適した距離（現在のスケール済み半径基準）
function defaultDistance(mesh) {
  return mesh.geometry.parameters.radius * mesh.scale.x * 6 + 2;
}

function sphericalOffset(distance, azimuthRad, elevationRad) {
  const horizontal = distance * Math.cos(elevationRad);
  return new THREE.Vector3(
    horizontal * Math.cos(azimuthRad),
    distance * Math.sin(elevationRad),
    horizontal * Math.sin(azimuthRad),
  );
}

// 選んだ天体を中心に、仰角を指定しながら自由に見て回るカメラモード。
// OrbitControls によるマウス操作（水平方向の回転・ズーム）は常に有効なまま、
// 対象が公転で移動した分だけカメラごと平行移動させて追従させる。
export function createCameraController({ scene, camera, controls }, bodies) {
  const viewState = { centerBody: 'sun', elevationDeg: 20 };
  let targetMesh = null;

  function applyOrbit({ recomputeDistance }) {
    scene.updateMatrixWorld();
    const targetPos = worldPositionOf(targetMesh, tmpA).clone();

    let distance;
    let azimuthRad;
    if (recomputeDistance) {
      distance = defaultDistance(targetMesh);
      azimuthRad = THREE.MathUtils.degToRad(45);
    } else {
      const offset = camera.position.clone().sub(targetPos);
      distance = offset.length() || defaultDistance(targetMesh);
      azimuthRad = Math.atan2(offset.z, offset.x);
    }

    const elevationRad = THREE.MathUtils.degToRad(viewState.elevationDeg);
    camera.position.copy(targetPos).add(sphericalOffset(distance, azimuthRad, elevationRad));
    controls.target.copy(targetPos);
    controls.update();
  }

  function setOrbitTarget(name) {
    viewState.centerBody = name;
    targetMesh = bodies[name];
    applyOrbit({ recomputeDistance: true });
  }

  function refreshElevation() {
    if (targetMesh) {
      applyOrbit({ recomputeDistance: false });
    }
  }

  // アニメーションループから毎フレーム呼び出す。
  // 対象の移動量だけカメラごと平行移動させ、ユーザーのマウス操作
  // （回転・ズーム）を保ったまま追従させる。
  function update() {
    if (!targetMesh) return;
    const targetPos = worldPositionOf(targetMesh, tmpA);
    const delta = targetPos.clone().sub(controls.target);
    controls.target.copy(targetPos);
    camera.position.add(delta);
  }

  // 現在のカメラ-注視点間の距離（＝マウスホイールのズームと同じ量）。
  function getDistance() {
    return camera.position.distanceTo(controls.target);
  }

  // 現在の向き（方位角・仰角）を保ったまま、距離だけを変更する。
  // GUI のズームスライダーから呼び出され、マウスホイールでの
  // ズームと同じ結果になる。
  function setDistance(distance) {
    const offset = camera.position.clone().sub(controls.target);
    const currentDistance = offset.length();
    if (currentDistance < 1e-6) return;

    const clamped = THREE.MathUtils.clamp(distance, controls.minDistance, controls.maxDistance);
    camera.position.copy(controls.target).addScaledVector(offset, clamped / currentDistance);
    controls.update();
  }

  return { viewState, setOrbitTarget, refreshElevation, update, getDistance, setDistance };
}
