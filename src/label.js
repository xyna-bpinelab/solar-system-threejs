import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// 天体名ラベル（CSS2DObject）を1つ生成する。
// 距離に応じて画面上のサイズが変わらない（常に一定の文字サイズで読める）
// のが CSS2DObject を使う利点。
export function createLabel(text) {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.color = '#dce6f2';
  el.style.font = '12px system-ui, sans-serif';
  el.style.padding = '0 3px';
  el.style.whiteSpace = 'nowrap';
  el.style.textShadow = '0 0 4px rgba(0, 0, 0, 0.9), 0 0 2px rgba(0, 0, 0, 0.9)';
  el.style.userSelect = 'none';

  return new CSS2DObject(el);
}
