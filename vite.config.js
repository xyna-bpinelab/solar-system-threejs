import { defineConfig } from 'vite';

// GitHub Pages はプロジェクトページとして
// https://<user>.github.io/solar-system-threejs/ 配下に公開されるため、
// アセット参照を解決できるよう base をリポジトリ名に合わせる。
export default defineConfig({
  base: '/solar-system-threejs/',
});
