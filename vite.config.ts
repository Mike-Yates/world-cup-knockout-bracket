import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vite';

const predictionsEntrypointPlugin = () => ({
  name: 'predictions-entrypoint',
  closeBundle() {
    const predictionsHtml = resolve('dist/predictions/index.html');
    mkdirSync(dirname(predictionsHtml), { recursive: true });
    copyFileSync(resolve('dist/index.html'), predictionsHtml);
  },
});

export default defineConfig({
  plugins: [react(), predictionsEntrypointPlugin()],
});
