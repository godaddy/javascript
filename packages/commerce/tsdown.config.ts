import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/elements.ts', 'src/react.tsx'],
  dts: true,
  external: [/^react($|\/)/, /^react-dom($|\/)/],
});
