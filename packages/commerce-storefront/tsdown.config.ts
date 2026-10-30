import { defineConfig } from 'tsdown';
export default defineConfig({ entry: { index: 'src/index.ts', 'messages/fr-FR': 'src/locales/fr-fr.ts' }, dts: true, external: [/^react($|\/)/, /^react-dom($|\/)/, 'react-router', '@tanstack/react-query'] });
