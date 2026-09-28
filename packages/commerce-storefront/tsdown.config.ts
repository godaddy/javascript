import { defineConfig } from 'tsdown';
export default defineConfig({ entry: ['src/index.ts'], dts: true, external: [/^react($|\/)/, /^react-dom($|\/)/, 'react-router', '@tanstack/react-query'] });
