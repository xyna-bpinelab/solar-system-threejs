import * as THREE from 'three';

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

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

// カメラの見せ方を2つのモードで管理する。
//
// - orbit: 選んだ天体を中心に、仰角を指定しながら自由に見て回るモード。
//   OrbitControls によるマウス操作（水平方向の回転・ズーム）は有効のまま、
//   対象が公転で移動した分だけカメラごと平行移動させて追従させる。
// - viewpoint: 「ある天体からある天体を見る」固定の観察視点。
//   毎フレーム両天体の現在位置から視点を再計算するため、マウス操作は無効化する。
export function createCameraController({ scene, camera, controls }, bodies) {
  const viewState = { centerBody: 'sun', elevationDeg: 20 };
  let mode = null;

  function applyOrbit({ recomputeDistance }) {
    scene.updateMatrixWorld();
    const targetPos = worldPositionOf(mode.mesh, tmpA).clone();

    let distance;
    let azimuthRad;
    if (recomputeDistance) {
      distance = defaultDistance(mode.mesh);
      azimuthRad = THREE.MathUtils.degToRad(45);
    } else {
      const offset = camera.position.clone().sub(targetPos);
      distance = offset.length() || defaultDistance(mode.mesh);
      azimuthRad = Math.atan2(offset.z, offset.x);
    }

    const elevationRad = THREE.MathUtils.degToRad(viewState.elevationDeg);
    camera.position.copy(targetPos).add(sphericalOffset(distance, azimuthRad, elevationRad));
    controls.target.copy(targetPos);
    controls.update();
  }

  function applyViewpoint() {
    scene.updateMatrixWorld();
    const fromPos = worldPositionOf(mode.from, tmpA).clone();
    const toPos = worldPositionOf(mode.to, tmpB).clone();
    const fromRadius = mode.from.geometry.parameters.radius * mode.from.scale.x;

    // from の中心から to へのカメラ光線は、offset を from-to の方向線上に
    // 置くと必ず from 自身と交差し to を隠してしまう。offset を
    // 「to への方向と垂直」（ここでは常にほぼ水平な公転面と垂直な上方向）
    // に限定すれば、offset の大きさが from の半径より大きい限り
    // 光線は from の球に交差せず、to が隠れることはない。
    camera.position.copy(fromPos).addScaledVector(UP, fromRadius * 3);
    controls.target.copy(toPos);
  }

  function setOrbitTarget(name) {
    viewState.centerBody = name;
    mode = { type: 'orbit', mesh: bodies[name] };
    controls.enabled = true;
    applyOrbit({ recomputeDistance: true });
  }

  function refreshElevation() {
    if (mode?.type === 'orbit') {
      applyOrbit({ recomputeDistance: false });
    }
  }

  function setViewpoint(fromName, toName) {
    mode = { type: 'viewpoint', from: bodies[fromName], to: bodies[toName] };
    controls.enabled = false;
    applyViewpoint();
  }

  // アニメーションループから毎フレーム呼び出す。
  function update() {
    if (!mode) return;

    if (mode.type === 'orbit') {
      const targetPos = worldPositionOf(mode.mesh, tmpA);
      const delta = targetPos.clone().sub(controls.target);
      controls.target.copy(targetPos);
      camera.position.add(delta);
    } else if (mode.type === 'viewpoint') {
      applyViewpoint();
    }
  }

  return { viewState, setOrbitTarget, refreshElevation, setViewpoint, update };
}
